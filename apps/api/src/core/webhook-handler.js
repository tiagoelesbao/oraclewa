/**
 * Webhook Handler Escalável
 * Processa webhooks dinamicamente baseado no cliente
 */
import logger from '../utils/logger.js';
import clientManager from './client-manager.js';
import templateManager from './template-manager.js';
import SimpleWhatsAppManager from '../services/whatsapp/simple-manager.js';
import webhookPoolManager from '../services/whatsapp/webhook-pool-manager.js';

class ScalableWebhookHandler {
  constructor() {
    this.whatsappManagers = new Map(); // clientId -> WhatsApp Manager
    this.initialized = false;
  }

  /**
   * Inicializa o handler
   */
  async initialize() {
    try {
      logger.info('🔗 Initializing Scalable Webhook Handler...');
      await this.initializeWhatsAppManagers();
      this.initialized = true;
      logger.info('✅ Scalable Webhook Handler initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Webhook Handler:', error);
      throw error;
    }
  }

  /**
   * Inicializa WhatsApp managers para cada cliente
   */
  async initializeWhatsAppManagers() {
    const clients = clientManager.getActiveClients();
    
    for (const client of clients) {
      try {
        const clientConfig = clientManager.getClient(client.id);
        
        // Verificar se cliente tem pool de webhooks configurado
        if (clientConfig.webhookPool?.enabled) {
          logger.info(`🏊 Configuring webhook pool for client: ${client.id}`);
          
          await webhookPoolManager.configureWebhookPool(client.id, {
            instances: clientConfig.webhookPool.instances,
            strategy: clientConfig.webhookPool.strategy || 'round-robin',
            maxRetries: clientConfig.webhookPool.maxRetries || 3,
            healthCheck: clientConfig.webhookPool.healthCheck !== false,
            fallbackToAny: clientConfig.webhookPool.fallbackToAny !== false,
            antiban: clientConfig.webhookPool.antiban || {}
          });
          
        } else {
          // Fallback para instância única (método antigo)
          const activeInstance = clientManager.getActiveInstance(client.id, 'recovery');
          
          const whatsappConfig = {
            apiUrl: clientConfig.infrastructure?.servers?.hetzner ? 
              `http://${clientConfig.infrastructure.servers.hetzner.ip}:${clientConfig.infrastructure.servers.hetzner.port}` :
              process.env.EVOLUTION_API_URL,
            apiKey: process.env.EVOLUTION_API_KEY,
            instanceName: activeInstance.name,
            timeout: 10000
          };
          
          const manager = new SimpleWhatsAppManager(whatsappConfig);
          this.whatsappManagers.set(client.id, manager);
          
          logger.info(`📱 Single WhatsApp Manager initialized for client: ${client.id} (instance: ${activeInstance.name})`);
        }
        
      } catch (error) {
        logger.warn(`⚠️ Failed to initialize WhatsApp Manager for client ${client.id}:`, error.message);
      }
    }
  }

  /**
   * Processa webhook de forma escalável
   */
  async processWebhook(clientId, webhookType, payload) {
    try {
      if (!this.initialized) {
        throw new Error('Webhook Handler not initialized');
      }

      logger.info(`📥 Processing webhook: ${clientId}/${webhookType}`);
      
      // Validar cliente
      const client = clientManager.getClient(clientId);
      const whatsappManager = this.whatsappManagers.get(clientId);
      
      if (!whatsappManager) {
        throw new Error(`WhatsApp Manager not found for client: ${clientId}`);
      }

      // Extrair dados do payload usando configuração do cliente
      logger.debug(`📦 Raw payload for ${clientId}/${webhookType}:`, JSON.stringify(payload));
      const extractedData = this.extractPayloadData(client, webhookType, payload);
      logger.debug(`🔍 Extracted data:`, extractedData);
      
      // Validar dados obrigatórios
      this.validatePayloadData(client, extractedData);
      
      // Gerar mensagem usando template do cliente
      const templateType = this.mapWebhookToTemplate(webhookType);
      const message = await templateManager.generateMessage(clientId, templateType, extractedData);
      
      // Enviar via WhatsApp usando pool ou instância única
      let result;
      if (client.webhookPool?.enabled) {
        // Usar pool de webhooks
        const messageData = {
          to: extractedData.phone,
          text: message
        };
        result = await webhookPoolManager.sendMessage(clientId, messageData);
      } else {
        // Usar instância única (método antigo)
        result = await whatsappManager.sendMessage(extractedData.phone, message);
      }
      
      logger.info(`✅ Webhook processed successfully: ${clientId}/${webhookType}`);
      
      return {
        success: true,
        client: clientId,
        type: webhookType,
        customer: extractedData.customerName,
        phone: extractedData.phone,
        total: extractedData.total,
        messageResult: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`❌ Webhook processing failed: ${clientId}/${webhookType}:`, error);
      throw error;
    }
  }

  /**
   * Extrai dados do payload usando configuração do cliente
   */
  extractPayloadData(client, webhookType, payload) {
    const transformers = client.webhookConfig?.payloadTransformers?.[webhookType];
    
    if (!transformers) {
      // Fallback para formato padrão
      return this.extractStandardPayload(payload);
    }
    
    const extracted = {};
    
    // Aplicar transformers configurados
    for (const [outputKey, jsonPath] of Object.entries(transformers)) {
      extracted[outputKey] = this.getValueFromPath(payload, jsonPath);
    }
    
    // Mapear para formato padrão
    return {
      customerName: extracted.userName || 'Cliente',
      phone: extracted.userPhone || 'N/A',
      total: extracted.orderTotal || 0,
      productName: extracted.productTitle || 'Produto',
      orderId: extracted.orderId,
      email: extracted.userEmail,
      cpf: extracted.userCpf
    };
  }

  /**
   * Extração padrão de payload (fallback)
   */
  extractStandardPayload(payload) {
    // Tentar múltiplos formatos de payload
    const userData = payload.data?.user || payload.user || {};
    const productData = payload.data?.product || payload.product || {};
    
    // Tentar diferentes campos para telefone
    const phone = userData.phone || 
                  payload.data?.phone || 
                  payload.phone || 
                  userData.telefone ||
                  'N/A';
    
    // Tentar diferentes campos para nome
    const customerName = userData.name || 
                        userData.nome ||
                        payload.data?.name ||
                        payload.name ||
                        payload.customerName ||
                        'Cliente';
    
    // Tentar diferentes campos para valor
    const total = payload.data?.total || 
                 payload.total ||
                 payload.value ||
                 payload.amount ||
                 0;
    
    // Tentar diferentes campos para produto
    const productName = productData.title || 
                       productData.name ||
                       productData.nome ||
                       payload.data?.productName ||
                       payload.productName ||
                       'Produto';
    
    return {
      customerName,
      phone, 
      total,
      productName,
      orderId: payload.data?.id || payload.id,
      email: userData.email || payload.email,
      cpf: userData.cpf || payload.cpf
    };
  }

  /**
   * Obtém valor de um caminho JSON (ex: "data.user.phone")
   */
  getValueFromPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Valida dados extraídos do payload
   */
  validatePayloadData(client, data) {
    // Campos essenciais para funcionamento (sempre validar)
    const essentialFields = ['phone', 'customerName'];
    
    for (const field of essentialFields) {
      if (!data[field] || data[field] === 'N/A') {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    // Validar formato do telefone se especificado
    if (client.webhookConfig?.validation?.phoneFormat === 'brazilian') {
      const cleanPhone = data.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('Invalid Brazilian phone format');
      }
    }
  }

  /**
   * Mapeia tipo de webhook para template
   */
  mapWebhookToTemplate(webhookType) {
    const mapping = {
      'order_paid': 'order-paid',
      'temp-order-paid': 'order-paid',
      'order_expired': 'order-expired',
      'temp-order-expired': 'order-expired'
    };
    
    return mapping[webhookType] || webhookType;
  }

  /**
   * Obtém estatísticas dos webhooks
   */
  getWebhookStats() {
    return {
      totalClients: this.whatsappManagers.size,
      activeManagers: Array.from(this.whatsappManagers.entries()).map(([clientId, manager]) => ({
        clientId,
        stats: manager.getStats()
      })),
      initialized: this.initialized
    };
  }

  /**
   * Obtém manager de um cliente específico
   */
  getClientManager(clientId) {
    const manager = this.whatsappManagers.get(clientId);
    if (!manager) {
      throw new Error(`WhatsApp Manager not found for client: ${clientId}`);
    }
    return manager;
  }

  /**
   * Recarrega configuração de um cliente
   */
  async reloadClient(clientId) {
    logger.info(`🔄 Reloading webhook handler for client: ${clientId}`);
    
    // Remover manager existente
    this.whatsappManagers.delete(clientId);
    
    // Recarregar cliente no clientManager
    await clientManager.reloadClient(clientId);
    
    // Reinicializar manager
    const client = clientManager.getClient(clientId);
    if (client.status === 'active') {
      await this.initializeWhatsAppManagers();
    }
    
    logger.info(`✅ Client ${clientId} webhook handler reloaded`);
  }
}

// Instância singleton
const scalableWebhookHandler = new ScalableWebhookHandler();

export default scalableWebhookHandler;