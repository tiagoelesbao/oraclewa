/**
 * Provider Evolution API com Baileys
 * Gratuito, sem botões/recursos avançados
 */

import axios from 'axios';
import WhatsAppProviderInterface from '../base/provider.interface.js';
import logger from '../../utils/logger.js';

export class EvolutionBaileysProvider extends WhatsAppProviderInterface {
  constructor(config) {
    super(config);
    this.name = 'evolution-baileys';
    this.type = 'free';
    this.apiClient = null;
    
    this.capabilities = {
      buttons: false,         // Baileys não suporta botões nativos
      images: true,
      videos: true,
      documents: true,
      audio: true,
      location: true,
      contacts: true,
      stickers: true,
      reactions: false,
      lists: false,          // Baileys não suporta listas nativas
      typing: true,
      presence: true,
      groups: true,
      broadcast: true,
      webhooks: true
    };

    this.costs = {
      setup: 0,
      monthly: 0,
      perInstance: 0,        // GRATUITO
      perMessage: 0
    };

    this.limits = {
      messagesPerDay: 5000,
      messagesPerHour: 500,
      instancesMax: 100,     // Sem limite real, apenas recursos do servidor
      contactsPerInstance: 50000
    };

    this.initialize();
  }

  async initialize() {
    const baseURL = this.config.baseUrl || process.env.EVOLUTION_API_URL;
    const apiKey = this.config.apiKey || process.env.EVOLUTION_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error('Evolution API URL and API Key are required');
    }

    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      timeout: 30000
    });

    logger.info(`Evolution Baileys Provider initialized - URL: ${baseURL}`);
    return true;
  }

  async createInstance(instanceName, config = {}) {
    try {
      const response = await this.apiClient.post('/instance/create', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        ...config
      });

      logger.info(`Instance ${instanceName} created successfully with Baileys`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to create instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async deleteInstance(instanceName) {
    try {
      const response = await this.apiClient.delete(`/instance/delete/${instanceName}`);
      logger.info(`Instance ${instanceName} deleted successfully`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getInstanceStatus(instanceName) {
    try {
      const response = await this.apiClient.get(`/instance/connectionState/${instanceName}`);
      return {
        status: response.data?.instance?.state || 'disconnected',
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to get status for instance ${instanceName}:`, error.message);
      return { status: 'error', error: error.message };
    }
  }

  async connectInstance(instanceName) {
    try {
      const response = await this.apiClient.get(`/instance/connect/${instanceName}`);
      logger.info(`Instance ${instanceName} connect initiated`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to connect instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async disconnectInstance(instanceName) {
    try {
      const response = await this.apiClient.delete(`/instance/logout/${instanceName}`);
      logger.info(`Instance ${instanceName} disconnected`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to disconnect instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async sendTextMessage(instanceName, to, text, options = {}) {
    try {
      const number = this.formatPhoneNumber(to);
      
      const messageData = {
        number,
        text,
        delay: options.delay || 1200,
        ...options
      };

      const response = await this.apiClient.post(`/message/sendText/${instanceName}`, messageData);
      
      logger.info(`Text message sent to ${number} via ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send text message:`, error.message);
      throw error;
    }
  }

  async sendButtonMessage(instanceName, to, content, buttons, options = {}) {
    logger.warn('Baileys does not support native buttons. Sending as text with options listed.');
    
    let text = content.text || content;
    if (content.title) text = `*${content.title}*\n\n${text}`;
    if (content.description) text += `\n\n${content.description}`;
    
    if (buttons && buttons.length > 0) {
      text += '\n\n*Opções:*\n';
      buttons.forEach((button, index) => {
        text += `${index + 1}. ${button.displayText || button.title}\n`;
      });
      text += '\n_Digite o número da opção desejada_';
    }
    
    if (content.footer) text += `\n\n_${content.footer}_`;
    
    return this.sendTextMessage(instanceName, to, text, options);
  }

  async sendListMessage(instanceName, to, content, sections, options = {}) {
    logger.warn('Baileys does not support native lists. Sending as formatted text.');
    
    let text = content.title ? `*${content.title}*\n\n` : '';
    text += content.text || content.description || '';
    
    if (sections && sections.length > 0) {
      sections.forEach(section => {
        text += `\n\n*${section.title}*\n`;
        if (section.rows) {
          section.rows.forEach((row, index) => {
            text += `${index + 1}. ${row.title}`;
            if (row.description) text += ` - ${row.description}`;
            text += '\n';
          });
        }
      });
    }
    
    if (content.footer) text += `\n\n_${content.footer}_`;
    
    return this.sendTextMessage(instanceName, to, text, options);
  }

  async sendMediaMessage(instanceName, to, mediaUrl, caption = '', type = 'image', options = {}) {
    try {
      const number = this.formatPhoneNumber(to);
      
      const endpoints = {
        image: 'sendImage',
        video: 'sendVideo',
        audio: 'sendWhatsAppAudio',
        document: 'sendDocument'
      };
      
      const endpoint = endpoints[type] || 'sendImage';
      
      const messageData = {
        number,
        media: mediaUrl,
        caption,
        delay: options.delay || 1200,
        ...options
      };
      
      if (type === 'document' && options.fileName) {
        messageData.fileName = options.fileName;
      }
      
      const response = await this.apiClient.post(`/message/${endpoint}/${instanceName}`, messageData);
      
      logger.info(`${type} message sent to ${number} via ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send ${type} message:`, error.message);
      throw error;
    }
  }

  async sendContactMessage(instanceName, to, contact, options = {}) {
    try {
      const number = this.formatPhoneNumber(to);
      
      const messageData = {
        number,
        contact: Array.isArray(contact) ? contact : [contact],
        delay: options.delay || 1200,
        ...options
      };
      
      const response = await this.apiClient.post(`/message/sendContact/${instanceName}`, messageData);
      
      logger.info(`Contact message sent to ${number} via ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send contact message:`, error.message);
      throw error;
    }
  }

  async sendLocationMessage(instanceName, to, latitude, longitude, options = {}) {
    try {
      const number = this.formatPhoneNumber(to);
      
      const messageData = {
        number,
        latitude,
        longitude,
        name: options.name || '',
        address: options.address || '',
        delay: options.delay || 1200,
        ...options
      };
      
      const response = await this.apiClient.post(`/message/sendLocation/${instanceName}`, messageData);
      
      logger.info(`Location message sent to ${number} via ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send location message:`, error.message);
      throw error;
    }
  }

  async getMessages(instanceName, limit = 100) {
    try {
      const response = await this.apiClient.get(`/chat/findMessages/${instanceName}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get messages for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getContacts(instanceName) {
    try {
      const response = await this.apiClient.get(`/chat/findContacts/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get contacts for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getGroups(instanceName) {
    try {
      const response = await this.apiClient.get(`/group/fetchAllGroups/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get groups for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async setWebhook(instanceName, webhookUrl, events = []) {
    try {
      const webhookData = {
        url: webhookUrl,
        webhook_by_events: false,
        events: events.length > 0 ? events : [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_SET',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      };
      
      const response = await this.apiClient.post(`/webhook/set/${instanceName}`, webhookData);
      
      logger.info(`Webhook set for instance ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to set webhook for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async getWebhook(instanceName) {
    try {
      const response = await this.apiClient.get(`/webhook/find/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get webhook for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async simulateTyping(instanceName, to, duration = 3000) {
    try {
      const number = this.formatPhoneNumber(to);
      
      await this.apiClient.post(`/chat/updatePresence/${instanceName}`, {
        number,
        presence: 'composing'
      });
      
      setTimeout(async () => {
        try {
          await this.apiClient.post(`/chat/updatePresence/${instanceName}`, {
            number,
            presence: 'paused'
          });
        } catch (err) {
          logger.error('Failed to pause typing:', err.message);
        }
      }, duration);
      
      return { success: true };
    } catch (error) {
      logger.error(`Failed to simulate typing:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async setPresence(instanceName, presence = 'available') {
    try {
      const response = await this.apiClient.post(`/chat/updatePresence/${instanceName}`, {
        presence
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to set presence:`, error.message);
      throw error;
    }
  }

  async getQRCode(instanceName) {
    try {
      const response = await this.apiClient.get(`/instance/qrcode/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get QR code for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async logout(instanceName) {
    return this.disconnectInstance(instanceName);
  }

  async getProfile(instanceName) {
    try {
      const response = await this.apiClient.get(`/instance/profilePicture/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get profile for instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  async checkNumberExists(instanceName, phoneNumber) {
    try {
      const number = this.formatPhoneNumber(phoneNumber);
      const response = await this.apiClient.get(`/chat/checkNumber/${instanceName}`, {
        params: { number }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to check number existence:`, error.message);
      throw error;
    }
  }

  async getInstanceMetrics(instanceName) {
    try {
      const status = await this.getInstanceStatus(instanceName);
      
      return {
        messagesTotal: 0,
        messagesToday: 0,
        messagesHour: 0,
        contacts: 0,
        groups: 0,
        status: status.status,
        uptime: 0,
        provider: this.name,
        type: this.type
      };
    } catch (error) {
      logger.error(`Failed to get metrics for instance ${instanceName}:`, error.message);
      return super.getInstanceMetrics(instanceName);
    }
  }

  async healthCheck() {
    try {
      const response = await this.apiClient.get('/instance/list');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        instances: response.data?.length || 0,
        provider: this.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        provider: this.name
      };
    }
  }

  formatPhoneNumber(number) {
    let cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('55') && cleaned.length > 12) {
      return cleaned;
    }
    
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }
}

export default EvolutionBaileysProvider;