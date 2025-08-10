/**
 * Provider Z-API
 * Pago (R$99/instância), recursos completos incluindo botões
 */

import axios from 'axios';
import WhatsAppProviderInterface from '../base/provider.interface.js';
import logger from '../../utils/logger.js';

export class ZAPIProvider extends WhatsAppProviderInterface {
  constructor(config) {
    super(config);
    this.name = 'z-api';
    this.type = 'premium';
    this.apiClient = null;
    
    this.capabilities = {
      buttons: true,          // Z-API suporta botões nativos
      images: true,
      videos: true,
      documents: true,
      audio: true,
      location: true,
      contacts: true,
      stickers: true,
      reactions: true,        // Z-API suporta reações
      lists: true,           // Z-API suporta listas nativas
      typing: true,
      presence: true,
      groups: true,
      broadcast: true,
      webhooks: true,
      polls: true,           // Z-API suporta enquetes
      status: true,          // Z-API permite postar status
      catalogs: true         // Z-API suporta catálogos
    };

    this.costs = {
      setup: 0,
      monthly: 0,
      perInstance: 99,       // R$ 99 por instância/mês
      perMessage: 0
    };

    this.limits = {
      messagesPerDay: 10000,
      messagesPerHour: 1000,
      instancesMax: 50,
      contactsPerInstance: 100000
    };

    this.initialize();
  }

  async initialize() {
    const baseURL = this.config.baseUrl || process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
    const clientToken = this.config.clientToken || process.env.ZAPI_CLIENT_TOKEN;
    
    if (!clientToken) {
      throw new Error('Z-API Client Token is required');
    }

    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      timeout: 30000
    });

    this.config.clientToken = clientToken;
    logger.info(`Z-API Provider initialized - URL: ${baseURL}`);
    return true;
  }

  async createInstance(instanceName, config = {}) {
    try {
      const instanceData = {
        name: instanceName,
        token: config.token || this.generateInstanceToken(),
        webhook: config.webhook || null,
        ...config
      };

      const response = await this.apiClient.post('/instances', instanceData);
      
      logger.info(`Z-API instance ${instanceName} created successfully`);
      return {
        instance: response.data,
        token: instanceData.token,
        cost: this.costs.perInstance
      };
    } catch (error) {
      logger.error(`Failed to create Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async deleteInstance(instanceName) {
    try {
      const instanceId = await this.getInstanceId(instanceName);
      const response = await this.apiClient.delete(`/instances/${instanceId}`);
      
      logger.info(`Z-API instance ${instanceName} deleted successfully`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getInstanceStatus(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/status', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      return {
        status: response.data?.connected ? 'connected' : 'disconnected',
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to get status for Z-API instance ${instanceName}:`, error.message);
      return { status: 'error', error: error.message };
    }
  }

  async connectInstance(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/qr-code/image', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Z-API instance ${instanceName} QR code retrieved`);
      return {
        qrcode: response.data?.value,
        imageUrl: response.data?.imageUrl
      };
    } catch (error) {
      logger.error(`Failed to connect Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async disconnectInstance(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.post('/disconnect', {}, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Z-API instance ${instanceName} disconnected`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to disconnect Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async sendTextMessage(instanceName, to, text, options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const messageData = {
        phone: number,
        message: text,
        ...options
      };

      const response = await this.apiClient.post('/send-text', messageData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Text message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send text message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendButtonMessage(instanceName, to, content, buttons, options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const buttonList = buttons.map(button => ({
        id: button.id || button.buttonId,
        text: button.displayText || button.title
      }));

      const messageData = {
        phone: number,
        message: content.text || content.description || content,
        title: content.title || '',
        footer: content.footer || '',
        buttonList,
        ...options
      };

      const response = await this.apiClient.post('/send-button-list', messageData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Button message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send button message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendListMessage(instanceName, to, content, sections, options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const listData = {
        phone: number,
        message: content.text || content.description || content,
        title: content.title || '',
        footer: content.footer || '',
        buttonText: content.buttonText || 'Ver opções',
        sections: sections.map(section => ({
          title: section.title,
          rows: section.rows.map(row => ({
            rowId: row.id || row.rowId,
            title: row.title,
            description: row.description || ''
          }))
        })),
        ...options
      };

      const response = await this.apiClient.post('/send-list-message', listData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`List message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send list message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendMediaMessage(instanceName, to, mediaUrl, caption = '', type = 'image', options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const endpoints = {
        image: '/send-image',
        video: '/send-video',
        audio: '/send-audio',
        document: '/send-document'
      };
      
      const endpoint = endpoints[type] || '/send-image';
      
      const messageData = {
        phone: number,
        [type]: mediaUrl,
        caption,
        ...options
      };
      
      if (type === 'document' && options.fileName) {
        messageData.fileName = options.fileName;
      }
      
      const response = await this.apiClient.post(endpoint, messageData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`${type} message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send ${type} message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendContactMessage(instanceName, to, contact, options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const contactData = {
        phone: number,
        contactName: contact.name || contact.displayName,
        contactPhone: contact.phone || contact.number,
        ...options
      };
      
      const response = await this.apiClient.post('/send-contact', contactData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Contact message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send contact message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendLocationMessage(instanceName, to, latitude, longitude, options = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const locationData = {
        phone: number,
        latitude: String(latitude),
        longitude: String(longitude),
        name: options.name || '',
        address: options.address || '',
        ...options
      };
      
      const response = await this.apiClient.post('/send-location', locationData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Location message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send location message via Z-API:`, error.message);
      throw error;
    }
  }

  async sendPollMessage(instanceName, to, question, options, config = {}) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      const pollData = {
        phone: number,
        question,
        options,
        ...config
      };
      
      const response = await this.apiClient.post('/send-poll', pollData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Poll message sent to ${number} via Z-API ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send poll message via Z-API:`, error.message);
      throw error;
    }
  }

  async getMessages(instanceName, limit = 100) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/messages', {
        headers: {
          'Client-Token': instanceToken
        },
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get messages for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getContacts(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/contacts', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get contacts for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getGroups(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/chats', {
        headers: {
          'Client-Token': instanceToken
        },
        params: { onlyGroups: true }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get groups for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async setWebhook(instanceName, webhookUrl, events = []) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      
      const webhookData = {
        webhook: {
          url: webhookUrl,
          events: events.length > 0 ? events : 'all'
        }
      };
      
      const response = await this.apiClient.post('/update-webhook', webhookData, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      logger.info(`Webhook set for Z-API instance ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to set webhook for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getWebhook(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/webhook', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get webhook for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async simulateTyping(instanceName, to, duration = 3000) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(to);
      
      await this.apiClient.post('/send-chat-state', {
        phone: number,
        state: 'composing'
      }, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      setTimeout(async () => {
        try {
          await this.apiClient.post('/send-chat-state', {
            phone: number,
            state: 'paused'
          }, {
            headers: {
              'Client-Token': instanceToken
            }
          });
        } catch (err) {
          logger.error('Failed to pause typing:', err.message);
        }
      }, duration);
      
      return { success: true };
    } catch (error) {
      logger.error(`Failed to simulate typing via Z-API:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async setPresence(instanceName, presence = 'available') {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.post('/update-presence', {
        presence
      }, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to set presence via Z-API:`, error.message);
      throw error;
    }
  }

  async getQRCode(instanceName) {
    return this.connectInstance(instanceName);
  }

  async logout(instanceName) {
    return this.disconnectInstance(instanceName);
  }

  async getProfile(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/me', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get profile for Z-API instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async checkNumberExists(instanceName, phoneNumber) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const number = this.formatPhoneNumber(phoneNumber);
      
      const response = await this.apiClient.post('/phone-exists', {
        phone: number
      }, {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to check number existence via Z-API:`, error.message);
      throw error;
    }
  }

  async getInstanceMetrics(instanceName) {
    try {
      const instanceToken = await this.getInstanceToken(instanceName);
      const response = await this.apiClient.get('/metrics', {
        headers: {
          'Client-Token': instanceToken
        }
      });
      
      return {
        messagesTotal: response.data?.messagesTotal || 0,
        messagesToday: response.data?.messagesToday || 0,
        messagesHour: response.data?.messagesHour || 0,
        contacts: response.data?.contacts || 0,
        groups: response.data?.groups || 0,
        status: response.data?.status || 'unknown',
        uptime: response.data?.uptime || 0,
        provider: this.name,
        type: this.type,
        cost: this.costs.perInstance
      };
    } catch (error) {
      logger.error(`Failed to get metrics for Z-API instance ${instanceName}:`, error.message);
      return super.getInstanceMetrics(instanceName);
    }
  }

  async healthCheck() {
    try {
      const response = await this.apiClient.get('/health');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        provider: this.name,
        type: this.type
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        provider: this.name,
        type: this.type
      };
    }
  }

  generateInstanceToken() {
    return 'zapi_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async getInstanceToken(instanceName) {
    // Em produção, isso seria buscado do banco de dados
    // Por ora, vamos usar uma estratégia simples de cache
    if (!this.instanceTokens) {
      this.instanceTokens = {};
    }
    
    if (!this.instanceTokens[instanceName]) {
      // Buscar do banco ou gerar novo
      this.instanceTokens[instanceName] = this.config.instances?.[instanceName]?.token || this.generateInstanceToken();
    }
    
    return this.instanceTokens[instanceName];
  }

  async getInstanceId(instanceName) {
    // Similar ao getInstanceToken, seria buscado do banco
    if (!this.instanceIds) {
      this.instanceIds = {};
    }
    
    if (!this.instanceIds[instanceName]) {
      this.instanceIds[instanceName] = this.config.instances?.[instanceName]?.id || instanceName;
    }
    
    return this.instanceIds[instanceName];
  }

  formatPhoneNumber(number) {
    let cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('55') && cleaned.length > 12) {
      return cleaned + '@c.us';
    }
    
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned + '@c.us';
  }
}

export default ZAPIProvider;