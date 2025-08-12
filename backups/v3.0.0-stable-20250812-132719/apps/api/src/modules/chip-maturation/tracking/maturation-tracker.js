/**
 * 📊 MATURATION TRACKER
 * 
 * Sistema de rastreamento e métricas de maturação de chips
 * Monitora progresso, saúde e performance dos chips em maturação
 */

import logger from '../../../utils/logger.js';

export default class MaturationTracker {
  constructor() {
    this.metrics = new Map(); // chipId -> metrics
    this.history = new Map();  // chipId -> history[]
    this.alerts = [];
    this.initialized = false;
  }

  /**
   * Inicializar tracker
   */
  async initialize() {
    try {
      logger.info('📊 Inicializando Maturation Tracker...');
      
      // Limpar dados antigos periodicamente (1h)
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData();
      }, 60 * 60 * 1000);

      this.initialized = true;
      logger.info('✅ Maturation Tracker inicializado');
    } catch (error) {
      logger.error('❌ Erro ao inicializar Maturation Tracker:', error);
      throw error;
    }
  }

  /**
   * Registrar evento de chip
   */
  trackEvent(chipId, eventType, data = {}) {
    try {
      const timestamp = new Date();
      
      // Atualizar métricas
      if (!this.metrics.has(chipId)) {
        this.metrics.set(chipId, this.createInitialMetrics(chipId));
      }
      
      const metrics = this.metrics.get(chipId);
      this.updateMetrics(metrics, eventType, data, timestamp);
      
      // Adicionar ao histórico
      if (!this.history.has(chipId)) {
        this.history.set(chipId, []);
      }
      
      this.history.get(chipId).push({
        event: eventType,
        data,
        timestamp
      });
      
      // Verificar alertas
      this.checkAlerts(chipId, metrics);
      
    } catch (error) {
      logger.error(`❌ Erro ao rastrear evento para chip ${chipId}:`, error);
    }
  }

  /**
   * Criar métricas iniciais para novo chip
   */
  createInitialMetrics(chipId) {
    return {
      chipId,
      startTime: new Date(),
      
      // Métricas de atividade
      totalMessages: 0,
      messagesPerDay: {},
      conversationsStarted: 0,
      conversationsReceived: 0,
      groupsJoined: 0,
      groupInteractions: 0,
      
      // Métricas de saúde
      healthScore: 100, // 0-100
      riskLevel: 'low',  // low, medium, high
      
      // Progresso de maturação
      maturationProgress: 0, // 0-100%
      currentPhase: 'baby',  // baby, child, teen, adult
      
      // Performance
      responseTime: [],
      uptime: 0,
      errors: 0,
      
      // Últimas atividades
      lastActivity: new Date(),
      lastConversation: null,
      lastGroupJoin: null
    };
  }

  /**
   * Atualizar métricas com base no evento
   */
  updateMetrics(metrics, eventType, data, timestamp) {
    const today = timestamp.toISOString().split('T')[0];
    
    switch (eventType) {
      case 'message_sent':
        metrics.totalMessages++;
        metrics.messagesPerDay[today] = (metrics.messagesPerDay[today] || 0) + 1;
        metrics.lastActivity = timestamp;
        break;
        
      case 'conversation_started':
        metrics.conversationsStarted++;
        metrics.lastConversation = timestamp;
        break;
        
      case 'conversation_received':
        metrics.conversationsReceived++;
        break;
        
      case 'group_joined':
        metrics.groupsJoined++;
        metrics.lastGroupJoin = timestamp;
        break;
        
      case 'group_interaction':
        metrics.groupInteractions++;
        break;
        
      case 'error':
        metrics.errors++;
        this.updateHealthScore(metrics, -5);
        break;
        
      case 'phase_change':
        metrics.currentPhase = data.newPhase;
        metrics.maturationProgress = this.calculateMaturationProgress(data.newPhase, data.currentDay);
        break;
        
      case 'response':
        if (data.responseTime) {
          metrics.responseTime.push(data.responseTime);
          if (metrics.responseTime.length > 100) {
            metrics.responseTime.shift(); // Manter apenas os últimos 100
          }
        }
        break;
    }
    
    // Atualizar uptime e health score
    this.updateUptime(metrics, timestamp);
    this.updateRiskLevel(metrics);
  }

  /**
   * Calcular progresso de maturação
   */
  calculateMaturationProgress(phase, currentDay) {
    const phaseProgress = {
      'baby': Math.min((currentDay / 7) * 25, 25),
      'child': 25 + Math.min(((currentDay - 7) / 7) * 25, 25),
      'teen': 50 + Math.min(((currentDay - 14) / 7) * 25, 25),
      'adult': 75 + Math.min(((currentDay - 21) / 9) * 25, 25)
    };
    
    return Math.min(phaseProgress[phase] || 0, 100);
  }

  /**
   * Atualizar health score
   */
  updateHealthScore(metrics, change) {
    metrics.healthScore = Math.max(0, Math.min(100, metrics.healthScore + change));
  }

  /**
   * Atualizar nível de risco
   */
  updateRiskLevel(metrics) {
    if (metrics.healthScore < 30 || metrics.errors > 10) {
      metrics.riskLevel = 'high';
    } else if (metrics.healthScore < 60 || metrics.errors > 3) {
      metrics.riskLevel = 'medium';
    } else {
      metrics.riskLevel = 'low';
    }
  }

  /**
   * Atualizar uptime
   */
  updateUptime(metrics, timestamp) {
    const startTime = metrics.startTime.getTime();
    const currentTime = timestamp.getTime();
    metrics.uptime = Math.floor((currentTime - startTime) / 1000); // em segundos
  }

  /**
   * Registrar novo chip
   */
  registerChip(chipId, chipData) {
    try {
      if (!this.metrics.has(chipId)) {
        const metrics = this.createInitialMetrics(chipId);
        this.metrics.set(chipId, metrics);
        
        this.trackEvent(chipId, 'chip_registered', {
          instanceName: chipData.instanceName,
          owner: chipData.owner,
          strategy: chipData.strategy
        });
        
        logger.debug(`📊 Chip registrado no tracker: ${chipId}`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao registrar chip ${chipId}:`, error);
    }
  }

  /**
   * Obter métricas de um chip
   */
  getChipMetrics(chipId) {
    return this.metrics.get(chipId) || null;
  }

  /**
   * Obter histórico de um chip
   */
  getChipHistory(chipId, limit = 50) {
    const history = this.history.get(chipId) || [];
    return history.slice(-limit).reverse(); // Mais recentes primeiro
  }

  /**
   * Obter estatísticas gerais
   */
  getGeneralStats() {
    const totalChips = this.metrics.size;
    let totalMessages = 0;
    let totalConversations = 0;
    let averageHealthScore = 0;
    let riskDistribution = { low: 0, medium: 0, high: 0 };
    let phaseDistribution = { baby: 0, child: 0, teen: 0, adult: 0 };

    for (const metrics of this.metrics.values()) {
      totalMessages += metrics.totalMessages;
      totalConversations += metrics.conversationsStarted;
      averageHealthScore += metrics.healthScore;
      riskDistribution[metrics.riskLevel]++;
      phaseDistribution[metrics.currentPhase]++;
    }

    if (totalChips > 0) {
      averageHealthScore = Math.round(averageHealthScore / totalChips);
    }

    return {
      totalChips,
      totalMessages,
      totalConversations,
      averageHealthScore,
      riskDistribution,
      phaseDistribution,
      activeAlerts: this.alerts.length,
      lastUpdate: new Date()
    };
  }

  /**
   * Verificar alertas
   */
  checkAlerts(chipId, metrics) {
    const alerts = [];
    
    // Alerta: Health score baixo
    if (metrics.healthScore < 30) {
      alerts.push({
        type: 'low_health',
        chipId,
        message: `Health score muito baixo: ${metrics.healthScore}%`,
        severity: 'high'
      });
    }
    
    // Alerta: Muitos erros
    if (metrics.errors > 5) {
      alerts.push({
        type: 'high_errors',
        chipId,
        message: `Muitos erros registrados: ${metrics.errors}`,
        severity: 'medium'
      });
    }
    
    // Alerta: Inatividade
    const hoursSinceActivity = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity > 24) {
      alerts.push({
        type: 'inactive',
        chipId,
        message: `Sem atividade há ${Math.round(hoursSinceActivity)} horas`,
        severity: 'medium'
      });
    }
    
    // Adicionar novos alertas
    for (const alert of alerts) {
      alert.timestamp = new Date();
      this.alerts.push(alert);
    }
    
    // Limitar número de alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(severity = null) {
    let alerts = this.alerts.filter(alert => {
      // Alertas dos últimos 30 minutos
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return alert.timestamp.getTime() > thirtyMinutesAgo;
    });
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts;
  }

  /**
   * Limpar dados antigos
   */
  cleanupOldData() {
    try {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      // Limpar alertas antigos
      this.alerts = this.alerts.filter(alert => 
        alert.timestamp.getTime() > oneDayAgo
      );
      
      // Limpar histórico antigo (manter apenas 1000 eventos por chip)
      for (const [chipId, history] of this.history.entries()) {
        if (history.length > 1000) {
          this.history.set(chipId, history.slice(-1000));
        }
      }
      
      logger.debug('🧹 Limpeza de dados antigos concluída');
    } catch (error) {
      logger.error('❌ Erro na limpeza de dados:', error);
    }
  }

  /**
   * Finalizar tracker
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.initialized = false;
    logger.info('📊 Maturation Tracker finalizado');
  }
}