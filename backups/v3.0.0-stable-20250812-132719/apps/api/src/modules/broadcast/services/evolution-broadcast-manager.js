import { providerManager, PROVIDERS } from '../../../shared/providers/provider-factory.js';
import logger from '../../../utils/logger.js';

export class EvolutionBroadcastManager {
  constructor() {
    this.providerName = 'evolution-broadcast';
    this.provider = null;
    this.instances = [];
    this.currentInstanceIndex = 0;
  }

  async initialize() {
    try {
      // Get Evolution API configuration
      const config = {
        baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
        apiKey: process.env.EVOLUTION_API_KEY,
        instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'broadcast-instance'
      };

      // Register Evolution provider for broadcast
      this.provider = await providerManager.registerProvider(
        this.providerName,
        PROVIDERS.BAILEYS,
        config
      );

      // Load available instances for broadcast
      await this.loadBroadcastInstances();

      logger.info('EvolutionBroadcastManager initialized successfully', {
        instances: this.instances.length,
        provider: 'evolution-api'
      });
      return true;
    } catch (error) {
      logger.error('Failed to initialize EvolutionBroadcastManager:', error);
      throw error;
    }
  }

  async loadBroadcastInstances() {
    try {
      // Get list of available instances for broadcast
      // This can be expanded to multiple instances for load balancing
      const broadcastInstances = [
        process.env.EVOLUTION_BROADCAST_INSTANCE_1 || 'broadcast-instance-1',
        process.env.EVOLUTION_BROADCAST_INSTANCE_2 || 'broadcast-instance-2',
        process.env.EVOLUTION_BROADCAST_INSTANCE_3 || 'broadcast-instance-3'
      ].filter(instance => instance && instance !== 'broadcast-instance-1'); // Remove default if not configured

      // Add main instance as fallback
      broadcastInstances.unshift(process.env.EVOLUTION_INSTANCE_NAME || 'default-instance');

      this.instances = broadcastInstances;
      logger.info(`Loaded ${this.instances.length} broadcast instances:`, this.instances);
    } catch (error) {
      logger.error('Error loading broadcast instances:', error);
      // Fallback to single instance
      this.instances = [process.env.EVOLUTION_INSTANCE_NAME || 'default-instance'];
    }
  }

  getNextInstance() {
    if (this.instances.length === 0) {
      throw new Error('No broadcast instances available');
    }

    const instance = this.instances[this.currentInstanceIndex];
    this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length;
    
    logger.debug(`Using broadcast instance: ${instance} (${this.currentInstanceIndex}/${this.instances.length})`);
    return instance;
  }

  async sendMessage(phone, message, options = {}) {
    try {
      const instanceName = options.instance || this.getNextInstance();
      
      return await providerManager.sendMessage(
        this.providerName,
        phone,
        message,
        { ...options, instanceName }
      );
    } catch (error) {
      logger.error('EvolutionBroadcastManager sendMessage error:', error);
      throw error;
    }
  }

  async sendOptimizedTextMessage(phone, message, buttons = []) {
    try {
      // Convert buttons to optimized text format with CTAs
      let optimizedMessage = message + '\n\n';
      
      if (buttons.length > 0) {
        optimizedMessage += '🎯 *ESCOLHA UMA OPÇÃO:*\n\n';
        
        buttons.forEach((button, index) => {
          const emoji = this.getButtonEmoji(button.id);
          optimizedMessage += `${emoji} *${button.title.toUpperCase()}*\n`;
          optimizedMessage += `📱 Responda: *"${index + 1}"* ou *"${button.id}"*\n\n`;
        });

        // Add quick action links for main buttons
        if (buttons.some(btn => btn.id === 'buy_now')) {
          optimizedMessage += '🛒 *LINK DIRETO PARA COMPRA:*\n';
          optimizedMessage += '👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK\n\n';
        }

        if (buttons.some(btn => btn.id === 'join_community')) {
          optimizedMessage += '👥 *ENTRE NO GRUPO VIP:*\n';
          optimizedMessage += '👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n';
        }

        optimizedMessage += '💬 *Ou responda esta mensagem com sua dúvida!*\n';
        optimizedMessage += '_Resposta automática ativa 🤖_';
      }

      return await this.sendMessage(phone, optimizedMessage);
    } catch (error) {
      logger.error('EvolutionBroadcastManager sendOptimizedTextMessage error:', error);
      throw error;
    }
  }

  getButtonEmoji(buttonId) {
    const emojiMap = {
      'buy_now': '🛒',
      'more_info': '📋',
      'join_community': '👥',
      'complete_purchase': '✅',
      'participate_next': '🎯',
      'see_proof': '📸',
      'congratulate': '🎉',
      'reserve_quota': '🎟️',
      'view_rules': '📋',
      'set_reminder': '⏰',
      'modify_cart': '✏️',
      'clear_cart': '🗑️',
      'accept_vip': '👑',
      'vip_benefits': '📋',
      'maybe_later': '⏰',
      'add_more_quotas': '➕',
      'watch_live': '📺',
      'share_luck': '🍀'
    };
    
    return emojiMap[buttonId] || '▶️';
  }

  async sendBroadcast(phoneList, message, options = {}) {
    try {
      const results = [];
      const { buttons = [], delay = 2000, batchSize = 5, useOptimizedText = true } = options;

      logger.info('Starting Evolution broadcast', {
        recipients: phoneList.length,
        hasButtons: buttons.length > 0,
        batchSize,
        delay
      });

      // Process in smaller batches to avoid rate limits
      for (let i = 0; i < phoneList.length; i += batchSize) {
        const batch = phoneList.slice(i, i + batchSize);
        const batchPromises = [];
        const batchInstance = this.getNextInstance();

        for (const phone of batch) {
          const sendPromise = useOptimizedText && buttons.length > 0
            ? this.sendOptimizedTextMessage(phone, message, buttons)
            : this.sendMessage(phone, message, { instance: batchInstance });
          
          batchPromises.push(sendPromise);
        }

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Log batch progress
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(phoneList.length / batchSize);
        
        logger.info(`Evolution broadcast batch ${batchNumber}/${totalBatches} completed`, {
          sent: batchResults.filter(r => r.status === 'fulfilled').length,
          failed: batchResults.filter(r => r.status === 'rejected').length,
          instance: batchInstance
        });

        // Delay between batches to avoid rate limits
        if (i + batchSize < phoneList.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      const summary = {
        total: phoneList.length,
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results: results,
        provider: 'evolution-api',
        instances: this.instances.length
      };

      logger.info('Evolution broadcast completed', summary);
      return summary;
    } catch (error) {
      logger.error('EvolutionBroadcastManager sendBroadcast error:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const instanceStatuses = {};
      
      for (const instance of this.instances) {
        try {
          const status = await this.provider?.getConnectionStatus();
          instanceStatuses[instance] = {
            connected: status?.connected || false,
            status: status?.status || 'unknown'
          };
        } catch (error) {
          instanceStatuses[instance] = {
            connected: false,
            error: error.message
          };
        }
      }

      const connectedCount = Object.values(instanceStatuses).filter(s => s.connected).length;

      return {
        provider: 'evolution-api',
        totalInstances: this.instances.length,
        connectedInstances: connectedCount,
        healthPercentage: Math.round((connectedCount / this.instances.length) * 100),
        instances: instanceStatuses,
        loadBalancing: true
      };
    } catch (error) {
      logger.error('EvolutionBroadcastManager getStatus error:', error);
      return { 
        connected: false, 
        provider: 'evolution-api',
        error: error.message 
      };
    }
  }

  async validatePhoneNumbers(phoneList) {
    const validPhones = [];
    const invalidPhones = [];

    for (const phone of phoneList) {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Brazilian phone validation
      if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
        validPhones.push(cleanPhone);
      } else {
        invalidPhones.push(phone);
      }
    }

    return { validPhones, invalidPhones };
  }

  async sendTemplateMessage(phone, templateName, data = {}) {
    try {
      // Import templates dynamically
      const { getBroadcastTemplateWithButtons } = await import('../templates/broadcast-templates.js');
      const templateObj = getBroadcastTemplateWithButtons(templateName);
      
      if (!templateObj) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Compile template with data
      const message = templateObj.compile(data);
      const buttons = templateObj.buttons || [];

      // Send with optimized text format
      return await this.sendOptimizedTextMessage(phone, message, buttons);
    } catch (error) {
      logger.error('EvolutionBroadcastManager sendTemplateMessage error:', error);
      throw error;
    }
  }

  // Handle text responses for button simulation
  async processTextResponse(phone, messageText) {
    try {
      const lowerText = messageText.toLowerCase().trim();
      
      // Button simulation - respond to numbers or button IDs
      const buttonMap = {
        '1': 'buy_now',
        '2': 'more_info', 
        '3': 'join_community',
        'buy_now': 'buy_now',
        'more_info': 'more_info',
        'join_community': 'join_community',
        'comprar': 'buy_now',
        'info': 'more_info',
        'informacao': 'more_info',
        'grupo': 'join_community',
        'comunidade': 'join_community'
      };

      const buttonId = buttonMap[lowerText];
      
      if (buttonId) {
        return await this.processButtonResponse(phone, buttonId);
      }

      // Generic auto-response
      const autoResponse = `👋 *Olá!* Recebi sua mensagem: "${messageText}"

🎯 *OPÇÕES RÁPIDAS:*
• Digite *1* ou *COMPRAR* para link de compra
• Digite *2* ou *INFO* para mais informações  
• Digite *3* ou *GRUPO* para entrar na comunidade

🤖 *Resposta automática ativa*
📞 *Em breve nosso time entrará em contato!*`;

      return await this.sendMessage(phone, autoResponse);
    } catch (error) {
      logger.error('Error processing text response:', error);
    }
  }

  async processButtonResponse(phone, buttonId) {
    try {
      switch (buttonId) {
        case 'buy_now':
          return await this.sendMessage(phone, 
            '🛒 *LINK DIRETO PARA COMPRA*\n\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK\n\n🍀 *Boa sorte no sorteio!*\n_Império Premiações_ 🏆'
          );
          
        case 'more_info':
          return await this.sendMessage(phone,
            '📋 *INFORMAÇÕES DETALHADAS*\n\n🏆 *Prêmio:* R$ 170.000,00\n🎯 *Sorteio:* Loteria Federal\n📅 *Data:* Em breve\n🎟️ *Cotas limitadas*\n\n💎 *Transparência total*\n📞 *Dúvidas? Responda esta mensagem!*'
          );
          
        case 'join_community':
          return await this.sendMessage(phone,
            '👥 *COMUNIDADE VIP IMPÉRIO*\n\n🔗 *Entre no grupo:*\n👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n✨ *Benefícios:*\n• Novidades em primeira mão\n• Promoções exclusivas\n• Suporte direto\n\n🎉 *Seja bem-vindo(a)!*'
          );
          
        default:
          return await this.sendMessage(phone,
            '👋 *Obrigado pela interação!*\n\n🤖 Resposta processada automaticamente\n📞 Em breve entraremos em contato\n\n_Império Premiações_ 🏆'
          );
      }
    } catch (error) {
      logger.error('Error processing button response:', error);
    }
  }
}

// Singleton instance
let evolutionBroadcastManagerInstance = null;

export const getEvolutionBroadcastManager = async () => {
  if (!evolutionBroadcastManagerInstance) {
    evolutionBroadcastManagerInstance = new EvolutionBroadcastManager();
    await evolutionBroadcastManagerInstance.initialize();
  }
  return evolutionBroadcastManagerInstance;
};

export default EvolutionBroadcastManager;