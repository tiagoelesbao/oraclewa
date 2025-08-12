import { getZapiManager } from './zapi-manager.js';
import { getEvolutionBroadcastManager } from './evolution-broadcast-manager.js';
import logger from '../../../utils/logger.js';

export const BROADCAST_PROVIDERS = {
  ZAPI: 'zapi',
  EVOLUTION: 'evolution'
};

export class BroadcastProviderSelector {
  constructor() {
    this.zapiManager = null;
    this.evolutionManager = null;
    this.defaultProvider = process.env.DEFAULT_BROADCAST_PROVIDER || BROADCAST_PROVIDERS.EVOLUTION;
  }

  async initialize() {
    try {
      logger.info('=== INITIALIZING BROADCAST PROVIDER SELECTOR ===');

      // Initialize Evolution manager (always available)
      try {
        this.evolutionManager = await getEvolutionBroadcastManager();
        logger.info('✅ Evolution broadcast manager ready');
      } catch (error) {
        logger.error('❌ Evolution broadcast manager failed:', error);
      }

      // Initialize ZAPI manager (if enabled and configured)
      if (process.env.BROADCAST_MODULE_ENABLED === 'true' && 
          process.env.ZAPI_TOKEN && 
          process.env.ZAPI_INSTANCE_ID) {
        try {
          this.zapiManager = await getZapiManager();
          logger.info('✅ ZAPI broadcast manager ready');
        } catch (error) {
          logger.error('⚠️ ZAPI broadcast manager failed (will use Evolution):', error);
        }
      } else {
        logger.info('ℹ️ ZAPI not configured - using Evolution only');
      }

      // Set intelligent default
      if (this.zapiManager && this.evolutionManager) {
        logger.info(`🎯 Both providers available - default: ${this.defaultProvider}`);
      } else if (this.evolutionManager) {
        this.defaultProvider = BROADCAST_PROVIDERS.EVOLUTION;
        logger.info('🎯 Using Evolution as default provider');
      } else if (this.zapiManager) {
        this.defaultProvider = BROADCAST_PROVIDERS.ZAPI;
        logger.info('🎯 Using ZAPI as default provider');
      } else {
        throw new Error('No broadcast providers available');
      }

      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize broadcast provider selector:', error);
      throw error;
    }
  }

  getAvailableProviders() {
    const providers = [];

    if (this.evolutionManager) {
      providers.push({
        id: BROADCAST_PROVIDERS.EVOLUTION,
        name: 'Evolution API',
        cost: 'Gratuito',
        features: {
          textMessages: true,
          interactiveButtons: false,
          optimizedCTAs: true,
          multipleInstances: true,
          unlimitedMessages: true
        },
        description: 'Instâncias ilimitadas sem custo adicional'
      });
    }

    if (this.zapiManager) {
      providers.push({
        id: BROADCAST_PROVIDERS.ZAPI,
        name: 'Z-API',
        cost: 'R$ 100/mês',
        features: {
          textMessages: true,
          interactiveButtons: true,
          optimizedCTAs: true,
          reactions: true,
          polls: true
        },
        description: 'Botões interativos e recursos avançados'
      });
    }

    return providers;
  }

  async getProviderManager(providerType = null) {
    const provider = providerType || this.defaultProvider;

    switch (provider) {
      case BROADCAST_PROVIDERS.ZAPI:
        if (!this.zapiManager) {
          logger.warn('ZAPI not available, falling back to Evolution');
          return this.evolutionManager;
        }
        return this.zapiManager;

      case BROADCAST_PROVIDERS.EVOLUTION:
        if (!this.evolutionManager) {
          logger.warn('Evolution not available, falling back to ZAPI');
          return this.zapiManager;
        }
        return this.evolutionManager;

      default:
        logger.error(`Unknown provider: ${provider}`);
        return this.evolutionManager || this.zapiManager;
    }
  }

  async sendMessage(phone, message, options = {}) {
    try {
      const { provider, buttons = [], ...otherOptions } = options;
      const manager = await this.getProviderManager(provider);

      if (!manager) {
        throw new Error('No broadcast provider available');
      }

      logger.info('Sending broadcast message', {
        provider: manager.constructor.name,
        hasButtons: buttons.length > 0,
        phone: phone.slice(0, -4) + '****'
      });

      // ZAPI supports native buttons
      if (manager === this.zapiManager && buttons.length > 0) {
        return await manager.sendButtonMessage(phone, message, buttons);
      }
      
      // Evolution uses optimized text with CTAs
      if (manager === this.evolutionManager && buttons.length > 0) {
        return await manager.sendOptimizedTextMessage(phone, message, buttons);
      }

      // Fallback to simple message
      return await manager.sendMessage(phone, message, otherOptions);
    } catch (error) {
      logger.error('Error in provider selector sendMessage:', error);
      throw error;
    }
  }

  async sendBroadcast(phoneList, message, options = {}) {
    try {
      const { provider, buttons = [], ...otherOptions } = options;
      const manager = await this.getProviderManager(provider);

      if (!manager) {
        throw new Error('No broadcast provider available');
      }

      logger.info('Starting provider-selected broadcast', {
        provider: manager.constructor.name,
        recipients: phoneList.length,
        hasButtons: buttons.length > 0
      });

      return await manager.sendBroadcast(phoneList, message, {
        buttons,
        ...otherOptions
      });
    } catch (error) {
      logger.error('Error in provider selector sendBroadcast:', error);
      throw error;
    }
  }

  async sendTemplateMessage(phone, templateName, data = {}, options = {}) {
    try {
      const { provider } = options;
      const manager = await this.getProviderManager(provider);

      if (!manager) {
        throw new Error('No broadcast provider available');
      }

      logger.info('Sending template message', {
        provider: manager.constructor.name,
        template: templateName,
        phone: phone.slice(0, -4) + '****'
      });

      return await manager.sendTemplateMessage(phone, templateName, data);
    } catch (error) {
      logger.error('Error in provider selector sendTemplateMessage:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const status = {
        available: [],
        default: this.defaultProvider,
        timestamp: new Date().toISOString()
      };

      if (this.evolutionManager) {
        try {
          const evolutionStatus = await this.evolutionManager.getStatus();
          status.available.push({
            provider: BROADCAST_PROVIDERS.EVOLUTION,
            name: 'Evolution API',
            status: evolutionStatus,
            cost: 'Free',
            recommended: !this.zapiManager
          });
        } catch (error) {
          status.available.push({
            provider: BROADCAST_PROVIDERS.EVOLUTION,
            name: 'Evolution API',
            status: { connected: false, error: error.message },
            cost: 'Free'
          });
        }
      }

      if (this.zapiManager) {
        try {
          const zapiStatus = await this.zapiManager.getStatus();
          status.available.push({
            provider: BROADCAST_PROVIDERS.ZAPI,
            name: 'Z-API',
            status: zapiStatus,
            cost: 'R$ 100/month',
            recommended: true
          });
        } catch (error) {
          status.available.push({
            provider: BROADCAST_PROVIDERS.ZAPI,
            name: 'Z-API',
            status: { connected: false, error: error.message },
            cost: 'R$ 100/month'
          });
        }
      }

      return status;
    } catch (error) {
      logger.error('Error getting provider selector status:', error);
      return {
        available: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Intelligent provider recommendation based on needs
  recommendProvider(requirements = {}) {
    const {
      needsButtons = false,
      budget = 'low',
      messageVolume = 'medium',
      features = []
    } = requirements;

    const recommendations = [];

    // If buttons are required, ZAPI is the best choice
    if (needsButtons && this.zapiManager) {
      recommendations.push({
        provider: BROADCAST_PROVIDERS.ZAPI,
        score: 100,
        reason: 'Native interactive buttons support',
        pros: ['Interactive buttons', 'Professional appearance', 'Advanced features'],
        cons: ['Additional cost (R$ 100/month)']
      });
    }

    // Evolution is great for cost-effectiveness
    if (this.evolutionManager) {
      const score = needsButtons ? 75 : 95;
      recommendations.push({
        provider: BROADCAST_PROVIDERS.EVOLUTION,
        score: score,
        reason: budget === 'low' ? 'No additional costs' : 'Cost-effective solution',
        pros: ['No additional cost', 'Unlimited instances', 'Optimized CTAs'],
        cons: needsButtons ? ['No native buttons', 'Text-based CTAs only'] : []
      });
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    return {
      recommendations,
      bestChoice: recommendations[0],
      canUseBoth: this.zapiManager && this.evolutionManager
    };
  }

  // Cost calculation helper
  calculateMonthlyCost(messageCount = 0, provider = null) {
    const costs = {};

    if (this.evolutionManager) {
      costs[BROADCAST_PROVIDERS.EVOLUTION] = {
        fixed: 0,
        variable: 0,
        total: 0,
        description: 'Unlimited messages at no additional cost'
      };
    }

    if (this.zapiManager) {
      const variableCost = messageCount * 0.0033; // R$ 0.0033 per message
      costs[BROADCAST_PROVIDERS.ZAPI] = {
        fixed: 100,
        variable: variableCost,
        total: 100 + variableCost,
        description: `R$ 100 fixed + R$ ${variableCost.toFixed(2)} for ${messageCount} messages`
      };
    }

    if (provider) {
      return costs[provider] || null;
    }

    return costs;
  }
}

// Singleton instance
let providerSelectorInstance = null;

export const getBroadcastProviderSelector = async () => {
  if (!providerSelectorInstance) {
    providerSelectorInstance = new BroadcastProviderSelector();
    await providerSelectorInstance.initialize();
  }
  return providerSelectorInstance;
};

export default BroadcastProviderSelector;