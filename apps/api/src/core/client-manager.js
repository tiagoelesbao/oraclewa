/**
 * Client Manager - Gerenciador Escalável de Clientes
 * Centraliza toda a lógica multi-tenant de forma verdadeiramente escalável
 */
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

class ClientManager {
  constructor() {
    this.clients = new Map();
    // Use relative path from project root, not absolute
    this.clientsPath = process.env.CLIENTS_PATH || path.resolve(process.cwd(), 'clients');
    this.initialized = false;
  }

  /**
   * Inicializa o gerenciador carregando todos os clientes
   */
  async initialize() {
    try {
      logger.info('🔧 Initializing Client Manager...');
      await this.loadAllClients();
      this.initialized = true;
      logger.info(`✅ Client Manager initialized with ${this.clients.size} clients`);
    } catch (error) {
      logger.error('❌ Failed to initialize Client Manager:', error);
      throw error;
    }
  }

  /**
   * Carrega todos os clientes do diretório /clients
   */
  async loadAllClients() {
    try {
      // Ensure clients directory exists
      try {
        await fs.access(this.clientsPath);
      } catch (error) {
        logger.warn(`Clients directory not found at ${this.clientsPath}, creating default client configuration`);
        await this.createDefaultClientStructure();
        return;
      }

      const clientDirs = await fs.readdir(this.clientsPath, { withFileTypes: true });
      
      // If no client directories found, create default configuration
      if (clientDirs.length === 0) {
        logger.warn('No client directories found, creating default client configuration');
        await this.createDefaultClientStructure();
        return;
      }
      
      for (const dir of clientDirs) {
        if (dir.isDirectory() && !dir.name.startsWith('_')) {
          await this.loadClient(dir.name);
        }
      }
    } catch (error) {
      logger.error('Error loading clients:', error);
      // Don't throw in production, create default configuration instead
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Creating default client configuration for production');
        await this.createDefaultClientStructure();
      } else {
        throw error;
      }
    }
  }

  /**
   * Cria estrutura de cliente padrão para produção
   */
  async createDefaultClientStructure() {
    try {
      // Create default client configuration in memory
      const defaultClient = {
        id: 'imperio',
        name: 'Império Prêmios',
        status: 'active',
        provider: 'evolution-baileys',
        config: {
          webhooks: {
            enabled: true,
            endpoints: ['/webhook/imperio/order_paid', '/webhook/imperio/order_expired']
          },
          antiban: {
            enabled: true,
            strategy: 'conti_chips',
            delays: { min: 30000, max: 120000 }
          },
          limits: {
            messagesPerDay: 500,
            messagesPerHour: 50
          }
        },
        instances: [],
        webhooks: new Map(),
        lastLoaded: new Date().toISOString()
      };

      this.clients.set('imperio', defaultClient);
      logger.info('✅ Default client configuration created: imperio');
    } catch (error) {
      logger.error('Error creating default client structure:', error);
    }
  }

  /**
   * Carrega um cliente específico
   */
  async loadClient(clientId) {
    try {
      const clientPath = path.join(this.clientsPath, clientId);
      const configPath = path.join(clientPath, 'config.json');
      
      // Verificar se config existe
      try {
        await fs.access(configPath);
      } catch {
        logger.warn(`⚠️ Config not found for client: ${clientId}`);
        return null;
      }

      // Carregar configuração
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Adicionar paths dinâmicos
      config.paths = {
        root: clientPath,
        data: path.join(clientPath, 'data'),
        broadcast: path.join(clientPath, 'data/broadcast'),
        exports: path.join(clientPath, 'data/exports'), 
        backups: path.join(clientPath, 'data/backups'),
        templates: path.join(clientPath, 'templates'),
        webhooks: path.join(clientPath, 'webhooks'),
        logs: path.join('logs/clients', clientId)
      };

      // Validar estrutura de pastas
      await this.ensureClientStructure(config);

      // Armazenar cliente
      this.clients.set(clientId, config);
      
      logger.info(`✅ Client loaded: ${clientId} (${config.name})`);
      return config;
      
    } catch (error) {
      logger.error(`❌ Failed to load client ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Garante que a estrutura de pastas do cliente existe
   */
  async ensureClientStructure(config) {
    const requiredDirs = [
      config.paths.data,
      config.paths.broadcast,
      config.paths.exports,
      config.paths.backups,
      config.paths.logs
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.warn(`Warning creating directory ${dir}:`, error.message);
      }
    }
  }

  /**
   * Obtém configuração de um cliente
   */
  getClient(clientId) {
    if (!this.initialized) {
      throw new Error('Client Manager not initialized');
    }
    
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    
    return client;
  }

  /**
   * Lista todos os clientes ativos
   */
  getActiveClients() {
    return Array.from(this.clients.values())
      .filter(client => client.status === 'active')
      .map(client => ({
        id: client.id,
        name: client.name,
        status: client.status,
        provider: client.provider,
        services: client.services,
        instanceCount: Object.keys(client.instances || {}).length
      }));
  }

  /**
   * Obtém instâncias de um cliente por tipo
   */
  getClientInstances(clientId, type = null) {
    const client = this.getClient(clientId);
    const instances = client.instances || {};
    
    if (!type) {
      return instances;
    }
    
    return Object.entries(instances)
      .filter(([_, instance]) => instance.type === type)
      .reduce((acc, [key, instance]) => {
        acc[key] = instance;
        return acc;
      }, {});
  }

  /**
   * Obtém instância ativa para um cliente
   */
  getActiveInstance(clientId, type = 'recovery') {
    const instances = this.getClientInstances(clientId, type);
    
    // Procurar instância ativa
    const activeInstance = Object.entries(instances)
      .find(([_, instance]) => instance.status === 'active');
    
    if (activeInstance) {
      return {
        name: activeInstance[0],
        config: activeInstance[1]
      };
    }
    
    // Se nenhuma ativa, pegar a primeira disponível
    const firstInstance = Object.entries(instances)[0];
    if (firstInstance) {
      return {
        name: firstInstance[0], 
        config: firstInstance[1]
      };
    }
    
    throw new Error(`No ${type} instance found for client: ${clientId}`);
  }

  /**
   * Obtém path específico de um cliente
   */
  getClientPath(clientId, pathType = 'root') {
    const client = this.getClient(clientId);
    
    if (!client.paths[pathType]) {
      throw new Error(`Invalid path type: ${pathType}`);
    }
    
    return client.paths[pathType];
  }

  /**
   * Lista arquivos de broadcast de um cliente
   */
  async getClientBroadcastFiles(clientId) {
    try {
      const broadcastPath = this.getClientPath(clientId, 'broadcast');
      const files = await fs.readdir(broadcastPath);
      
      return files
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
          name: file,
          path: path.join(broadcastPath, file)
        }));
    } catch (error) {
      logger.warn(`No broadcast files for client ${clientId}:`, error.message);
      return [];
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    const clients = Array.from(this.clients.values());
    const active = clients.filter(c => c.status === 'active').length;
    const totalInstances = clients.reduce((acc, c) => 
      acc + Object.keys(c.instances || {}).length, 0
    );

    return {
      totalClients: clients.length,
      activeClients: active,
      totalInstances,
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        services: c.services,
        instances: Object.keys(c.instances || {}).length
      }))
    };
  }

  /**
   * Recarrega um cliente específico
   */
  async reloadClient(clientId) {
    logger.info(`🔄 Reloading client: ${clientId}`);
    return await this.loadClient(clientId);
  }

  /**
   * Recarrega todos os clientes
   */
  async reloadAllClients() {
    logger.info('🔄 Reloading all clients...');
    this.clients.clear();
    await this.loadAllClients();
    logger.info(`✅ Reloaded ${this.clients.size} clients`);
  }
}

// Instância singleton
const clientManager = new ClientManager();

export default clientManager;