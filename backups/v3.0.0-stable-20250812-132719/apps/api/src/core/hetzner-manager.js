/**
 * Hetzner Manager - Gerencia instâncias Evolution API no servidor Hetzner
 * Integrado ao sistema escalável multi-tenant
 */
import axios from 'axios';
import logger from '../utils/logger.js';
import clientManager from './client-manager.js';

class HetznerManager {
  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    this.initialized = false;
    this.instanceCache = new Map();
    this.lastSync = 0;
  }

  /**
   * Inicializa o gerenciador
   */
  async initialize() {
    try {
      logger.info('🔧 Initializing Hetzner Manager...');
      await this.testConnection();
      await this.syncInstances();
      this.initialized = true;
      logger.info('✅ Hetzner Manager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Hetzner Manager:', error);
      throw error;
    }
  }

  /**
   * Testa conectividade com Evolution API
   */
  async testConnection() {
    try {
      const response = await axios.get(this.apiUrl, {
        headers: { 'apikey': this.apiKey },
        timeout: 10000
      });
      
      logger.info('🌐 Hetzner Evolution API connection successful');
      return true;
    } catch (error) {
      logger.error('❌ Hetzner Evolution API connection failed:', error.message);
      throw new Error('Cannot connect to Hetzner Evolution API');
    }
  }

  /**
   * Sincroniza instâncias do servidor com configuração local
   */
  async syncInstances() {
    try {
      logger.info('🔄 Syncing instances with Hetzner...');
      
      // Obter instâncias do servidor
      const serverInstances = await this.fetchServerInstances();
      
      // Obter instâncias dos clientes locais
      const clientInstances = await this.getClientInstances();
      
      // Comparar e sincronizar
      const syncResult = this.compareInstances(serverInstances, clientInstances);
      
      this.instanceCache.clear();
      serverInstances.forEach(instance => {
        this.instanceCache.set(instance.instanceName, instance);
      });
      
      this.lastSync = Date.now();
      
      logger.info(`✅ Sync completed: ${syncResult.total} instances, ${syncResult.connected} connected`);
      return syncResult;
      
    } catch (error) {
      logger.error('❌ Failed to sync instances:', error);
      throw error;
    }
  }

  /**
   * Obtém instâncias do servidor Hetzner
   */
  async fetchServerInstances() {
    try {
      const response = await axios.get(`${this.apiUrl}/instance/fetchInstances`, {
        headers: { 'apikey': this.apiKey },
        timeout: 15000
      });
      
      return response.data || [];
    } catch (error) {
      logger.error('❌ Failed to fetch server instances:', error);
      return [];
    }
  }

  /**
   * Obtém instâncias definidas nos clientes
   */
  async getClientInstances() {
    const clientInstances = [];
    const clients = clientManager.getActiveClients();
    
    for (const client of clients) {
      try {
        const clientConfig = clientManager.getClient(client.id);
        const instances = clientConfig.instances || {};
        
        Object.entries(instances).forEach(([instanceName, config]) => {
          clientInstances.push({
            clientId: client.id,
            instanceName,
            config,
            expected: true
          });
        });
      } catch (error) {
        logger.warn(`⚠️ Error getting instances for client ${client.id}:`, error.message);
      }
    }
    
    return clientInstances;
  }

  /**
   * Compara instâncias do servidor com configuração local
   */
  compareInstances(serverInstances, clientInstances) {
    const result = {
      total: serverInstances.length,
      connected: serverInstances.filter(i => i.state === 'open').length,
      missing: [],
      unexpected: [],
      clientMap: new Map()
    };
    
    // Mapear instâncias esperadas por cliente
    clientInstances.forEach(instance => {
      if (!result.clientMap.has(instance.clientId)) {
        result.clientMap.set(instance.clientId, []);
      }
      result.clientMap.get(instance.clientId).push(instance);
    });
    
    // Verificar instâncias faltando
    const serverInstanceNames = serverInstances.map(i => i.instanceName);
    clientInstances.forEach(expected => {
      if (!serverInstanceNames.includes(expected.instanceName)) {
        result.missing.push(expected);
      }
    });
    
    // Verificar instâncias inesperadas
    const expectedInstanceNames = clientInstances.map(i => i.instanceName);
    serverInstances.forEach(server => {
      if (!expectedInstanceNames.includes(server.instanceName)) {
        result.unexpected.push(server);
      }
    });
    
    if (result.missing.length > 0) {
      logger.warn(`⚠️ Missing instances: ${result.missing.map(i => i.instanceName).join(', ')}`);
    }
    
    if (result.unexpected.length > 0) {
      logger.warn(`⚠️ Unexpected instances: ${result.unexpected.map(i => i.instanceName).join(', ')}`);
    }
    
    return result;
  }

  /**
   * Cria instância no servidor para um cliente
   */
  async createClientInstance(clientId, instanceName, config = {}) {
    try {
      logger.info(`🔨 Creating instance: ${instanceName} for client: ${clientId}`);
      
      const payload = {
        instanceName,
        token: '',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: config.webhook || '',
        webhook_by_events: config.webhook_by_events || false,
        reject_call: config.reject_call || false,
        msg_call: config.msg_call || '',
        groups_ignore: config.groups_ignore !== false,
        always_online: config.always_online !== false,
        read_messages: config.read_messages || false,
        read_status: config.read_status || false,
        sync_full_history: config.sync_full_history || false
      };
      
      const response = await axios.post(`${this.apiUrl}/instance/create`, payload, {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      logger.info(`✅ Instance created: ${instanceName}`);
      
      // Atualizar cache
      this.instanceCache.set(instanceName, {
        instanceName,
        state: 'created',
        clientId
      });
      
      return response.data;
      
    } catch (error) {
      logger.error(`❌ Failed to create instance ${instanceName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cria todas as instâncias de um cliente
   */
  async createAllClientInstances(clientId) {
    try {
      logger.info(`🚀 Creating all instances for client: ${clientId}`);
      
      const clientConfig = clientManager.getClient(clientId);
      const instances = clientConfig.instances || {};
      
      const results = [];
      
      for (const [instanceName, config] of Object.entries(instances)) {
        try {
          const result = await this.createClientInstance(clientId, instanceName, config);
          results.push({ instanceName, success: true, result });
          
          // Aguardar entre criações para evitar sobrecarga
          await this.sleep(2000);
          
        } catch (error) {
          results.push({ instanceName, success: false, error: error.message });
        }
      }
      
      logger.info(`✅ Created ${results.filter(r => r.success).length}/${results.length} instances for client: ${clientId}`);
      return results;
      
    } catch (error) {
      logger.error(`❌ Failed to create instances for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém QR Code de uma instância
   */
  async getInstanceQRCode(instanceName) {
    try {
      logger.info(`📱 Getting QR Code for: ${instanceName}`);
      
      const response = await axios.get(`${this.apiUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': this.apiKey },
        timeout: 15000
      });
      
      return response.data;
      
    } catch (error) {
      logger.error(`❌ Failed to get QR Code for ${instanceName}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtém status de uma instância
   */
  async getInstanceStatus(instanceName) {
    try {
      const response = await axios.get(`${this.apiUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': this.apiKey },
        timeout: 10000
      });
      
      return response.data;
      
    } catch (error) {
      logger.error(`❌ Failed to get status for ${instanceName}:`, error.message);
      throw error;
    }
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceName) {
    try {
      logger.info(`🗑️ Deleting instance: ${instanceName}`);
      
      const response = await axios.delete(`${this.apiUrl}/instance/delete/${instanceName}`, {
        headers: { 'apikey': this.apiKey },
        timeout: 15000
      });
      
      // Remover do cache
      this.instanceCache.delete(instanceName);
      
      logger.info(`✅ Instance deleted: ${instanceName}`);
      return response.data;
      
    } catch (error) {
      logger.error(`❌ Failed to delete instance ${instanceName}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das instâncias
   */
  getInstanceStats() {
    if (this.instanceCache.size === 0) {
      return {
        total: 0,
        connected: 0,
        disconnected: 0,
        byClient: {},
        lastSync: this.lastSync
      };
    }
    
    const instances = Array.from(this.instanceCache.values());
    const stats = {
      total: instances.length,
      connected: instances.filter(i => i.state === 'open').length,
      disconnected: instances.filter(i => i.state !== 'open').length,
      byClient: {},
      lastSync: this.lastSync
    };
    
    // Agrupar por cliente
    instances.forEach(instance => {
      const clientId = this.guessClientFromInstanceName(instance.instanceName);
      if (!stats.byClient[clientId]) {
        stats.byClient[clientId] = { total: 0, connected: 0, disconnected: 0 };
      }
      
      stats.byClient[clientId].total++;
      if (instance.state === 'open') {
        stats.byClient[clientId].connected++;
      } else {
        stats.byClient[clientId].disconnected++;
      }
    });
    
    return stats;
  }

  /**
   * Tenta identificar cliente pelo nome da instância
   */
  guessClientFromInstanceName(instanceName) {
    // Padrões comuns: imperio1, imperio_main, broadcast-imperio-1
    const patterns = [
      /^([a-z]+)_?\d*$/,           // imperio1, imperio_2
      /^([a-z]+)_main$/,           // imperio_main  
      /^broadcast-([a-z]+)-\d+$/   // broadcast-imperio-1
    ];
    
    for (const pattern of patterns) {
      const match = instanceName.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return 'unknown';
  }

  /**
   * Força sincronização se necessário
   */
  async ensureSync() {
    const now = Date.now();
    const syncInterval = 5 * 60 * 1000; // 5 minutos
    
    if (now - this.lastSync > syncInterval) {
      await this.syncInstances();
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém instância específica do cache
   */
  getCachedInstance(instanceName) {
    return this.instanceCache.get(instanceName);
  }

  /**
   * Lista todas as instâncias de um cliente
   */
  getClientInstancesFromCache(clientId) {
    const instances = Array.from(this.instanceCache.values());
    return instances.filter(instance => 
      this.guessClientFromInstanceName(instance.instanceName) === clientId
    );
  }
}

// Instância singleton
const hetznerManager = new HetznerManager();

export default hetznerManager;