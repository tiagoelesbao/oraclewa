import { PROVIDERS } from '../providers/provider-factory.js';

// Provider configurations
export const PROVIDER_CONFIG = {
  [PROVIDERS.BAILEYS]: {
    name: 'Evolution API + Baileys',
    baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY,
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'default-instance',
    enabled: process.env.CORE_MODULE_ENABLED !== 'false',
    features: {
      textMessages: true,
      interactiveButtons: false,
      mediaMessages: true,
      groupMessages: true,
      broadcastMessages: false
    },
    limits: {
      messagesPerMinute: 10,
      messagesPerHour: 500,
      messagesPerDay: 10000
    },
    costs: {
      setup: 0,
      monthly: 0, // Included in core system
      perMessage: 0
    }
  },

  [PROVIDERS.ZAPI]: {
    name: 'Z-API',
    baseUrl: process.env.ZAPI_API_URL || 'https://api.z-api.io',
    token: process.env.ZAPI_TOKEN,
    instanceId: process.env.ZAPI_INSTANCE_ID,
    enabled: process.env.BROADCAST_MODULE_ENABLED === 'true',
    features: {
      textMessages: true,
      interactiveButtons: true,
      mediaMessages: true,
      groupMessages: true,
      broadcastMessages: true,
      listMessages: true,
      polls: true,
      reactions: true
    },
    limits: {
      messagesPerMinute: 50,
      messagesPerHour: 2000,
      messagesPerDay: 30000
    },
    costs: {
      setup: 0,
      monthly: 100, // R$ 100/mês
      perMessage: 0.0033 // R$ 0,0033 por mensagem
    }
  }
};

// Module to Provider mapping
export const MODULE_PROVIDERS = {
  core: PROVIDERS.BAILEYS,          // Recovery system
  broadcast: PROVIDERS.ZAPI,        // Campaign system
  fallback: PROVIDERS.BAILEYS       // Fallback option
};

// Provider selection logic
export const getProviderForModule = (moduleName) => {
  const providerType = MODULE_PROVIDERS[moduleName] || MODULE_PROVIDERS.fallback;
  const config = PROVIDER_CONFIG[providerType];
  
  if (!config.enabled) {
    throw new Error(`Provider '${providerType}' for module '${moduleName}' is not enabled`);
  }
  
  return {
    type: providerType,
    config: config
  };
};

// Provider validation
export const validateProviderConfig = (providerType) => {
  const config = PROVIDER_CONFIG[providerType];
  
  if (!config) {
    throw new Error(`Provider '${providerType}' not found`);
  }

  const errors = [];

  switch (providerType) {
    case PROVIDERS.BAILEYS:
      if (!config.baseUrl) errors.push('EVOLUTION_API_URL is required');
      if (!config.apiKey) errors.push('EVOLUTION_API_KEY is required');
      break;
      
    case PROVIDERS.ZAPI:
      if (!config.baseUrl) errors.push('ZAPI_API_URL is required');
      if (!config.token) errors.push('ZAPI_TOKEN is required');
      if (!config.instanceId) errors.push('ZAPI_INSTANCE_ID is required');
      break;
  }

  if (errors.length > 0) {
    throw new Error(`Provider '${providerType}' configuration errors: ${errors.join(', ')}`);
  }

  return true;
};

// Get all enabled providers
export const getEnabledProviders = () => {
  return Object.entries(PROVIDER_CONFIG)
    .filter(([_, config]) => config.enabled)
    .map(([type, config]) => ({ type, config }));
};

// Cost calculation
export const calculateMonthlyCost = (messagesPerMonth = 0) => {
  const costs = {
    [PROVIDERS.BAILEYS]: PROVIDER_CONFIG[PROVIDERS.BAILEYS].costs.monthly,
    [PROVIDERS.ZAPI]: PROVIDER_CONFIG[PROVIDERS.ZAPI].costs.monthly + 
                      (messagesPerMonth * PROVIDER_CONFIG[PROVIDERS.ZAPI].costs.perMessage)
  };

  return costs;
};

// Feature check
export const providerSupports = (providerType, feature) => {
  const config = PROVIDER_CONFIG[providerType];
  return config?.features?.[feature] === true;
};

export default {
  PROVIDER_CONFIG,
  MODULE_PROVIDERS,
  getProviderForModule,
  validateProviderConfig,
  getEnabledProviders,
  calculateMonthlyCost,
  providerSupports
};