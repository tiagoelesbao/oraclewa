/**
 * Provider Manager
 * Gerencia a seleção e uso inteligente de providers WhatsApp
 */

import EvolutionBaileysProvider from '../evolution-baileys/index.js';
import ZAPIProvider from '../zapi/index.js';
import logger from '../../utils/logger.js';

class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.clientProviders = new Map(); // Mapa cliente -> provider preferido
    this.instanceProviders = new Map(); // Mapa instância -> provider
    this.costTracking = new Map(); // Rastreamento de custos por cliente
  }

  async initialize(config = {}) {
    try {
      // Inicializar Evolution Baileys (sempre disponível - gratuito)
      if (config.evolutionBaileys !== false) {
        const evolutionConfig = config.evolutionBaileys || {};
        const evolutionProvider = new EvolutionBaileysProvider(evolutionConfig);
        await evolutionProvider.initialize();
        this.providers.set('evolution-baileys', evolutionProvider);
        
        // Define como padrão se não houver outro
        if (!this.defaultProvider) {
          this.defaultProvider = 'evolution-baileys';
        }
        
        logger.info('Evolution Baileys provider initialized (FREE)');
      }

      // Inicializar Z-API (se configurado - pago)
      if (config.zapi && config.zapi.clientToken) {
        const zapiProvider = new ZAPIProvider(config.zapi);
        await zapiProvider.initialize();
        this.providers.set('z-api', zapiProvider);
        
        logger.info('Z-API provider initialized (PREMIUM - R$99/instance)');
      }

      // Configurar providers por cliente
      if (config.clientMappings) {
        for (const [clientId, providerName] of Object.entries(config.clientMappings)) {
          if (this.providers.has(providerName)) {
            this.clientProviders.set(clientId, providerName);
            logger.info(`Client ${clientId} mapped to provider ${providerName}`);
          }
        }
      }

      logger.info(`Provider Manager initialized with ${this.providers.size} provider(s)`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize Provider Manager:', error);
      throw error;
    }
  }

  /**
   * Seleciona o provider mais adequado baseado em critérios
   */
  selectProvider(criteria = {}) {
    const {
      clientId,
      instanceName,
      requireButtons = false,
      requireLists = false,
      requireMedia = false,
      budget = 'free',
      priority = 'cost' // 'cost', 'features', 'reliability'
    } = criteria;

    // 1. Verificar se cliente tem provider específico
    if (clientId && this.clientProviders.has(clientId)) {
      const clientProvider = this.clientProviders.get(clientId);
      logger.info(`Using client-specific provider for ${clientId}: ${clientProvider}`);
      return this.providers.get(clientProvider);
    }

    // 2. Verificar se instância já tem provider associado
    if (instanceName && this.instanceProviders.has(instanceName)) {
      const instanceProvider = this.instanceProviders.get(instanceName);
      return this.providers.get(instanceProvider);
    }

    // 3. Seleção baseada em recursos necessários
    if (requireButtons || requireLists) {
      // Precisa de recursos avançados - usar Z-API se disponível
      if (this.providers.has('z-api')) {
        logger.info('Selected Z-API for advanced features (buttons/lists)');
        return this.providers.get('z-api');
      } else {
        logger.warn('Advanced features requested but Z-API not available, falling back to Evolution Baileys');
        return this.providers.get('evolution-baileys');
      }
    }

    // 4. Seleção baseada em orçamento
    if (budget === 'premium' && this.providers.has('z-api')) {
      logger.info('Selected Z-API based on premium budget');
      return this.providers.get('z-api');
    }

    // 5. Seleção baseada em prioridade
    if (priority === 'features' && this.providers.has('z-api')) {
      return this.providers.get('z-api');
    }

    // 6. Padrão: usar Evolution Baileys (gratuito)
    logger.info('Selected Evolution Baileys (default/free option)');
    return this.providers.get('evolution-baileys') || this.providers.get(this.defaultProvider);
  }

  /**
   * Cria uma instância usando o provider mais adequado
   */
  async createInstance(instanceName, criteria = {}, config = {}) {
    try {
      const provider = this.selectProvider({ ...criteria, instanceName });
      
      if (!provider) {
        throw new Error('No suitable provider available');
      }

      // Registrar associação instância -> provider
      this.instanceProviders.set(instanceName, provider.name);

      // Criar instância
      const result = await provider.createInstance(instanceName, config);

      // Rastrear custos se for Z-API
      if (provider.name === 'z-api' && criteria.clientId) {
        this.trackCost(criteria.clientId, 'instance', provider.costs.perInstance);
      }

      logger.info(`Instance ${instanceName} created with provider ${provider.name}`);
      return {
        ...result,
        provider: provider.name,
        costs: provider.getCosts()
      };
    } catch (error) {
      logger.error(`Failed to create instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Envia mensagem usando o provider apropriado
   */
  async sendMessage(instanceName, type, params = {}) {
    try {
      const provider = this.getInstanceProvider(instanceName);
      
      if (!provider) {
        throw new Error(`No provider found for instance ${instanceName}`);
      }

      let result;
      
      switch (type) {
        case 'text':
          result = await provider.sendTextMessage(instanceName, params.to, params.text, params.options);
          break;
          
        case 'button':
          if (provider.isCapable('buttons')) {
            result = await provider.sendButtonMessage(instanceName, params.to, params.content, params.buttons, params.options);
          } else {
            logger.warn(`Provider ${provider.name} doesn't support buttons, sending as text`);
            result = await provider.sendButtonMessage(instanceName, params.to, params.content, params.buttons, params.options);
          }
          break;
          
        case 'list':
          if (provider.isCapable('lists')) {
            result = await provider.sendListMessage(instanceName, params.to, params.content, params.sections, params.options);
          } else {
            logger.warn(`Provider ${provider.name} doesn't support lists, sending as text`);
            result = await provider.sendListMessage(instanceName, params.to, params.content, params.sections, params.options);
          }
          break;
          
        case 'media':
          result = await provider.sendMediaMessage(instanceName, params.to, params.mediaUrl, params.caption, params.mediaType, params.options);
          break;
          
        case 'contact':
          result = await provider.sendContactMessage(instanceName, params.to, params.contact, params.options);
          break;
          
        case 'location':
          result = await provider.sendLocationMessage(instanceName, params.to, params.latitude, params.longitude, params.options);
          break;
          
        case 'typing':
          result = await provider.simulateTyping(instanceName, params.to, params.duration || 3000);
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      return {
        ...result,
        provider: provider.name,
        capabilities: provider.getCapabilities()
      };
    } catch (error) {
      logger.error(`Failed to send ${type} message:`, error);
      throw error;
    }
  }

  /**
   * Obtém o provider de uma instância específica
   */
  getInstanceProvider(instanceName) {
    const providerName = this.instanceProviders.get(instanceName);
    
    if (providerName) {
      return this.providers.get(providerName);
    }

    // Tentar descobrir verificando status em cada provider
    for (const [name, provider] of this.providers) {
      try {
        const status = provider.getInstanceStatus(instanceName);
        if (status && status.status !== 'error') {
          this.instanceProviders.set(instanceName, name);
          return provider;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Migra uma instância de um provider para outro
   */
  async migrateInstance(instanceName, fromProvider, toProvider, config = {}) {
    try {
      logger.info(`Starting migration of ${instanceName} from ${fromProvider} to ${toProvider}`);

      const sourceProvider = this.providers.get(fromProvider);
      const targetProvider = this.providers.get(toProvider);

      if (!sourceProvider || !targetProvider) {
        throw new Error('Invalid source or target provider');
      }

      // 1. Obter dados da instância origem
      const contacts = await sourceProvider.getContacts(instanceName);
      const groups = await sourceProvider.getGroups(instanceName);
      const webhook = await sourceProvider.getWebhook(instanceName);

      // 2. Desconectar instância origem
      await sourceProvider.disconnectInstance(instanceName);

      // 3. Criar instância no destino
      const newInstance = await targetProvider.createInstance(instanceName, config);

      // 4. Configurar webhook se existir
      if (webhook && webhook.url) {
        await targetProvider.setWebhook(instanceName, webhook.url, webhook.events);
      }

      // 5. Atualizar mapeamento
      this.instanceProviders.set(instanceName, toProvider);

      logger.info(`Successfully migrated ${instanceName} from ${fromProvider} to ${toProvider}`);
      
      return {
        success: true,
        instance: newInstance,
        migratedData: {
          contacts: contacts?.length || 0,
          groups: groups?.length || 0
        },
        newProvider: toProvider,
        costs: targetProvider.getCosts()
      };
    } catch (error) {
      logger.error(`Failed to migrate instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Rastreia custos por cliente
   */
  trackCost(clientId, type, amount) {
    if (!this.costTracking.has(clientId)) {
      this.costTracking.set(clientId, {
        total: 0,
        instances: 0,
        messages: 0,
        breakdown: []
      });
    }

    const tracking = this.costTracking.get(clientId);
    tracking.total += amount;
    
    if (type === 'instance') {
      tracking.instances += amount;
    } else if (type === 'message') {
      tracking.messages += amount;
    }

    tracking.breakdown.push({
      type,
      amount,
      timestamp: new Date().toISOString()
    });

    logger.info(`Cost tracked for client ${clientId}: R$${amount} (${type})`);
  }

  /**
   * Obtém relatório de custos por cliente
   */
  getCostReport(clientId) {
    if (!this.costTracking.has(clientId)) {
      return {
        clientId,
        total: 0,
        instances: 0,
        messages: 0,
        breakdown: []
      };
    }

    return this.costTracking.get(clientId);
  }

  /**
   * Obtém comparação entre providers
   */
  getProviderComparison() {
    const comparison = {};

    for (const [name, provider] of this.providers) {
      comparison[name] = {
        name: provider.name,
        type: provider.type,
        capabilities: provider.getCapabilities(),
        costs: provider.getCosts(),
        limits: provider.getLimits()
      };
    }

    return comparison;
  }

  /**
   * Recomenda o melhor provider para um caso de uso
   */
  recommendProvider(useCase = {}) {
    const {
      monthlyMessages = 1000,
      requireButtons = false,
      requireLists = false,
      requireMedia = true,
      budget = 0,
      instances = 1
    } = useCase;

    const recommendations = [];

    for (const [name, provider] of this.providers) {
      const costs = provider.calculateCost({
        instances,
        messages: monthlyMessages,
        months: 1
      });

      const score = this.calculateProviderScore(provider, useCase);

      recommendations.push({
        provider: name,
        score,
        costs,
        suitable: this.isProviderSuitable(provider, useCase),
        pros: this.getProviderPros(provider),
        cons: this.getProviderCons(provider)
      });
    }

    // Ordenar por score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  calculateProviderScore(provider, useCase) {
    let score = 0;

    // Pontuação por capacidades
    if (useCase.requireButtons && provider.isCapable('buttons')) score += 30;
    if (useCase.requireLists && provider.isCapable('lists')) score += 20;
    if (useCase.requireMedia && provider.isCapable('images')) score += 10;

    // Pontuação por custo
    const costs = provider.calculateCost({
      instances: useCase.instances || 1,
      messages: useCase.monthlyMessages || 1000,
      months: 1
    });

    if (costs.total === 0) {
      score += 50; // Gratuito
    } else if (costs.total <= useCase.budget) {
      score += 30; // Dentro do orçamento
    }

    // Pontuação por limites
    if (provider.limits.messagesPerDay >= useCase.monthlyMessages / 30) {
      score += 20;
    }

    return score;
  }

  isProviderSuitable(provider, useCase) {
    if (useCase.requireButtons && !provider.isCapable('buttons')) return false;
    if (useCase.requireLists && !provider.isCapable('lists')) return false;
    
    const dailyMessages = useCase.monthlyMessages / 30;
    if (provider.limits.messagesPerDay < dailyMessages) return false;

    return true;
  }

  getProviderPros(provider) {
    const pros = [];
    
    if (provider.costs.perInstance === 0) pros.push('Gratuito');
    if (provider.isCapable('buttons')) pros.push('Suporta botões');
    if (provider.isCapable('lists')) pros.push('Suporta listas');
    if (provider.limits.messagesPerDay >= 5000) pros.push('Alto volume');
    if (provider.type === 'premium') pros.push('Recursos premium');

    return pros;
  }

  getProviderCons(provider) {
    const cons = [];
    
    if (provider.costs.perInstance > 0) cons.push(`Custo R$${provider.costs.perInstance}/instância`);
    if (!provider.isCapable('buttons')) cons.push('Sem botões nativos');
    if (!provider.isCapable('lists')) cons.push('Sem listas nativas');
    if (provider.limits.messagesPerDay < 1000) cons.push('Limite baixo de mensagens');

    return cons;
  }

  /**
   * Health check de todos os providers
   */
  async healthCheckAll() {
    const results = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return results;
  }
}

// Singleton
const providerManager = new ProviderManager();

export default providerManager;