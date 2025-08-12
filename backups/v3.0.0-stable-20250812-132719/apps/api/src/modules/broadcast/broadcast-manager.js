/**
 * Broadcast Manager com Provider Dinâmico
 * Gerencia campanhas de broadcast usando o provider apropriado
 */

import providerManager from '../../providers/manager/provider-manager.js';
import multiTenantConfig from '../../config/multi-tenant-config.js';
import logger from '../../utils/logger.js';
import { csvProcessor } from './utils/csv-processor.js';
import AntibanStrategy from './strategies/antiban-strategy.js';

class BroadcastManager {
  constructor() {
    this.campaigns = new Map();
    this.stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      campaigns: {}
    };
    this.antibanStrategy = new AntibanStrategy();
  }

  async initialize() {
    await this.antibanStrategy.initialize();
    logger.info('Broadcast Manager initialized');
    return true;
  }

  /**
   * Cria uma nova campanha de broadcast
   */
  async createCampaign(clientId, campaignData) {
    try {
      const {
        name,
        message,
        contacts,
        csvFile,
        mediaUrl,
        buttons,
        schedule,
        options = {}
      } = campaignData;

      // Validar cliente
      const clientConfig = multiTenantConfig.getClient(clientId);
      if (!clientConfig) {
        throw new Error(`Client ${clientId} not found`);
      }

      if (!clientConfig.services.includes('broadcast')) {
        throw new Error(`Broadcast service not enabled for client ${clientId}`);
      }

      // Gerar ID da campanha
      const campaignId = this.generateCampaignId(clientId, name);

      // Processar contatos
      let contactList = contacts || [];
      if (csvFile) {
        contactList = await this.processCSVFile(csvFile);
      }

      if (contactList.length === 0) {
        throw new Error('No contacts provided for campaign');
      }

      // Verificar limites
      this.validateCampaignLimits(clientConfig, contactList.length);

      // Selecionar provider apropriado
      const provider = providerManager.selectProvider({
        clientId,
        requireButtons: !!buttons,
        budget: clientConfig.billing.monthlyBudget > 0 ? 'premium' : 'free'
      });

      // Criar objeto da campanha
      const campaign = {
        id: campaignId,
        clientId,
        name,
        message,
        contacts: contactList,
        mediaUrl,
        buttons,
        schedule,
        options,
        provider: provider.name,
        status: 'pending',
        stats: {
          total: contactList.length,
          sent: 0,
          failed: 0,
          pending: contactList.length
        },
        createdAt: new Date().toISOString(),
        instances: this.selectBroadcastInstances(clientConfig)
      };

      // Salvar campanha
      this.campaigns.set(campaignId, campaign);

      // Agendar ou iniciar campanha
      if (schedule && schedule.startTime) {
        this.scheduleCampaign(campaign);
      } else {
        this.startCampaign(campaign);
      }

      logger.info(`Campaign ${campaignId} created for client ${clientId}`);
      return {
        campaignId,
        status: campaign.status,
        stats: campaign.stats,
        provider: campaign.provider,
        estimatedTime: this.estimateCampaignTime(campaign),
        cost: this.calculateCampaignCost(provider, contactList.length)
      };

    } catch (error) {
      logger.error(`Failed to create campaign for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Inicia execução de uma campanha
   */
  async startCampaign(campaign) {
    try {
      campaign.status = 'running';
      campaign.startedAt = new Date().toISOString();

      logger.info(`Starting campaign ${campaign.id}`);

      // Dividir contatos entre instâncias
      const batches = this.divideContactsBetweenInstances(campaign.contacts, campaign.instances);

      // Processar cada batch em paralelo
      const promises = batches.map((batch, index) => {
        const instanceName = campaign.instances[index];
        return this.processBatch(campaign, instanceName, batch);
      });

      // Aguardar conclusão
      Promise.all(promises)
        .then(() => {
          campaign.status = 'completed';
          campaign.completedAt = new Date().toISOString();
          logger.info(`Campaign ${campaign.id} completed successfully`);
        })
        .catch(error => {
          campaign.status = 'failed';
          campaign.error = error.message;
          logger.error(`Campaign ${campaign.id} failed:`, error);
        });

    } catch (error) {
      campaign.status = 'failed';
      campaign.error = error.message;
      logger.error(`Failed to start campaign ${campaign.id}:`, error);
      throw error;
    }
  }

  /**
   * Processa um batch de contatos
   */
  async processBatch(campaign, instanceName, contacts) {
    const clientConfig = multiTenantConfig.getClient(campaign.clientId);
    
    for (const contact of contacts) {
      try {
        // Aplicar estratégia anti-ban
        await this.antibanStrategy.beforeSend(instanceName, campaign.clientId);

        // Preparar mensagem personalizada
        const personalizedMessage = this.personalizeMessage(campaign.message, contact);

        // Preparar parâmetros da mensagem
        let messageParams = {
          to: contact.phone || contact.number,
          text: personalizedMessage
        };

        // Adicionar mídia se houver
        if (campaign.mediaUrl) {
          messageParams.mediaUrl = campaign.mediaUrl;
          messageParams.caption = personalizedMessage;
          messageParams.mediaType = campaign.options.mediaType || 'image';
        }

        // Adicionar botões se houver e provider suportar
        if (campaign.buttons && campaign.provider === 'z-api') {
          messageParams = {
            to: contact.phone || contact.number,
            content: {
              text: personalizedMessage,
              title: campaign.options.title || '',
              footer: campaign.options.footer || ''
            },
            buttons: campaign.buttons
          };
        }

        // Simular digitação se configurado
        if (clientConfig.features.typing) {
          await providerManager.sendMessage(instanceName, 'typing', {
            to: messageParams.to,
            duration: 2000
          });
          await this.delay(2000);
        }

        // Enviar mensagem
        const messageType = campaign.mediaUrl ? 'media' : (campaign.buttons ? 'button' : 'text');
        await providerManager.sendMessage(instanceName, messageType, messageParams);

        // Atualizar estatísticas
        campaign.stats.sent++;
        campaign.stats.pending--;
        this.stats.sent++;

        // Aplicar delay anti-ban
        await this.antibanStrategy.afterSend(instanceName, campaign.clientId);

        logger.debug(`Message sent to ${contact.phone} in campaign ${campaign.id}`);

      } catch (error) {
        campaign.stats.failed++;
        campaign.stats.pending--;
        this.stats.failed++;
        
        logger.error(`Failed to send message to ${contact.phone}:`, error.message);
        
        // Adicionar à lista de falhas para retry
        if (!campaign.failures) campaign.failures = [];
        campaign.failures.push({
          contact,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Atualizar progresso periodicamente
      if (campaign.stats.sent % 10 === 0) {
        this.updateCampaignProgress(campaign);
      }
    }
  }

  /**
   * Personaliza mensagem com dados do contato
   */
  personalizeMessage(template, contact) {
    let message = template;
    
    // Substituir variáveis
    message = message.replace(/\{\{name\}\}/gi, contact.name || 'Cliente');
    message = message.replace(/\{\{firstName\}\}/gi, (contact.name || 'Cliente').split(' ')[0]);
    message = message.replace(/\{\{phone\}\}/gi, contact.phone || '');
    message = message.replace(/\{\{email\}\}/gi, contact.email || '');
    
    // Substituir campos customizados
    if (contact.custom) {
      for (const [key, value] of Object.entries(contact.custom)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        message = message.replace(regex, value);
      }
    }
    
    return message;
  }

  /**
   * Processa arquivo CSV
   */
  async processCSVFile(csvFile) {
    try {
      const result = await csvProcessor.parseCSV(csvFile);
      const contacts = result.data || [];
      
      // Validar e formatar contatos
      return contacts.map(contact => {
        const formatted = {
          phone: this.formatPhoneNumber(contact.phone || contact.numero || contact.telefone),
          name: contact.name || contact.nome || 'Cliente',
          email: contact.email || '',
          custom: {}
        };
        
        // Adicionar campos extras como custom
        for (const [key, value] of Object.entries(contact)) {
          if (!['phone', 'numero', 'telefone', 'name', 'nome', 'email'].includes(key.toLowerCase())) {
            formatted.custom[key] = value;
          }
        }
        
        return formatted;
      }).filter(contact => contact.phone); // Remover contatos sem telefone
      
    } catch (error) {
      logger.error('Failed to process CSV file:', error);
      throw error;
    }
  }

  /**
   * Seleciona instâncias para broadcast
   */
  selectBroadcastInstances(clientConfig) {
    const instances = Object.keys(clientConfig.instances || {})
      .filter(name => {
        const instance = clientConfig.instances[name];
        return instance.type === 'broadcast' && instance.status === 'active';
      });

    if (instances.length === 0) {
      // Fallback: usar instâncias de recovery se não houver broadcast
      return Object.keys(clientConfig.instances || {})
        .filter(name => clientConfig.instances[name].status === 'active');
    }

    return instances;
  }

  /**
   * Divide contatos entre instâncias
   */
  divideContactsBetweenInstances(contacts, instances) {
    const batches = [];
    const batchSize = Math.ceil(contacts.length / instances.length);
    
    for (let i = 0; i < instances.length; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, contacts.length);
      batches.push(contacts.slice(start, end));
    }
    
    return batches;
  }

  /**
   * Valida limites da campanha
   */
  validateCampaignLimits(clientConfig, contactCount) {
    const dailyLimit = clientConfig.limits.messagesPerDay || 1000;
    const hourlyLimit = clientConfig.limits.messagesPerHour || 100;
    
    // Verificar mensagens já enviadas hoje
    const todayStats = this.getTodayStats(clientConfig.id);
    
    if (todayStats.sent + contactCount > dailyLimit) {
      throw new Error(`Campaign exceeds daily limit of ${dailyLimit} messages`);
    }
    
    // Avisar se campanha vai demorar muito
    const estimatedHours = contactCount / hourlyLimit;
    if (estimatedHours > 24) {
      logger.warn(`Campaign will take approximately ${estimatedHours.toFixed(1)} hours to complete`);
    }
  }

  /**
   * Calcula custo da campanha
   */
  calculateCampaignCost(provider, contactCount) {
    const costs = provider.calculateCost({
      messages: contactCount,
      months: 0
    });
    
    return {
      provider: provider.name,
      contactCount,
      unitCost: costs.perMessage || 0,
      totalCost: costs.messages || 0,
      currency: 'BRL'
    };
  }

  /**
   * Estima tempo da campanha
   */
  estimateCampaignTime(campaign) {
    const avgTimePerMessage = 5; // segundos
    const parallelInstances = campaign.instances.length;
    const totalSeconds = (campaign.contacts.length * avgTimePerMessage) / parallelInstances;
    
    return {
      seconds: totalSeconds,
      minutes: Math.ceil(totalSeconds / 60),
      hours: (totalSeconds / 3600).toFixed(1),
      readable: this.formatTime(totalSeconds)
    };
  }

  /**
   * Formata tempo em formato legível
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutos`;
  }

  /**
   * Atualiza progresso da campanha
   */
  updateCampaignProgress(campaign) {
    const progress = {
      campaignId: campaign.id,
      status: campaign.status,
      progress: ((campaign.stats.sent / campaign.stats.total) * 100).toFixed(2) + '%',
      stats: campaign.stats,
      estimatedTimeRemaining: this.calculateRemainingTime(campaign)
    };
    
    // Aqui poderia emitir evento ou atualizar dashboard
    logger.info(`Campaign ${campaign.id} progress: ${progress.progress}`);
    
    return progress;
  }

  /**
   * Calcula tempo restante
   */
  calculateRemainingTime(campaign) {
    if (campaign.stats.sent === 0) return null;
    
    const elapsedTime = Date.now() - new Date(campaign.startedAt).getTime();
    const avgTimePerMessage = elapsedTime / campaign.stats.sent;
    const remainingMessages = campaign.stats.pending;
    const remainingTime = remainingMessages * avgTimePerMessage;
    
    return this.formatTime(remainingTime / 1000);
  }

  /**
   * Agenda campanha
   */
  scheduleCampaign(campaign) {
    const startTime = new Date(campaign.schedule.startTime).getTime();
    const now = Date.now();
    const delay = Math.max(0, startTime - now);
    
    campaign.status = 'scheduled';
    
    setTimeout(() => {
      this.startCampaign(campaign);
    }, delay);
    
    logger.info(`Campaign ${campaign.id} scheduled to start at ${campaign.schedule.startTime}`);
  }

  /**
   * Para uma campanha em execução
   */
  async stopCampaign(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    if (campaign.status !== 'running') {
      throw new Error(`Campaign ${campaignId} is not running`);
    }
    
    campaign.status = 'stopped';
    campaign.stoppedAt = new Date().toISOString();
    
    logger.info(`Campaign ${campaignId} stopped`);
    
    return {
      campaignId,
      status: campaign.status,
      stats: campaign.stats
    };
  }

  /**
   * Retoma uma campanha parada
   */
  async resumeCampaign(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    if (campaign.status !== 'stopped') {
      throw new Error(`Campaign ${campaignId} is not stopped`);
    }
    
    // Filtrar apenas contatos pendentes
    const pendingContacts = campaign.contacts.filter(contact => {
      const wasSent = campaign.stats.sent > 0; // Simplificado
      return !wasSent;
    });
    
    campaign.contacts = pendingContacts;
    campaign.status = 'running';
    campaign.resumedAt = new Date().toISOString();
    
    this.startCampaign(campaign);
    
    logger.info(`Campaign ${campaignId} resumed`);
    
    return {
      campaignId,
      status: campaign.status,
      pendingContacts: pendingContacts.length
    };
  }

  /**
   * Obtém estatísticas de hoje
   */
  getTodayStats(clientId) {
    // Implementar busca no banco de dados
    // Por ora, retornar valores simulados
    return {
      sent: 0,
      failed: 0
    };
  }

  /**
   * Formata número de telefone
   */
  formatPhoneNumber(number) {
    if (!number) return null;
    
    let cleaned = number.toString().replace(/\D/g, '');
    
    if (cleaned.startsWith('55') && cleaned.length > 12) {
      return cleaned;
    }
    
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Gera ID único para campanha
   */
  generateCampaignId(clientId, name) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    return `${clientId}_${safeName}_${timestamp}_${random}`;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém campanha por ID
   */
  getCampaign(campaignId) {
    return this.campaigns.get(campaignId);
  }

  /**
   * Lista campanhas de um cliente
   */
  getClientCampaigns(clientId) {
    const campaigns = [];
    
    for (const campaign of this.campaigns.values()) {
      if (campaign.clientId === clientId) {
        campaigns.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          stats: campaign.stats,
          createdAt: campaign.createdAt,
          provider: campaign.provider
        });
      }
    }
    
    return campaigns;
  }

  /**
   * Obtém estatísticas gerais
   */
  getStats() {
    return {
      ...this.stats,
      activeCampaigns: Array.from(this.campaigns.values())
        .filter(c => c.status === 'running').length,
      totalCampaigns: this.campaigns.size
    };
  }
}

// Singleton
const broadcastManager = new BroadcastManager();

export default broadcastManager;