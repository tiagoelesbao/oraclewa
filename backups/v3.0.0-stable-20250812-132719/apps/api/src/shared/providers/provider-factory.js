import axios from 'axios';
import logger from '../../utils/logger.js';

// Provider types
export const PROVIDERS = {
  BAILEYS: 'baileys',
  ZAPI: 'zapi'
};

// Abstract WhatsApp Provider
export class WhatsAppProvider {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  async initialize() {
    throw new Error('Method initialize must be implemented');
  }

  async sendMessage(phone, message, options = {}) {
    throw new Error('Method sendMessage must be implemented');
  }

  async sendButtonMessage(phone, message, buttons = []) {
    throw new Error('Method sendButtonMessage must be implemented');
  }

  async sendListMessage(phone, message, list = []) {
    throw new Error('Method sendListMessage must be implemented');
  }

  async getConnectionStatus() {
    throw new Error('Method getConnectionStatus must be implemented');
  }
}

// Baileys Provider (Current system)
export class BaileysProvider extends WhatsAppProvider {
  constructor(config) {
    super(config);
    this.instances = [];
    this.currentInstanceIndex = 0;
  }

  async initialize() {
    try {
      // Initialize Evolution API instances (current implementation)
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        timeout: 30000
      });

      logger.info('BaileysProvider initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize BaileysProvider:', error);
      throw error;
    }
  }

  async sendMessage(phone, message, options = {}) {
    try {
      // Current implementation from evolution-manager.js
      const formattedPhone = phone.replace(/\D/g, '');
      const instanceName = this.getCurrentInstance();
      
      const response = await this.client.post(`/message/sendText/${instanceName}`, {
        number: formattedPhone,
        text: message
      });

      logger.info(`Message sent via Baileys to ${formattedPhone}`);
      return {
        success: true,
        provider: PROVIDERS.BAILEYS,
        messageId: response.data?.key?.id,
        response: response.data
      };
    } catch (error) {
      logger.error('BaileysProvider sendMessage error:', error);
      throw error;
    }
  }

  async sendButtonMessage(phone, message, buttons = []) {
    try {
      // Baileys doesn't support interactive buttons
      // Convert to optimized text format (current implementation)
      let enhancedMessage = message + '\n\n';
      enhancedMessage += '🎯 *PRÓXIMOS PASSOS:*\n\n';
      
      buttons.forEach((button, index) => {
        if (button.id === 'join_community') {
          enhancedMessage += '🔗 *ENTRE NA NOSSA COMUNIDADE VIP*\n';
          enhancedMessage += 'Acesse o link abaixo para participar:\n';
          enhancedMessage += '👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n';
        } else if (button.id === 'confirm_receipt') {
          enhancedMessage += '✅ *CONFIRME SEU RECEBIMENTO*\n';
          enhancedMessage += 'Responda com *"OK"* para confirmar\n\n';
        } else if (button.id === 'renew_order') {
          enhancedMessage += '🔄 *RENOVAR PARTICIPAÇÃO*\n';
          enhancedMessage += 'Responda *"RENOVAR"* para continuar\n\n';
        }
      });
      
      enhancedMessage += '🍀 *Boa sorte no sorteio!*\n';
      enhancedMessage += '_Império Premiações - Realizando sonhos_ 🏆';

      return await this.sendMessage(phone, enhancedMessage);
    } catch (error) {
      logger.error('BaileysProvider sendButtonMessage error:', error);
      throw error;
    }
  }

  async sendListMessage(phone, message, list = []) {
    // Convert list to text format for Baileys
    return await this.sendButtonMessage(phone, message, list);
  }

  async getConnectionStatus() {
    try {
      const instanceName = this.getCurrentInstance();
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return {
        connected: response.data?.instance?.state === 'open',
        provider: PROVIDERS.BAILEYS,
        status: response.data?.instance?.state || 'unknown'
      };
    } catch (error) {
      logger.error('BaileysProvider getConnectionStatus error:', error);
      return { connected: false, provider: PROVIDERS.BAILEYS, error: error.message };
    }
  }

  getCurrentInstance() {
    // Simplified instance selection (expand based on current logic)
    return process.env.EVOLUTION_INSTANCE_NAME || 'default-instance';
  }
}

// ZAPI Provider (New system for broadcast)
export class ZapiProvider extends WhatsAppProvider {
  constructor(config) {
    super(config);
  }

  async initialize() {
    try {
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Test connection
      const status = await this.getConnectionStatus();
      if (!status.connected) {
        throw new Error('ZAPI instance not connected');
      }

      logger.info('ZapiProvider initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ZapiProvider:', error);
      throw error;
    }
  }

  async sendMessage(phone, message, options = {}) {
    try {
      const url = `/instances/${this.config.instanceId}/token/${this.config.token}/send-text`;
      
      const response = await this.client.post(url, {
        phone: phone.replace(/\D/g, ''),
        message: message
      });

      logger.info(`Message sent via ZAPI to ${phone}`);
      return {
        success: true,
        provider: PROVIDERS.ZAPI,
        messageId: response.data?.messageId,
        response: response.data
      };
    } catch (error) {
      logger.error('ZapiProvider sendMessage error:', error);
      throw error;
    }
  }

  async sendButtonMessage(phone, message, buttons = []) {
    try {
      const url = `/instances/${this.config.instanceId}/token/${this.config.token}/send-button-list`;
      
      // Format buttons for ZAPI
      const formattedButtons = buttons.map((button, index) => ({
        buttonId: button.id || `btn-${index}`,
        buttonText: {
          displayText: button.title || button.displayText || `Option ${index + 1}`
        },
        type: 1
      }));

      const response = await this.client.post(url, {
        phone: phone.replace(/\D/g, ''),
        message: message,
        buttonText: "Escolha uma opção:",
        buttons: formattedButtons,
        footer: "Império Premiações 🏆"
      });

      logger.info(`Button message sent via ZAPI to ${phone}`, {
        buttonsCount: formattedButtons.length
      });

      return {
        success: true,
        provider: PROVIDERS.ZAPI,
        messageId: response.data?.messageId,
        response: response.data,
        buttonsCount: formattedButtons.length
      };
    } catch (error) {
      logger.error('ZapiProvider sendButtonMessage error:', error);
      throw error;
    }
  }

  async sendListMessage(phone, message, list = []) {
    try {
      const url = `/instances/${this.config.instanceId}/token/${this.config.token}/send-list`;
      
      const response = await this.client.post(url, {
        phone: phone.replace(/\D/g, ''),
        message: message,
        buttonText: "Ver opções",
        sections: [{
          title: "Opções disponíveis",
          rows: list.map((item, index) => ({
            rowId: item.id || `row-${index}`,
            title: item.title || `Item ${index + 1}`,
            description: item.description || ""
          }))
        }]
      });

      logger.info(`List message sent via ZAPI to ${phone}`);
      return {
        success: true,
        provider: PROVIDERS.ZAPI,
        messageId: response.data?.messageId,
        response: response.data
      };
    } catch (error) {
      logger.error('ZapiProvider sendListMessage error:', error);
      throw error;
    }
  }

  async getConnectionStatus() {
    try {
      const url = `/instances/${this.config.instanceId}/token/${this.config.token}/status`;
      const response = await this.client.get(url);
      
      return {
        connected: response.data?.connected === true,
        provider: PROVIDERS.ZAPI,
        status: response.data?.status || 'unknown',
        phone: response.data?.phone || null
      };
    } catch (error) {
      logger.error('ZapiProvider getConnectionStatus error:', error);
      return { connected: false, provider: PROVIDERS.ZAPI, error: error.message };
    }
  }
}

// Provider Factory
export const createProvider = (type, config) => {
  switch (type) {
    case PROVIDERS.BAILEYS:
      return new BaileysProvider(config);
    case PROVIDERS.ZAPI:
      return new ZapiProvider(config);
    default:
      throw new Error(`Provider type '${type}' is not supported. Available: ${Object.values(PROVIDERS).join(', ')}`);
  }
};

// Provider Manager - Singleton to manage multiple providers
class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  async registerProvider(name, type, config) {
    try {
      const provider = createProvider(type, config);
      await provider.initialize();
      this.providers.set(name, provider);
      
      if (!this.defaultProvider) {
        this.defaultProvider = name;
      }
      
      logger.info(`Provider '${name}' (${type}) registered successfully`);
      return provider;
    } catch (error) {
      logger.error(`Failed to register provider '${name}':`, error);
      throw error;
    }
  }

  getProvider(name) {
    if (!name && this.defaultProvider) {
      name = this.defaultProvider;
    }
    
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    
    return provider;
  }

  async sendMessage(providerName, phone, message, options = {}) {
    const provider = this.getProvider(providerName);
    return await provider.sendMessage(phone, message, options);
  }

  async sendButtonMessage(providerName, phone, message, buttons = []) {
    const provider = this.getProvider(providerName);
    return await provider.sendButtonMessage(phone, message, buttons);
  }

  getAllProviders() {
    return Array.from(this.providers.keys());
  }

  async getStatus() {
    const status = {};
    for (const [name, provider] of this.providers) {
      try {
        status[name] = await provider.getConnectionStatus();
      } catch (error) {
        status[name] = { connected: false, error: error.message };
      }
    }
    return status;
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();

export default {
  PROVIDERS,
  WhatsAppProvider,
  BaileysProvider,
  ZapiProvider,
  createProvider,
  providerManager
};