/**
 * Configuração Multi-Tenant
 * Gerencia clientes e suas preferências de providers
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

class MultiTenantConfig {
  constructor() {
    this.clients = new Map();
    this.defaultConfig = {
      provider: 'evolution-baileys', // Provider padrão (gratuito)
      services: ['webhooks', 'broadcast'],
      limits: {
        messagesPerDay: 1000,
        messagesPerHour: 100,
        instances: 2
      },
      features: {
        buttons: false,
        lists: false,
        media: true,
        typing: true,
        presence: true
      },
      billing: {
        plan: 'free',
        monthlyBudget: 0,
        billingCycle: 'monthly'
      }
    };
  }

  async initialize() {
    try {
      // Carregar configuração global
      this.loadGlobalConfig();

      // Carregar configurações de clientes
      await this.loadClientConfigs();

      logger.info(`Multi-tenant config initialized with ${this.clients.size} clients`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize multi-tenant config:', error);
      throw error;
    }
  }

  loadGlobalConfig() {
    // Carregar variáveis de ambiente globais
    const globalEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(globalEnvPath)) {
      dotenv.config({ path: globalEnvPath });
    }

    // Configurações globais do sistema
    this.globalConfig = {
      system: {
        name: process.env.SYSTEM_NAME || 'OracleWA SaaS',
        version: process.env.SYSTEM_VERSION || '3.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      providers: {
        evolutionBaileys: {
          enabled: process.env.EVOLUTION_ENABLED !== 'false',
          baseUrl: process.env.EVOLUTION_API_URL,
          apiKey: process.env.EVOLUTION_API_KEY
        },
        zapi: {
          enabled: process.env.ZAPI_ENABLED === 'true',
          baseUrl: process.env.ZAPI_BASE_URL,
          clientToken: process.env.ZAPI_CLIENT_TOKEN
        }
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'oraclewa',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'password'
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    };
  }

  async loadClientConfigs() {
    const clientsDir = path.join(process.cwd(), 'clients');
    
    if (!fs.existsSync(clientsDir)) {
      logger.warn('Clients directory not found, creating...');
      fs.mkdirSync(clientsDir, { recursive: true });
      return;
    }

    const clientFolders = fs.readdirSync(clientsDir).filter(file => {
      const fullPath = path.join(clientsDir, file);
      return fs.statSync(fullPath).isDirectory() && file !== '_template';
    });

    for (const clientFolder of clientFolders) {
      await this.loadClientConfig(clientFolder);
    }
  }

  async loadClientConfig(clientId) {
    try {
      const clientDir = path.join(process.cwd(), 'clients', clientId);
      const configPath = path.join(clientDir, 'config.json');
      const envPath = path.join(clientDir, 'config.env');

      let config = { ...this.defaultConfig };

      // Carregar config.json se existir
      if (fs.existsSync(configPath)) {
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = this.mergeConfig(config, jsonConfig);
      }

      // Carregar config.env se existir
      if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        config = this.mergeEnvConfig(config, envConfig);
      }

      // Adicionar metadados do cliente
      config.id = clientId;
      config.name = config.name || clientId;
      config.createdAt = config.createdAt || new Date().toISOString();
      config.status = config.status || 'active';

      // Determinar provider baseado no plano e recursos necessários
      config.provider = this.selectOptimalProvider(config);

      // Calcular custos
      config.billing.estimatedCost = this.calculateEstimatedCost(config);

      this.clients.set(clientId, config);
      logger.info(`Client ${clientId} loaded - Provider: ${config.provider}, Plan: ${config.billing.plan}`);

      return config;
    } catch (error) {
      logger.error(`Failed to load config for client ${clientId}:`, error);
      return null;
    }
  }

  selectOptimalProvider(config) {
    // Se cliente especificou provider, usar esse
    if (config.provider && config.provider !== 'auto') {
      return config.provider;
    }

    // Seleção automática baseada em necessidades
    const needsButtons = config.features.buttons === true;
    const needsLists = config.features.lists === true;
    const isPremium = config.billing.plan === 'premium' || config.billing.plan === 'enterprise';
    const hasBudget = config.billing.monthlyBudget > 0;

    // Se precisa de recursos avançados E tem orçamento, usar Z-API
    if ((needsButtons || needsLists) && (isPremium || hasBudget >= 99)) {
      return 'z-api';
    }

    // Caso contrário, usar Evolution Baileys (gratuito)
    return 'evolution-baileys';
  }

  calculateEstimatedCost(config) {
    const costs = {
      monthly: 0,
      breakdown: []
    };

    if (config.provider === 'z-api') {
      const instanceCost = 99 * (config.limits.instances || 1);
      costs.monthly += instanceCost;
      costs.breakdown.push({
        item: 'Z-API Instances',
        quantity: config.limits.instances || 1,
        unitPrice: 99,
        total: instanceCost
      });
    }

    // Adicionar outros custos se aplicável (futuro)
    if (config.billing.plan === 'enterprise') {
      const supportCost = 500;
      costs.monthly += supportCost;
      costs.breakdown.push({
        item: 'Enterprise Support',
        quantity: 1,
        unitPrice: 500,
        total: supportCost
      });
    }

    return costs;
  }

  mergeConfig(base, overlay) {
    const merged = { ...base };
    
    for (const key in overlay) {
      if (typeof overlay[key] === 'object' && !Array.isArray(overlay[key])) {
        merged[key] = { ...base[key], ...overlay[key] };
      } else {
        merged[key] = overlay[key];
      }
    }
    
    return merged;
  }

  mergeEnvConfig(config, envVars) {
    const merged = { ...config };

    // Mapear variáveis de ambiente para configuração
    if (envVars.CLIENT_NAME) merged.name = envVars.CLIENT_NAME;
    if (envVars.CLIENT_PROVIDER) merged.provider = envVars.CLIENT_PROVIDER;
    if (envVars.CLIENT_PLAN) merged.billing.plan = envVars.CLIENT_PLAN;
    if (envVars.CLIENT_BUDGET) merged.billing.monthlyBudget = parseFloat(envVars.CLIENT_BUDGET);
    
    // Serviços
    if (envVars.ENABLE_WEBHOOKS) merged.services.includes('webhooks') || merged.services.push('webhooks');
    if (envVars.ENABLE_BROADCAST) merged.services.includes('broadcast') || merged.services.push('broadcast');
    
    // Features
    if (envVars.ENABLE_BUTTONS) merged.features.buttons = envVars.ENABLE_BUTTONS === 'true';
    if (envVars.ENABLE_LISTS) merged.features.lists = envVars.ENABLE_LISTS === 'true';
    
    // Limites
    if (envVars.MAX_MESSAGES_DAY) merged.limits.messagesPerDay = parseInt(envVars.MAX_MESSAGES_DAY);
    if (envVars.MAX_MESSAGES_HOUR) merged.limits.messagesPerHour = parseInt(envVars.MAX_MESSAGES_HOUR);
    if (envVars.MAX_INSTANCES) merged.limits.instances = parseInt(envVars.MAX_INSTANCES);

    // Credenciais específicas do cliente
    if (envVars.EVOLUTION_API_KEY) {
      merged.providers = merged.providers || {};
      merged.providers.evolutionBaileys = {
        apiKey: envVars.EVOLUTION_API_KEY,
        baseUrl: envVars.EVOLUTION_API_URL
      };
    }

    if (envVars.ZAPI_CLIENT_TOKEN) {
      merged.providers = merged.providers || {};
      merged.providers.zapi = {
        clientToken: envVars.ZAPI_CLIENT_TOKEN,
        baseUrl: envVars.ZAPI_BASE_URL
      };
    }

    return merged;
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  getAllClients() {
    return Array.from(this.clients.values());
  }

  getActiveClients() {
    return this.getAllClients().filter(client => client.status === 'active');
  }

  getClientsByProvider(providerName) {
    return this.getAllClients().filter(client => client.provider === providerName);
  }

  getClientsByPlan(planName) {
    return this.getAllClients().filter(client => client.billing.plan === planName);
  }

  async createClient(clientData) {
    try {
      const clientId = clientData.id || this.generateClientId(clientData.name);
      const clientDir = path.join(process.cwd(), 'clients', clientId);

      // Criar diretório do cliente
      fs.mkdirSync(clientDir, { recursive: true });

      // Preparar configuração
      const config = this.mergeConfig(this.defaultConfig, clientData);
      config.id = clientId;
      config.createdAt = new Date().toISOString();

      // Salvar config.json
      const configPath = path.join(clientDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Criar config.env template
      const envTemplate = this.generateEnvTemplate(config);
      const envPath = path.join(clientDir, 'config.env');
      fs.writeFileSync(envPath, envTemplate);

      // Criar estrutura de diretórios
      const dirs = ['instances', 'logs', 'data', 'backups'];
      dirs.forEach(dir => {
        fs.mkdirSync(path.join(clientDir, dir), { recursive: true });
      });

      // Carregar no sistema
      await this.loadClientConfig(clientId);

      logger.info(`Client ${clientId} created successfully`);
      return this.getClient(clientId);
    } catch (error) {
      logger.error('Failed to create client:', error);
      throw error;
    }
  }

  async updateClient(clientId, updates) {
    try {
      const current = this.getClient(clientId);
      if (!current) {
        throw new Error(`Client ${clientId} not found`);
      }

      const updated = this.mergeConfig(current, updates);
      updated.updatedAt = new Date().toISOString();

      // Salvar alterações
      const clientDir = path.join(process.cwd(), 'clients', clientId);
      const configPath = path.join(clientDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));

      // Recarregar
      await this.loadClientConfig(clientId);

      logger.info(`Client ${clientId} updated successfully`);
      return this.getClient(clientId);
    } catch (error) {
      logger.error(`Failed to update client ${clientId}:`, error);
      throw error;
    }
  }

  async deleteClient(clientId) {
    try {
      const client = this.getClient(clientId);
      if (!client) {
        throw new Error(`Client ${clientId} not found`);
      }

      // Marcar como deletado (soft delete)
      await this.updateClient(clientId, {
        status: 'deleted',
        deletedAt: new Date().toISOString()
      });

      // Remover da memória
      this.clients.delete(clientId);

      logger.info(`Client ${clientId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete client ${clientId}:`, error);
      throw error;
    }
  }

  generateClientId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}_${timestamp}`;
  }

  generateEnvTemplate(config) {
    return `# Client Configuration
CLIENT_NAME=${config.name}
CLIENT_ID=${config.id}
CLIENT_PROVIDER=${config.provider}
CLIENT_PLAN=${config.billing.plan}
CLIENT_BUDGET=${config.billing.monthlyBudget}

# Services
ENABLE_WEBHOOKS=${config.services.includes('webhooks')}
ENABLE_BROADCAST=${config.services.includes('broadcast')}

# Features
ENABLE_BUTTONS=${config.features.buttons}
ENABLE_LISTS=${config.features.lists}
ENABLE_MEDIA=${config.features.media}

# Limits
MAX_MESSAGES_DAY=${config.limits.messagesPerDay}
MAX_MESSAGES_HOUR=${config.limits.messagesPerHour}
MAX_INSTANCES=${config.limits.instances}

# Provider Credentials (configure as needed)
# EVOLUTION_API_URL=
# EVOLUTION_API_KEY=
# ZAPI_CLIENT_TOKEN=
# ZAPI_BASE_URL=
`;
  }

  getSystemStats() {
    const stats = {
      totalClients: this.clients.size,
      activeClients: this.getActiveClients().length,
      byProvider: {},
      byPlan: {},
      totalEstimatedRevenue: 0
    };

    // Estatísticas por provider
    for (const client of this.clients.values()) {
      stats.byProvider[client.provider] = (stats.byProvider[client.provider] || 0) + 1;
      stats.byPlan[client.billing.plan] = (stats.byPlan[client.billing.plan] || 0) + 1;
      
      if (client.billing.estimatedCost) {
        stats.totalEstimatedRevenue += client.billing.estimatedCost.monthly;
      }
    }

    return stats;
  }
}

// Singleton
const multiTenantConfig = new MultiTenantConfig();

export default multiTenantConfig;