/**
 * Estratégia Anti-ban para Broadcast
 * Implementa técnicas para evitar banimento em envios em massa
 */

import logger from '../../../utils/logger.js';

class AntibanStrategy {
  constructor() {
    this.instanceStats = new Map();
    this.config = {
      delays: {
        min: 15000,  // 15 segundos
        max: 45000,  // 45 segundos
        typing: 3000  // 3 segundos digitando
      },
      limits: {
        messagesPerHour: 100,
        messagesPerDay: 1000,
        messagesPerBatch: 10,
        pauseBetweenBatches: 300000 // 5 minutos
      },
      warmup: {
        day1: { min: 10, max: 20 },
        day2: { min: 30, max: 40 },
        day3: { min: 50, max: 60 },
        day7: { min: 70, max: 100 },
        mature: { min: 100, max: 150 }
      },
      variations: {
        enabled: true,
        prefixes: [
          'Olá', 'Oi', 'Bom dia', 'Boa tarde', 'Boa noite', 
          'Tudo bem?', 'Como vai?', 'Espero que esteja bem'
        ],
        suffixes: [
          'Abraços!', 'Até mais!', 'Fico à disposição', 
          'Qualquer dúvida estou aqui', 'Tenha um ótimo dia!'
        ]
      }
    };
  }

  async initialize() {
    logger.info('Antiban Strategy initialized');
    return true;
  }

  /**
   * Executado antes de enviar mensagem
   */
  async beforeSend(instanceName, clientId) {
    const stats = this.getInstanceStats(instanceName);
    
    // Verificar limites
    this.checkLimits(stats, instanceName);
    
    // Aplicar delay variável
    const delay = this.calculateDelay(stats);
    await this.sleep(delay);
    
    // Incrementar contador
    stats.messagesThisHour++;
    stats.messagesToday++;
    stats.messagesSinceLastPause++;
    
    return true;
  }

  /**
   * Executado após enviar mensagem
   */
  async afterSend(instanceName, clientId) {
    const stats = this.getInstanceStats(instanceName);
    
    // Verificar se precisa pausar
    if (stats.messagesSinceLastPause >= this.config.limits.messagesPerBatch) {
      logger.info(`Pausing instance ${instanceName} after batch of ${stats.messagesSinceLastPause} messages`);
      await this.sleep(this.config.limits.pauseBetweenBatches);
      stats.messagesSinceLastPause = 0;
      stats.lastPauseTime = Date.now();
    }
    
    // Resetar contadores se necessário
    this.resetCountersIfNeeded(stats);
    
    return true;
  }

  /**
   * Obtém estatísticas da instância
   */
  getInstanceStats(instanceName) {
    if (!this.instanceStats.has(instanceName)) {
      this.instanceStats.set(instanceName, {
        messagesThisHour: 0,
        messagesToday: 0,
        messagesSinceLastPause: 0,
        lastMessageTime: 0,
        lastHourReset: Date.now(),
        lastDayReset: Date.now(),
        lastPauseTime: 0,
        instanceAge: 0, // dias desde criação
        totalMessages: 0
      });
    }
    
    return this.instanceStats.get(instanceName);
  }

  /**
   * Verifica limites da instância
   */
  checkLimits(stats, instanceName) {
    // Verificar limite diário baseado na idade do chip
    const dailyLimit = this.getDailyLimit(stats.instanceAge);
    
    if (stats.messagesToday >= dailyLimit) {
      throw new Error(`Daily limit reached for instance ${instanceName} (${dailyLimit} messages)`);
    }
    
    // Verificar limite por hora
    const hourlyLimit = Math.min(this.config.limits.messagesPerHour, Math.floor(dailyLimit / 10));
    
    if (stats.messagesThisHour >= hourlyLimit) {
      const waitTime = 3600000 - (Date.now() - stats.lastHourReset);
      throw new Error(`Hourly limit reached for instance ${instanceName}. Wait ${Math.ceil(waitTime / 60000)} minutes`);
    }
  }

  /**
   * Calcula delay baseado em vários fatores
   */
  calculateDelay(stats) {
    let baseDelay = this.randomBetween(this.config.delays.min, this.config.delays.max);
    
    // Aumentar delay se muitas mensagens recentes
    if (stats.messagesSinceLastPause > 5) {
      baseDelay *= 1.5;
    }
    
    // Aumentar delay se aproximando do limite
    const usagePercent = stats.messagesThisHour / this.config.limits.messagesPerHour;
    if (usagePercent > 0.8) {
      baseDelay *= 2;
    }
    
    // Adicionar variação aleatória
    const variation = this.randomBetween(-5000, 5000);
    
    return Math.max(this.config.delays.min, baseDelay + variation);
  }

  /**
   * Obtém limite diário baseado na idade do chip
   */
  getDailyLimit(instanceAge) {
    if (instanceAge <= 1) {
      return this.randomBetween(this.config.warmup.day1.min, this.config.warmup.day1.max);
    } else if (instanceAge <= 2) {
      return this.randomBetween(this.config.warmup.day2.min, this.config.warmup.day2.max);
    } else if (instanceAge <= 3) {
      return this.randomBetween(this.config.warmup.day3.min, this.config.warmup.day3.max);
    } else if (instanceAge <= 7) {
      return this.randomBetween(this.config.warmup.day7.min, this.config.warmup.day7.max);
    } else {
      return this.randomBetween(this.config.warmup.mature.min, this.config.warmup.mature.max);
    }
  }

  /**
   * Adiciona variação à mensagem
   */
  addMessageVariation(message, contact) {
    if (!this.config.variations.enabled) {
      return message;
    }
    
    // Adicionar prefixo aleatório
    const prefix = this.config.variations.prefixes[
      Math.floor(Math.random() * this.config.variations.prefixes.length)
    ];
    
    // Adicionar sufixo aleatório
    const suffix = this.config.variations.suffixes[
      Math.floor(Math.random() * this.config.variations.suffixes.length)
    ];
    
    // Adicionar emojis aleatórios
    const emojis = ['😊', '🙂', '👍', '✨', '🎯', '💫', '🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Montar mensagem com variações
    let variedMessage = `${prefix} ${contact.name || 'amigo'}! ${emoji}\n\n${message}\n\n${suffix}`;
    
    // Adicionar pequenas variações no texto
    variedMessage = this.applyTextVariations(variedMessage);
    
    return variedMessage;
  }

  /**
   * Aplica pequenas variações no texto
   */
  applyTextVariations(text) {
    // Variações de pontuação
    if (Math.random() > 0.5) {
      text = text.replace(/!/g, Math.random() > 0.5 ? '!!' : '.');
    }
    
    // Variações de espaçamento
    if (Math.random() > 0.7) {
      text = text.replace(/\n\n/g, '\n\n\n');
    }
    
    // Adicionar reticências ocasionalmente
    if (Math.random() > 0.8) {
      text = text.replace(/\./g, '...');
    }
    
    return text;
  }

  /**
   * Reseta contadores se necessário
   */
  resetCountersIfNeeded(stats) {
    const now = Date.now();
    
    // Reset contador horário
    if (now - stats.lastHourReset > 3600000) {
      stats.messagesThisHour = 0;
      stats.lastHourReset = now;
      logger.debug('Hourly counter reset');
    }
    
    // Reset contador diário
    if (now - stats.lastDayReset > 86400000) {
      stats.messagesToday = 0;
      stats.lastDayReset = now;
      stats.instanceAge++;
      logger.debug('Daily counter reset');
    }
  }

  /**
   * Valida se chip está aquecido para envio
   */
  isChipWarmedUp(instanceName) {
    const stats = this.getInstanceStats(instanceName);
    
    // Chip precisa ter pelo menos 3 dias
    if (stats.instanceAge < 3) {
      logger.warn(`Instance ${instanceName} is not warmed up (${stats.instanceAge} days old)`);
      return false;
    }
    
    // Chip precisa ter enviado mensagens consistentemente
    if (stats.totalMessages < 100) {
      logger.warn(`Instance ${instanceName} has low message count (${stats.totalMessages} total)`);
      return false;
    }
    
    return true;
  }

  /**
   * Obtém recomendação de instâncias para campanha
   */
  recommendInstances(instances, messageCount) {
    const recommendations = [];
    
    for (const instanceName of instances) {
      const stats = this.getInstanceStats(instanceName);
      const dailyLimit = this.getDailyLimit(stats.instanceAge);
      const available = dailyLimit - stats.messagesToday;
      
      if (available > 0) {
        recommendations.push({
          instance: instanceName,
          available,
          isWarmedUp: this.isChipWarmedUp(instanceName),
          age: stats.instanceAge,
          dailyLimit
        });
      }
    }
    
    // Ordenar por capacidade disponível
    recommendations.sort((a, b) => b.available - a.available);
    
    // Calcular quantas instâncias são necessárias
    let remaining = messageCount;
    const selected = [];
    
    for (const rec of recommendations) {
      if (remaining <= 0) break;
      
      selected.push({
        ...rec,
        messages: Math.min(rec.available, remaining)
      });
      
      remaining -= rec.available;
    }
    
    if (remaining > 0) {
      logger.warn(`Not enough capacity. ${remaining} messages will need to wait for tomorrow`);
    }
    
    return selected;
  }

  /**
   * Gera relatório de saúde das instâncias
   */
  getHealthReport() {
    const report = {
      instances: [],
      totalCapacity: 0,
      usedToday: 0,
      availableToday: 0
    };
    
    for (const [instanceName, stats] of this.instanceStats) {
      const dailyLimit = this.getDailyLimit(stats.instanceAge);
      const available = dailyLimit - stats.messagesToday;
      
      report.instances.push({
        name: instanceName,
        age: stats.instanceAge,
        dailyLimit,
        sentToday: stats.messagesToday,
        available,
        isWarmedUp: this.isChipWarmedUp(instanceName),
        health: this.calculateHealth(stats)
      });
      
      report.totalCapacity += dailyLimit;
      report.usedToday += stats.messagesToday;
      report.availableToday += available;
    }
    
    return report;
  }

  /**
   * Calcula saúde da instância
   */
  calculateHealth(stats) {
    let score = 100;
    
    // Penalizar por uso excessivo
    const usagePercent = stats.messagesToday / this.getDailyLimit(stats.instanceAge);
    if (usagePercent > 0.8) score -= 20;
    if (usagePercent > 0.9) score -= 30;
    
    // Penalizar chips muito novos
    if (stats.instanceAge < 3) score -= 30;
    if (stats.instanceAge < 7) score -= 10;
    
    // Bonificar chips com histórico consistente
    if (stats.totalMessages > 1000) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper para gerar número aleatório entre min e max
   */
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Helper para sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reseta todas as estatísticas
   */
  resetAllStats() {
    this.instanceStats.clear();
    logger.info('All instance statistics reset');
  }
}

export default AntibanStrategy;