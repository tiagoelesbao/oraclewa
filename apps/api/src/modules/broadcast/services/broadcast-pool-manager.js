// Pool Manager para Broadcast de Alto Volume - Império Prêmios
import logger from '../../../utils/logger.js';
import axios from 'axios';

export class BroadcastPoolManager {
  constructor(config = {}) {
    this.evolutionUrl = config.evolutionUrl || process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    this.apiKey = config.apiKey || process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    // Pool de instâncias para broadcast
    this.instances = config.instances || [
      'broadcast-imperio-01',
      'broadcast-imperio-02', 
      'broadcast-imperio-03',
      'broadcast-imperio-04',
      'broadcast-imperio-05'
    ];
    
    this.currentIndex = 0;
    this.hourlyCount = new Map();
    this.failedInstances = new Set();
    
    // Configurações de limite
    this.limits = {
      maxPerHour: config.maxPerHour || 120,
      maxPerDay: config.maxPerDay || 800,
      batchSize: config.batchSize || 10,
      messageDelay: config.messageDelay || [30, 60], // seconds
      batchDelay: config.batchDelay || [180, 300], // seconds  
    };
    
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      startTime: Date.now()
    };
    
    // Reset counters every hour
    setInterval(() => this.resetHourlyCounters(), 60 * 60 * 1000);
  }
  
  /**
   * Verifica status de todas as instâncias do pool
   */
  async checkInstancesHealth() {
    const healthStatus = new Map();
    
    for (const instance of this.instances) {
      try {
        const response = await axios.get(
          `${this.evolutionUrl}/instance/connectionState/${instance}`,
          { headers: { 'apikey': this.apiKey } }
        );
        
        const isConnected = response.data?.instance?.state === 'open';
        healthStatus.set(instance, isConnected);
        
        if (!isConnected) {
          this.failedInstances.add(instance);
          logger.warn(`❌ Instance ${instance} is disconnected`);
        } else {
          this.failedInstances.delete(instance);
        }
      } catch (error) {
        healthStatus.set(instance, false);
        this.failedInstances.add(instance);
        logger.error(`❌ Failed to check ${instance}: ${error.message}`);
      }
    }
    
    return healthStatus;
  }
  
  /**
   * Obtém próxima instância disponível com rotação inteligente
   */
  getNextAvailableInstance() {
    const availableInstances = this.instances.filter(instance => 
      !this.failedInstances.has(instance) && 
      this.getHourlyCount(instance) < this.limits.maxPerHour
    );
    
    if (availableInstances.length === 0) {
      logger.warn('⚠️ No available instances in pool!');
      return null;
    }
    
    // Rotação circular com balanceamento de carga
    const instance = availableInstances[this.currentIndex % availableInstances.length];
    this.currentIndex++;
    
    return instance;
  }
  
  /**
   * Distribui lista de contatos CSV entre instâncias do pool
   */
  distributeContacts(contacts) {
    const availableInstances = this.instances.filter(instance => 
      !this.failedInstances.has(instance)
    );
    
    if (availableInstances.length === 0) {
      throw new Error('No available instances for distribution');
    }
    
    const chunks = [];
    const chunkSize = Math.ceil(contacts.length / availableInstances.length);
    
    for (let i = 0; i < contacts.length; i += chunkSize) {
      const chunk = contacts.slice(i, i + chunkSize);
      const instance = availableInstances[chunks.length % availableInstances.length];
      
      chunks.push({
        instance,
        contacts: chunk,
        estimatedTime: this.calculateEstimatedTime(chunk.length)
      });
    }
    
    logger.info(`📊 Distributed ${contacts.length} contacts across ${chunks.length} instances`);
    return chunks;
  }
  
  /**
   * Envia mensagens em lotes com delays otimizados
   */
  async sendBatch(instance, contacts, message, options = {}) {
    const batchStats = {
      instance,
      total: contacts.length,
      sent: 0,
      failed: 0,
      startTime: Date.now()
    };
    
    logger.info(`🚀 Starting batch for ${instance}: ${contacts.length} messages`);
    
    for (let i = 0; i < contacts.length; i += this.limits.batchSize) {
      const batch = contacts.slice(i, i + this.limits.batchSize);
      
      // Verificar se instância ainda está saudável
      if (this.failedInstances.has(instance)) {
        logger.warn(`❌ Instance ${instance} failed during batch, stopping`);
        break;
      }
      
      // Processar lote
      for (const contact of batch) {
        try {
          const personalizedMessage = this.personalizeMessage(message, contact);
          
          await this.sendSingleMessage(instance, contact.phone, personalizedMessage, options);
          
          batchStats.sent++;
          this.incrementHourlyCount(instance);
          this.stats.totalSent++;
          
          // Delay entre mensagens
          await this.randomDelay(this.limits.messageDelay);
          
        } catch (error) {
          batchStats.failed++;
          this.stats.totalFailed++;
          logger.error(`❌ Failed to send to ${contact.phone}: ${error.message}`);
        }
      }
      
      // Pausa entre lotes (exceto no último)
      if (i + this.limits.batchSize < contacts.length) {
        const batchDelay = this.randomBetween(this.limits.batchDelay[0], this.limits.batchDelay[1]);
        logger.info(`⏸️ Instance ${instance} pausing for ${batchDelay}s between batches`);
        await this.sleep(batchDelay * 1000);
      }
    }
    
    const duration = (Date.now() - batchStats.startTime) / 1000;
    const successRate = ((batchStats.sent / batchStats.total) * 100).toFixed(1);
    
    logger.info(`✅ Batch complete for ${instance}: ${batchStats.sent}/${batchStats.total} (${successRate}%) in ${duration}s`);
    
    return batchStats;
  }
  
  /**
   * Envia mensagem individual via Evolution API
   */
  async sendSingleMessage(instance, phoneNumber, message, options = {}) {
    try {
      const response = await axios.post(
        `${this.evolutionUrl}/message/sendText/${instance}`,
        {
          number: phoneNumber,
          text: message,
          delay: options.delay || 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          }
        }
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        this.failedInstances.add(instance);
      }
      throw error;
    }
  }
  
  /**
   * Personaliza mensagem com dados do contato
   */
  personalizeMessage(template, contact) {
    return template
      .replace(/{{name}}/g, contact.name || 'Cliente')
      .replace(/{{phone}}/g, contact.phone || '')
      .replace(/{{email}}/g, contact.email || '');
  }
  
  /**
   * Calcula tempo estimado para processamento
   */
  calculateEstimatedTime(contactCount) {
    const avgMessageTime = (this.limits.messageDelay[0] + this.limits.messageDelay[1]) / 2;
    const batchCount = Math.ceil(contactCount / this.limits.batchSize);
    const avgBatchDelay = (this.limits.batchDelay[0] + this.limits.batchDelay[1]) / 2;
    
    const totalSeconds = (contactCount * avgMessageTime) + (batchCount * avgBatchDelay);
    return Math.ceil(totalSeconds / 60); // em minutos
  }
  
  /**
   * Obtém estatísticas do pool
   */
  getStats() {
    const runtime = (Date.now() - this.stats.startTime) / 1000 / 60; // minutos
    const messagesPerHour = this.stats.totalSent > 0 ? (this.stats.totalSent / runtime * 60) : 0;
    const successRate = this.stats.totalSent + this.stats.totalFailed > 0 
      ? ((this.stats.totalSent / (this.stats.totalSent + this.stats.totalFailed)) * 100).toFixed(1)
      : 0;
    
    return {
      totalSent: this.stats.totalSent,
      totalFailed: this.stats.totalFailed,
      successRate: `${successRate}%`,
      messagesPerHour: Math.round(messagesPerHour),
      activeInstances: this.instances.length - this.failedInstances.size,
      failedInstances: [...this.failedInstances],
      runtime: `${Math.round(runtime)} min`
    };
  }
  
  // Métodos utilitários
  
  getHourlyCount(instance) {
    return this.hourlyCount.get(instance) || 0;
  }
  
  incrementHourlyCount(instance) {
    const current = this.hourlyCount.get(instance) || 0;
    this.hourlyCount.set(instance, current + 1);
  }
  
  resetHourlyCounters() {
    this.hourlyCount.clear();
    logger.info('🔄 Hourly counters reset');
  }
  
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  async randomDelay(range) {
    const delay = this.randomBetween(range[0], range[1]) * 1000;
    await this.sleep(delay);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BroadcastPoolManager;