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
    const pool = this.pools.get(clientId);
    if (!pool) {
      throw new Error(`No webhook pool configured for client: ${clientId}`);
    }

    const healthyInstances = await this.getHealthyInstances(clientId);
    
    if (healthyInstances.length === 0) {
      logger.warn(`⚠️ No healthy instances available for ${clientId}, checking fallback`);
      
      if (pool.fallbackToAny) {
        // Tentar qualquer instância como último recurso
        return this.selectFallbackInstance(pool.instances);
      }
      
      throw new Error(`No healthy instances available for webhook pool: ${clientId}`);
    }

    let selectedInstance;
    
    switch (pool.strategy) {
      case 'round-robin':
        selectedInstance = this.selectRoundRobin(clientId, healthyInstances);
        break;
      case 'random':
        selectedInstance = this.selectRandom(healthyInstances);
        break;
      case 'health-based':
        selectedInstance = this.selectHealthBased(healthyInstances);
        break;
      default:
        selectedInstance = this.selectRoundRobin(clientId, healthyInstances);
    }

    logger.info(`📱 Selected instance ${selectedInstance} for ${clientId} (strategy: ${pool.strategy})`);
    return selectedInstance;
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
    
    // Ordenar instâncias para garantir sequência previsível (1, 2, 3)
    const sortedInstances = [...instances].sort();
    
    const lastUsedInstance = this.lastUsedInstance.get(clientId);
    let selectedInstance;
    
    if (!lastUsedInstance) {
      // Primeira seleção - sempre começar com a primeira instância ordenada
      selectedInstance = sortedInstances[0];
    } else {
      // Encontrar índice da última instância usada
      const lastIndex = sortedInstances.indexOf(lastUsedInstance);
      
      if (lastIndex === -1) {
        // Se não encontrou, começar do início
        selectedInstance = sortedInstances[0];
      } else {
        // Próxima instância na sequência ordenada
        const nextIndex = (lastIndex + 1) % sortedInstances.length;
        selectedInstance = sortedInstances[nextIndex];
      }
    }
    
    // Atualizar registro da última instância usada
    this.lastUsedInstance.set(clientId, selectedInstance);
    
    logger.info(`🔄 Sequential ${clientId}: lastUsed=${lastUsedInstance || 'none'}, selected=${selectedInstance} (${sortedInstances.indexOf(selectedInstance) + 1}/${sortedInstances.length}) from [${sortedInstances.join(' → ')}]`);
    
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

      const isConnected = response.data?.instance?.state === 'open';
      const health = {
        status: isConnected ? 'healthy' : 'unhealthy',
        state: response.data?.instance?.state || 'unknown',
        lastCheck: new Date().toISOString(),
        score: isConnected ? 100 : 0,
        latency: response.headers['x-response-time'] || 0
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
      
      // Simular digitação
      await axios.post(`${evolutionUrl}/chat/sendPresence/${instanceName}`, {
        number: phoneNumber,
        presence: 'composing',
        delay: 1000
      }, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      // Aguardar tempo realista de digitação
      const typingTime = 2000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      // Parar digitação
      await axios.post(`${evolutionUrl}/chat/sendPresence/${instanceName}`, {
        number: phoneNumber,
        presence: 'paused',
        delay: 1000
      }, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
    } catch (error) {
      logger.warn(`⚠️ Could not simulate typing for ${instanceName}:`, error.message);
    }
  }

  async sendMessageToInstance(instanceName, messageData) {
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    logger.info(`📱 Sending to ${messageData.to} via ${instanceName}`);
    logger.debug(`📝 Message text: "${messageData.text}"`);
    
    // USAR MÉTODO DIRETO QUE FUNCIONA - HTTP NATIVO COM CHARSET
    return new Promise((resolve, reject) => {
      try {
        const payload = JSON.stringify({
          number: messageData.to,
          text: messageData.text
        });
        
        const url = new URL(`/message/sendText/${instanceName}`, evolutionUrl);
        
        const requestOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(payload, 'utf8')
          },
          timeout: 10000
        };
        
        const req = http.request(requestOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            logger.info(`✅ WhatsApp sent successfully: ${res.statusCode}`);
            resolve({ success: true, status: res.statusCode, data });
          });
        });
        
        req.on('error', (error) => {
          logger.error(`❌ WhatsApp send failed: ${error.message}`);
          reject(error);
        });
        
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.write(payload);
        req.end();
        
      } catch (error) {
        logger.error(`❌ WhatsApp function error: ${error.message}`);
        reject(error);
      }
    });
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