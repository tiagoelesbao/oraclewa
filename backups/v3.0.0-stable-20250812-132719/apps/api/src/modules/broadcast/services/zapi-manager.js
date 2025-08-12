import { providerManager, PROVIDERS } from '../../../shared/providers/provider-factory.js';
import logger from '../../../utils/logger.js';

export class ZapiManager {
  constructor() {
    this.providerName = 'zapi-broadcast';
    this.provider = null;
  }

  async initialize() {
    try {
      // Get ZAPI provider configuration
      const config = {
        baseUrl: process.env.ZAPI_API_URL || 'https://api.z-api.io',
        token: process.env.ZAPI_TOKEN,
        instanceId: process.env.ZAPI_INSTANCE_ID
      };

      // Register ZAPI provider
      this.provider = await providerManager.registerProvider(
        this.providerName,
        PROVIDERS.ZAPI,
        config
      );

      logger.info('ZapiManager initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ZapiManager:', error);
      throw error;
    }
  }

  async sendMessage(phone, message, options = {}) {
    try {
      return await providerManager.sendMessage(
        this.providerName,
        phone,
        message,
        options
      );
    } catch (error) {
      logger.error('ZapiManager sendMessage error:', error);
      throw error;
    }
  }

  async sendButtonMessage(phone, message, buttons = []) {
    try {
      return await providerManager.sendButtonMessage(
        this.providerName,
        phone,
        message,
        buttons
      );
    } catch (error) {
      logger.error('ZapiManager sendButtonMessage error:', error);
      throw error;
    }
  }

  async sendInteractiveMessage(phone, data) {
    try {
      const { message, buttons = [], title, footer } = data;
      
      // Enhanced interactive message format
      const interactiveButtons = buttons.map((button, index) => ({
        id: button.id || `btn-${index}`,
        title: button.title || button.displayText,
        type: button.type || 'reply'
      }));

      return await this.sendButtonMessage(phone, message, interactiveButtons);
    } catch (error) {
      logger.error('ZapiManager sendInteractiveMessage error:', error);
      throw error;
    }
  }

  async sendBroadcast(phoneList, message, options = {}) {
    try {
      const results = [];
      const { buttons = [], delay = 1000, batchSize = 10 } = options;

      // Process in batches to avoid rate limits
      for (let i = 0; i < phoneList.length; i += batchSize) {
        const batch = phoneList.slice(i, i + batchSize);
        const batchPromises = [];

        for (const phone of batch) {
          if (buttons.length > 0) {
            batchPromises.push(
              this.sendButtonMessage(phone, message, buttons)
            );
          } else {
            batchPromises.push(
              this.sendMessage(phone, message)
            );
          }
        }

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Delay between batches
        if (i + batchSize < phoneList.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        logger.info(`Broadcast batch ${Math.floor(i / batchSize) + 1} completed`, {
          sent: batchResults.filter(r => r.status === 'fulfilled').length,
          failed: batchResults.filter(r => r.status === 'rejected').length
        });
      }

      const summary = {
        total: phoneList.length,
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results: results
      };

      logger.info('Broadcast completed', summary);
      return summary;
    } catch (error) {
      logger.error('ZapiManager sendBroadcast error:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      return await this.provider?.getConnectionStatus() || { connected: false };
    } catch (error) {
      logger.error('ZapiManager getStatus error:', error);
      return { connected: false, error: error.message };
    }
  }

  async validatePhoneNumbers(phoneList) {
    const validPhones = [];
    const invalidPhones = [];

    for (const phone of phoneList) {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Basic validation for Brazilian numbers
      if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
        validPhones.push(cleanPhone);
      } else {
        invalidPhones.push(phone);
      }
    }

    return { validPhones, invalidPhones };
  }

  // Template helpers for broadcast
  async sendTemplateMessage(phone, templateName, data = {}) {
    try {
      // Import templates dynamically
      const { getBroadcastTemplate } = await import('../templates/broadcast-templates.js');
      const template = getBroadcastTemplate(templateName);
      
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Compile template with data
      const message = template(data);
      
      // Check if template has buttons
      if (template.buttons) {
        return await this.sendButtonMessage(phone, message, template.buttons);
      } else {
        return await this.sendMessage(phone, message);
      }
    } catch (error) {
      logger.error('ZapiManager sendTemplateMessage error:', error);
      throw error;
    }
  }
}

// Singleton instance
let zapiManagerInstance = null;

export const getZapiManager = async () => {
  if (!zapiManagerInstance) {
    zapiManagerInstance = new ZapiManager();
    await zapiManagerInstance.initialize();
  }
  return zapiManagerInstance;
};

export default ZapiManager;