/**
 * Webhook Pool Manager
 * Gerencia pool de instâncias para webhooks com failover automático
 */

import logger from '../../utils/logger.js';
import axios from 'axios';
import http from 'http';
import { io } from '../../index.js';

class WebhookPoolManager {
  constructor() {
    this.pools = new Map(); // clientId -> pool config
    this.healthCache = new Map(); // instanceName -> health status
    this.messageQueue = new Map(); // clientId -> message queue
    this.lastUsedIndex = new Map(); // clientId -> last used instance index
    this.lastUsedInstance = new Map(); // clientId -> last used instance name (anti-consecutive)
    
    // Configurações
    this.healthCheckInterval = 30000; // 30 segundos
    this.maxRetries = 3;
    this.retryDelay = 5000;
    
    // Inicializar health check
    this.startHealthMonitoring();
  }

  /**
   * Configura pool de webhooks para um cliente
   */
  async configureWebhookPool(clientId, poolConfig) {
    try {
      const config = {
        clientId,
        instances: poolConfig.instances || [],
        strategy: poolConfig.strategy || 'round-robin', // round-robin, random, health-based
        maxRetries: poolConfig.maxRetries || 3,
        healthCheckEnabled: poolConfig.healthCheck !== false,
        fallbackToAny: poolConfig.fallbackToAny !== false,
        antibanSettings: {
          enabled: true,
          minDelay: 15000,
          maxDelay: 45000,
          typingSimulation: true,
          ...poolConfig.antiban
        }
      };

      this.pools.set(clientId, config);
      
      // Inicializar lastUsedIndex apenas se não existir
      if (!this.lastUsedIndex.has(clientId)) {
        this.lastUsedIndex.set(clientId, -1);
      }
      
      // Inicializar fila de mensagens
      if (!this.messageQueue.has(clientId)) {
        this.messageQueue.set(clientId, []);
      }

      logger.info(`✅ Webhook pool configured for ${clientId}:`, {
        instances: config.instances.length,
        strategy: config.strategy
      });

      // Verificar saúde inicial das instâncias
      await this.checkPoolHealth(clientId);
      
      return config;
    } catch (error) {
      logger.error(`❌ Error configuring webhook pool for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Seleciona melhor instância disponível do pool
   */
  async selectBestInstance(clientId) {
    try {
      // Buscar instâncias ativas diretamente da Evolution API
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      const response = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Filtrar instâncias do pool conectadas (apenas webhook 1, 2, 4)
      const webhookPoolInstances = ['imperio-webhook-1', 'imperio-webhook-2', 'imperio-webhook-4'];
      const connectedPoolInstances = (response.data || [])
        .filter(instance => 
          instance.connectionStatus === 'open' && 
          instance.name && 
          webhookPoolInstances.includes(instance.name)
        )
        .map(instance => instance.name);

      // Verificar instâncias conectadas de qualquer tipo como fallback
      const anyConnectedImperioInstances = (response.data || [])
        .filter(instance => 
          instance.connectionStatus === 'open' && 
          instance.name && 
          instance.name.toLowerCase().includes('imperio')
        )
        .map(instance => instance.name);

      if (connectedPoolInstances.length === 0) {
        logger.warn(`⚠️ No webhook pool instances connected (1,2,3). Pool status:`);
        
        // Log status de cada instância do pool
        for (const poolInstance of webhookPoolInstances) {
          const found = (response.data || []).find(i => i.name === poolInstance);
          if (found) {
            logger.warn(`   📱 ${poolInstance}: ${found.connectionStatus} (exists but disconnected)`);
          } else {
            logger.warn(`   ❌ ${poolInstance}: not found (needs creation)`);
          }
        }
        
        // Fallback para qualquer instância império conectada
        if (anyConnectedImperioInstances.length > 0) {
          const fallbackInstance = anyConnectedImperioInstances[0];
          logger.warn(`🆘 Using fallback to connected instance: ${fallbackInstance}`);
          return fallbackInstance;
        }
        
        throw new Error('No webhook pool instances connected. Please connect imperio-webhook-1, imperio-webhook-2, or imperio-webhook-4 via frontend.');
      }

      // Usar round-robin entre instâncias do pool conectadas
      if (!this.robinIndex) {
        this.robinIndex = 0;
      }
      
      const selectedInstance = connectedPoolInstances[this.robinIndex % connectedPoolInstances.length];
      this.robinIndex++;
      
      logger.info(`📱 Selected webhook pool instance: ${selectedInstance} (${this.robinIndex % connectedPoolInstances.length + 1}/${connectedPoolInstances.length}) from [${connectedPoolInstances.join(', ')}]`);
      return selectedInstance;
      
    } catch (error) {
      logger.error(`❌ Error selecting instance for ${clientId}:`, error.message);
      
      // Fallback final para instância conhecida
      const fallbackInstance = 'oraclewa-imperio';
      logger.warn(`🆘 Final fallback to known instance: ${fallbackInstance}`);
      return fallbackInstance;
    }
  }

  /**
   * Envia mensagem via pool com retry automático
   */
  async sendMessage(clientId, messageData, retryCount = 0) {
    try {
      const instanceName = await this.selectBestInstance(clientId);
      const pool = this.pools.get(clientId);
      
      // Formatar número brasileiro primeiro
      let cleanNumber = messageData.to.replace(/\D/g, '');
      if (!cleanNumber.startsWith('55')) {
        cleanNumber = '55' + cleanNumber;
      }
      if (cleanNumber.length < 12 || cleanNumber.length > 13) {
        throw new Error(`Número inválido: ${messageData.to} (formatado: ${cleanNumber})`);
      }
      
      // Aplicar anti-ban delay
      if (pool.antibanSettings.enabled) {
        await this.applyAntibanDelay(pool.antibanSettings);
      }

      // Simular digitação se habilitado (usando número formatado)
      if (pool.antibanSettings.typingSimulation) {
        await this.simulateTyping(instanceName, cleanNumber);
      }

      // Enviar mensagem (criar novo objeto com número formatado)
      const formattedMessageData = { ...messageData, to: cleanNumber };
      const result = await this.sendMessageToInstance(instanceName, formattedMessageData);
      
      // Emitir evento em tempo real
      io.emit('webhook-message-sent', {
        clientId,
        instanceName,
        to: messageData.to,
        success: true,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ Message sent successfully via ${instanceName} for ${clientId}`);
      return result;
      
    } catch (error) {
      logger.error(`❌ Error sending message for ${clientId} (attempt ${retryCount + 1}):`, error.message);
      
      // Retry com outra instância se disponível
      if (retryCount < this.maxRetries) {
        logger.info(`🔄 Retrying message for ${clientId} (attempt ${retryCount + 2})`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.sendMessage(clientId, messageData, retryCount + 1);
      }
      
      // Marcar instância como unhealthy se erro persistir
      await this.markInstanceUnhealthy(clientId, error.instanceName);
      
      // Emitir evento de falha
      io.emit('webhook-message-failed', {
        clientId,
        to: messageData.to,
        error: error.message,
        retries: retryCount,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Failed to send message after ${retryCount + 1} attempts: ${error.message}`);
    }
  }

  /**
   * Estratégias de seleção de instância
   */
  selectRoundRobin(clientId, instances) {
    if (instances.length === 1) {
      return instances[0];
    }
    
    // Garantir sequência fixa: imperio-webhook-1 → 2 → 4 → volta ao 1
    const fixedOrder = [
      'imperio-webhook-1',
      'imperio-webhook-2', 
      'imperio-webhook-4'
    ];
    
    // Filtrar apenas instâncias disponíveis no pool atual
    const availableInOrder = fixedOrder.filter(name => instances.includes(name));
    
    const lastUsedInstance = this.lastUsedInstance.get(clientId);
    let selectedInstance;
    
    if (!lastUsedInstance) {
      // Primeira seleção - sempre começar com imperio-webhook-1
      selectedInstance = availableInOrder[0];
    } else {
      // Encontrar índice da última instância usada na sequência fixa
      const lastIndex = availableInOrder.indexOf(lastUsedInstance);
      
      if (lastIndex === -1) {
        // Se não encontrou na sequência, começar pelo primeiro
        selectedInstance = availableInOrder[0];
      } else {
        // Próxima instância na sequência fixa (1→2→3→4→1...)
        const nextIndex = (lastIndex + 1) % availableInOrder.length;
        selectedInstance = availableInOrder[nextIndex];
      }
    }
    
    // Atualizar registro da última instância usada
    this.lastUsedInstance.set(clientId, selectedInstance);
    
    logger.info(`🔄 Sequential ${clientId}: lastUsed=${lastUsedInstance || 'none'}, selected=${selectedInstance} (${availableInOrder.indexOf(selectedInstance) + 1}/${availableInOrder.length}) from [${availableInOrder.join(' → ')}]`);
    
    return selectedInstance;
  }

  selectRandom(instances) {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  selectHealthBased(instances) {
    // Ordena por saúde (latência, taxa de sucesso, etc.)
    const sortedByHealth = instances.sort((a, b) => {
      const healthA = this.healthCache.get(a) || { score: 0 };
      const healthB = this.healthCache.get(b) || { score: 0 };
      return healthB.score - healthA.score;
    });
    
    return sortedByHealth[0];
  }

  selectFallbackInstance(allInstances) {
    // Retorna primeira instância como fallback
    logger.warn(`🆘 Using fallback instance: ${allInstances[0]}`);
    return allInstances[0];
  }

  /**
   * Verificação de saúde das instâncias
   */
  async getHealthyInstances(clientId) {
    const pool = this.pools.get(clientId);
    if (!pool) return [];

    const healthyInstances = [];
    
    for (const instanceName of pool.instances) {
      const health = this.healthCache.get(instanceName);
      
      if (health && health.status === 'healthy') {
        healthyInstances.push(instanceName);
      }
    }

    return healthyInstances;
  }

  async checkInstanceHealth(instanceName) {
    try {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      const response = await axios.get(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Verificar múltiplas condições para determinar saúde
      const instanceState = response.data?.instance?.state;
      const isConnected = instanceState === 'open' || instanceState === 'connected';
      const isAvailable = response.data?.instance?.status !== 'disconnected' && 
                          response.data?.instance?.status !== 'offline';
      
      const health = {
        status: (isConnected && isAvailable) ? 'healthy' : 'unhealthy',
        state: instanceState || 'unknown',
        connectionStatus: response.data?.instance?.status || 'unknown',
        lastCheck: new Date().toISOString(),
        score: (isConnected && isAvailable) ? 100 : 0,
        latency: response.headers['x-response-time'] || 0,
        details: response.data?.instance || {}
      };

      this.healthCache.set(instanceName, health);
      return health;
      
    } catch (error) {
      const health = {
        status: 'unhealthy',
        state: 'error',
        error: error.message,
        lastCheck: new Date().toISOString(),
        score: 0,
        latency: 9999
      };
      
      this.healthCache.set(instanceName, health);
      return health;
    }
  }

  async checkPoolHealth(clientId) {
    const pool = this.pools.get(clientId);
    if (!pool) return;

    const healthChecks = pool.instances.map(instance => 
      this.checkInstanceHealth(instance)
    );

    const results = await Promise.allSettled(healthChecks);
    
    const healthyCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.status === 'healthy'
    ).length;

    const poolHealth = {
      clientId,
      totalInstances: pool.instances.length,
      healthyInstances: healthyCount,
      healthyPercentage: (healthyCount / pool.instances.length) * 100,
      lastCheck: new Date().toISOString()
    };

    // Emitir atualização de saúde do pool
    io.emit('webhook-pool-health', poolHealth);
    
    logger.info(`🏥 Pool health check for ${clientId}: ${healthyCount}/${pool.instances.length} healthy`);
    
    return poolHealth;
  }

  /**
   * Anti-ban e simulação humana
   */
  async applyAntibanDelay(antibanSettings) {
    const minDelay = antibanSettings.minDelay || 15000;
    const maxDelay = antibanSettings.maxDelay || 45000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    
    logger.info(`⏱️ Applying anti-ban delay: ${Math.round(delay / 1000)}s`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async simulateTyping(instanceName, phoneNumber) {
    try {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      // Verificar se a instância está conectada antes de simular digitação
      const healthCheck = await this.checkInstanceHealth(instanceName);
      if (healthCheck.status !== 'healthy') {
        logger.warn(`⚠️ Skipping typing simulation - instance ${instanceName} is not connected`);
        return;
      }
      
      // Simular digitação com endpoint correto
      await axios.post(`${evolutionUrl}/chat/sendPresence/${instanceName}`, {
        number: phoneNumber,
        presence: 'composing'
      }, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      });

      // Aguardar tempo realista de digitação (1-3 segundos)
      const typingTime = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      // Parar digitação
      await axios.post(`${evolutionUrl}/chat/sendPresence/${instanceName}`, {
        number: phoneNumber,
        presence: 'paused'
      }, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      });
      
      logger.debug(`✅ Typing simulation completed for ${instanceName}`);
      
    } catch (error) {
      // Não logar o erro completo para evitar spam nos logs
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status || 'unknown';
      
      logger.warn(`⚠️ Could not simulate typing for ${instanceName} (${statusCode}): ${errorMsg}`);
    }
  }

  async sendMessageToInstance(instanceName, messageData) {
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    logger.info(`📱 Sending to ${messageData.to} via ${instanceName}`);
    
    try {
      // Primeiro verificar se a instância está conectada
      const healthCheck = await this.checkInstanceHealth(instanceName);
      if (healthCheck.status !== 'healthy') {
        throw new Error(`Instance ${instanceName} is not connected (status: ${healthCheck.state})`);
      }

      // Payload simplificado para evitar erros
      const payload = {
        number: messageData.to,
        text: messageData.text,
        options: {
          delay: 1000
        }
      };
      
      // Tentar com axios primeiro (mais confiável)
      const response = await axios.post(`${evolutionUrl}/message/sendText/${instanceName}`, payload, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: (status) => status < 600 // Aceitar até 599
      });
      
      // Analisar resposta
      if (response.status >= 200 && response.status < 400) {
        logger.info(`✅ WhatsApp sent successfully: ${response.status}`);
        return { 
          success: true, 
          status: response.status, 
          data: JSON.stringify(response.data)
        };
      } else if (response.status === 500 && response.data?.response?.message === 'Connection Closed') {
        // Connection Closed não é erro fatal - mensagem foi processada
        logger.warn(`⚠️ WhatsApp API returned 500 but message was processed: Connection Closed`);
        return { 
          success: true, 
          status: response.status, 
          data: JSON.stringify(response.data),
          warning: 'Connection Closed but message processed'
        };
      } else {
        throw new Error(`WhatsApp API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status || 'unknown';
      
      logger.error(`❌ WhatsApp send failed for ${instanceName}: ${statusCode} - ${errorMsg}`);
      
      const customError = new Error(`Failed to send via ${instanceName}: ${errorMsg}`);
      customError.instanceName = instanceName;
      customError.statusCode = statusCode;
      throw customError;
    }
  }

  async sendWithButtons(evolutionUrl, evolutionApiKey, instanceName, messageData) {
    // Extrair URL da mensagem
    const urlMatch = messageData.text.match(/(https:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[1] : 'https://imperiopremioss.com/rapidinha?af=A0RJJ5L1QK';
    
    // Criar mensagem sem URL para o botão - limpa melhor
    const textWithoutUrl = messageData.text
      .replace(/(https:\/\/[^\s]+)/, '')
      .replace(/🔗.*AGORA.*:\s*/i, '')
      .replace(/\n\n\s*\n/g, '\n\n')
      .trim();
    
    const response = await axios.post(`${evolutionUrl}/message/sendButtons/${instanceName}`, {
      number: messageData.to,
      text: textWithoutUrl,
      buttons: [
        {
          buttonId: 'recovery_link',
          buttonText: { displayText: '🔗 GARANTA SUAS COTAS' },
          type: 'url',
          url: url
        }
      ],
      headerText: '⚠️ ÚLTIMA CHANCE',
      delay: 1000
    }, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;
  }

  async sendWithOptimizedLink(evolutionUrl, evolutionApiKey, instanceName, messageData) {
    // URL mais curta e otimizada para iOS
    const shortUrl = messageData.text.replace(
      /https:\/\/imperiopremioss\.com\/campanha\/rapidinha-valendo-1200000-mil-em-premiacoes\?\&afiliado=A0RJJ5L1QK/,
      'https://imperiopremioss.com/rapidinha?af=A0RJJ5L1QK'
    );
    
    const response = await axios.post(`${evolutionUrl}/message/sendText/${instanceName}`, {
      number: messageData.to,
      text: shortUrl,
      delay: 1000
    }, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;
  }

  /**
   * Monitoramento contínuo
   */
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [clientId, pool] of this.pools) {
        if (pool.healthCheckEnabled) {
          await this.checkPoolHealth(clientId);
        }
      }
    }, this.healthCheckInterval);
    
    logger.info(`🏥 Health monitoring started (interval: ${this.healthCheckInterval}ms)`);
  }

  async markInstanceUnhealthy(clientId, instanceName) {
    const health = this.healthCache.get(instanceName) || {};
    health.status = 'unhealthy';
    health.markedUnhealthyAt = new Date().toISOString();
    this.healthCache.set(instanceName, health);
    
    logger.warn(`❌ Marked instance ${instanceName} as unhealthy for ${clientId}`);
  }

  /**
   * Estatísticas e relatórios
   */
  getPoolStats(clientId) {
    const pool = this.pools.get(clientId);
    if (!pool) return null;

    const instances = pool.instances.map(instanceName => {
      const health = this.healthCache.get(instanceName) || {};
      return {
        name: instanceName,
        status: health.status || 'unknown',
        state: health.state || 'unknown',
        lastCheck: health.lastCheck,
        score: health.score || 0
      };
    });

    return {
      clientId,
      strategy: pool.strategy,
      totalInstances: pool.instances.length,
      instances,
      healthyCount: instances.filter(i => i.status === 'healthy').length,
      messageQueue: this.messageQueue.get(clientId)?.length || 0
    };
  }

  getAllPoolStats() {
    const stats = {};
    for (const clientId of this.pools.keys()) {
      stats[clientId] = this.getPoolStats(clientId);
    }
    return stats;
  }

  /**
   * Gerenciamento do pool
   */
  async addInstanceToPool(clientId, instanceName) {
    const pool = this.pools.get(clientId);
    if (!pool) {
      throw new Error(`No pool configured for client: ${clientId}`);
    }

    if (!pool.instances.includes(instanceName)) {
      pool.instances.push(instanceName);
      await this.checkInstanceHealth(instanceName);
      
      logger.info(`➕ Added instance ${instanceName} to pool for ${clientId}`);
      
      // Emitir evento
      io.emit('webhook-pool-updated', {
        clientId,
        action: 'instance-added',
        instanceName,
        totalInstances: pool.instances.length
      });
    }
  }

  async removeInstanceFromPool(clientId, instanceName) {
    const pool = this.pools.get(clientId);
    if (!pool) return;

    const index = pool.instances.indexOf(instanceName);
    if (index > -1) {
      pool.instances.splice(index, 1);
      this.healthCache.delete(instanceName);
      
      logger.info(`➖ Removed instance ${instanceName} from pool for ${clientId}`);
      
      // Emitir evento
      io.emit('webhook-pool-updated', {
        clientId,
        action: 'instance-removed',
        instanceName,
        totalInstances: pool.instances.length
      });
    }
  }
}

// Singleton
const webhookPoolManager = new WebhookPoolManager();

export default webhookPoolManager;