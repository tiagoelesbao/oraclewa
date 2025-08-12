import logger from '../../utils/logger.js';
import { getRedisClient } from '../redis/client.js';
import warmupManager from './warmup-manager.js';

/**
 * Gerenciador de Pools de WhatsApp para alto volume
 * Separa números por tipo de mensagem e gerencia saúde
 */
export class WhatsAppPoolManager {
  constructor() {
    this.redis = process.env.SKIP_DB !== 'true' ? getRedisClient() : null;
    
    // Pools separados por tipo de mensagem
    this.pools = {
      approved: {
        active: [],    // Números ativos para compras aprovadas
        warmup: [],    // Números em aquecimento
        cooldown: [],  // Números em descanso
        retired: []    // Números aposentados
      },
      expired: {
        active: [],
        warmup: [],
        cooldown: [],
        retired: []
      }
    };
    
    // Configurações por pool
    this.poolConfig = {
      approved: {
        priority: 1,          // Maior prioridade
        maxDailyPerNumber: 800,  // Limite conservador
        minNumbers: 3,        // Mínimo de números ativos
        targetNumbers: 6      // Números ideais
      },
      expired: {
        priority: 2,
        maxDailyPerNumber: 800,
        minNumbers: 3,
        targetNumbers: 6
      }
    };
    
    // Métricas de saúde
    this.healthMetrics = new Map();
  }

  /**
   * Inicializa os pools com as instâncias disponíveis
   */
  async initialize(instances) {
    logger.info('Initializing WhatsApp Pool Manager...');
    
    // Distribuir instâncias entre os pools
    const halfPoint = Math.ceil(instances.length / 2);
    
    // Primeira metade para aprovadas (maior prioridade)
    for (let i = 0; i < halfPoint && i < instances.length; i++) {
      this.pools.approved.active.push({
        ...instances[i],
        assignedPool: 'approved',
        dailyCount: 0,
        hourlyCount: 0,
        lastReset: new Date(),
        healthScore: 1.0
      });
    }
    
    // Segunda metade para expiradas
    for (let i = halfPoint; i < instances.length; i++) {
      this.pools.expired.active.push({
        ...instances[i],
        assignedPool: 'expired',
        dailyCount: 0,
        hourlyCount: 0,
        lastReset: new Date(),
        healthScore: 1.0
      });
    }
    
    logger.info(`Pools initialized - Approved: ${this.pools.approved.active.length}, Expired: ${this.pools.expired.active.length}`);
    
    // Iniciar monitoramento
    this.startHealthMonitoring();
    this.startMetricsCollection();
  }

  /**
   * Obtém a melhor instância para o tipo de mensagem
   */
  async getInstanceForMessageType(messageType) {
    const poolType = this.getPoolTypeForMessage(messageType);
    const pool = this.pools[poolType];
    
    // Tentar obter instância saudável do pool correto
    let instance = await this.getHealthiestInstance(poolType);
    
    // Se não houver instância disponível, tentar pool alternativo
    if (!instance) {
      logger.warn(`No healthy instance in ${poolType} pool, trying alternative...`);
      const altPoolType = poolType === 'approved' ? 'expired' : 'approved';
      instance = await this.getHealthiestInstance(altPoolType);
    }
    
    // Se ainda não houver, ativar backup
    if (!instance) {
      logger.error('No instances available in any pool!');
      instance = await this.activateBackupInstance(poolType);
    }
    
    if (!instance) {
      throw new Error('No WhatsApp instances available');
    }
    
    // Incrementar contadores
    instance.dailyCount++;
    instance.hourlyCount++;
    
    // Atualizar métricas
    await this.updateInstanceMetrics(instance);
    
    return instance;
  }

  /**
   * Determina o pool baseado no tipo de mensagem
   */
  getPoolTypeForMessage(messageType) {
    return ['order_paid', 'venda_aprovada'].includes(messageType) ? 'approved' : 'expired';
  }

  /**
   * Obtém a instância mais saudável do pool
   */
  async getHealthiestInstance(poolType) {
    const pool = this.pools[poolType];
    const config = this.poolConfig[poolType];
    
    // Filtrar apenas instâncias que podem enviar
    const availableInstances = pool.active.filter(instance => {
      return instance.status === 'connected' &&
             instance.dailyCount < config.maxDailyPerNumber &&
             instance.healthScore > 0.5;
    });
    
    if (availableInstances.length === 0) {
      return null;
    }
    
    // Ordenar por saúde e uso
    availableInstances.sort((a, b) => {
      // Priorizar por score de saúde
      if (Math.abs(a.healthScore - b.healthScore) > 0.1) {
        return b.healthScore - a.healthScore;
      }
      // Depois por menor uso diário
      return a.dailyCount - b.dailyCount;
    });
    
    return availableInstances[0];
  }

  /**
   * Calcula score de saúde da instância
   */
  async calculateHealthScore(instance) {
    let score = 1.0;
    
    // Penalizar por uso alto
    const usageRatio = instance.dailyCount / this.poolConfig[instance.assignedPool].maxDailyPerNumber;
    score -= usageRatio * 0.3;
    
    // Penalizar por erros recentes
    const recentErrors = await this.getRecentErrors(instance.name);
    score -= Math.min(recentErrors * 0.1, 0.5);
    
    // Penalizar por tempo sem reset
    const hoursSinceReset = (Date.now() - instance.lastReset) / (1000 * 60 * 60);
    if (hoursSinceReset > 24) {
      score -= 0.2;
    }
    
    // Bonus por estar em aquecimento completo
    const isWarmedUp = await warmupManager.isNumberInWarmup(instance.name);
    if (!isWarmedUp) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Move instância para cooldown/retirement
   */
  async moveInstanceToState(instance, fromState, toState) {
    const pool = this.pools[instance.assignedPool];
    
    // Remover do estado atual
    const index = pool[fromState].findIndex(i => i.name === instance.name);
    if (index > -1) {
      pool[fromState].splice(index, 1);
    }
    
    // Adicionar ao novo estado
    instance.movedAt = new Date();
    instance.previousState = fromState;
    pool[toState].push(instance);
    
    logger.info(`Moved instance ${instance.name} from ${fromState} to ${toState} in ${instance.assignedPool} pool`);
    
    // Se moveu de active, pode precisar ativar backup
    if (fromState === 'active' && pool.active.length < this.poolConfig[instance.assignedPool].minNumbers) {
      await this.activateBackupInstance(instance.assignedPool);
    }
  }

  /**
   * Ativa instância de backup
   */
  async activateBackupInstance(poolType) {
    const pool = this.pools[poolType];
    
    // Primeiro tentar warmup
    if (pool.warmup.length > 0) {
      const instance = pool.warmup.shift();
      instance.healthScore = 0.8;
      instance.dailyCount = 0;
      instance.hourlyCount = 0;
      pool.active.push(instance);
      logger.info(`Activated warmup instance ${instance.name} for ${poolType} pool`);
      return instance;
    }
    
    // Depois tentar cooldown
    if (pool.cooldown.length > 0) {
      const instance = pool.cooldown.shift();
      instance.healthScore = 0.6;
      instance.dailyCount = 0;
      instance.hourlyCount = 0;
      pool.active.push(instance);
      logger.info(`Activated cooldown instance ${instance.name} for ${poolType} pool`);
      return instance;
    }
    
    logger.error(`No backup instances available for ${poolType} pool!`);
    return null;
  }

  /**
   * Monitoramento contínuo de saúde
   */
  startHealthMonitoring() {
    // Verificar saúde a cada 5 minutos
    setInterval(async () => {
      for (const poolType of Object.keys(this.pools)) {
        const pool = this.pools[poolType];
        
        for (const instance of pool.active) {
          // Calcular score de saúde
          instance.healthScore = await this.calculateHealthScore(instance);
          
          // Se saúde muito baixa, mover para cooldown
          if (instance.healthScore < 0.3) {
            logger.warn(`Instance ${instance.name} health critically low (${instance.healthScore})`);
            await this.moveInstanceToState(instance, 'active', 'cooldown');
          }
          
          // Se atingiu limite diário, mover para cooldown
          if (instance.dailyCount >= this.poolConfig[poolType].maxDailyPerNumber) {
            logger.info(`Instance ${instance.name} reached daily limit`);
            await this.moveInstanceToState(instance, 'active', 'cooldown');
          }
        }
        
        // Verificar se precisa mais instâncias ativas
        if (pool.active.length < this.poolConfig[poolType].minNumbers) {
          logger.warn(`${poolType} pool below minimum instances (${pool.active.length}/${this.poolConfig[poolType].minNumbers})`);
          await this.activateBackupInstance(poolType);
        }
      }
    }, 300000); // 5 minutos
    
    // Reset contadores a cada hora
    setInterval(() => {
      for (const poolType of Object.keys(this.pools)) {
        for (const instance of this.pools[poolType].active) {
          instance.hourlyCount = 0;
        }
      }
    }, 3600000); // 1 hora
    
    // Reset diário à meia-noite
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        for (const poolType of Object.keys(this.pools)) {
          for (const state of ['active', 'cooldown']) {
            for (const instance of this.pools[poolType][state]) {
              instance.dailyCount = 0;
              instance.lastReset = now;
            }
          }
        }
        logger.info('Daily counters reset for all instances');
      }
    }, 300000); // Verificar a cada 5 minutos
  }

  /**
   * Coleta métricas para dashboard
   */
  async startMetricsCollection() {
    setInterval(async () => {
      const metrics = {
        timestamp: new Date(),
        pools: {}
      };
      
      for (const poolType of Object.keys(this.pools)) {
        metrics.pools[poolType] = {
          active: this.pools[poolType].active.length,
          warmup: this.pools[poolType].warmup.length,
          cooldown: this.pools[poolType].cooldown.length,
          retired: this.pools[poolType].retired.length,
          totalMessages: this.pools[poolType].active.reduce((sum, i) => sum + i.dailyCount, 0),
          avgHealth: this.pools[poolType].active.reduce((sum, i) => sum + i.healthScore, 0) / this.pools[poolType].active.length || 0
        };
      }
      
      // Salvar métricas
      if (this.redis) {
        await this.redis.lpush('pool_metrics', JSON.stringify(metrics));
        await this.redis.ltrim('pool_metrics', 0, 288); // Manter 24h de dados (5min intervals)
      }
      
      logger.info('Pool metrics collected', metrics);
    }, 300000); // 5 minutos
  }

  /**
   * Obtém erros recentes de uma instância
   */
  async getRecentErrors(instanceName) {
    if (!this.redis) return 0;
    
    const key = `errors:${instanceName}:${new Date().toISOString().split('T')[0]}`;
    const errors = await this.redis.get(key);
    return parseInt(errors || '0');
  }

  /**
   * Atualiza métricas da instância
   */
  async updateInstanceMetrics(instance) {
    if (!this.redis) return;
    
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    await this.redis.hincrby(`metrics:${instance.name}:${date}`, 'total', 1);
    await this.redis.hincrby(`metrics:${instance.name}:${date}`, `hour_${hour}`, 1);
    await this.redis.expire(`metrics:${instance.name}:${date}`, 604800); // 7 dias
  }

  /**
   * Obtém status completo dos pools
   */
  getPoolsStatus() {
    const status = {
      summary: {
        totalActive: 0,
        totalWarmup: 0,
        totalCooldown: 0,
        totalRetired: 0,
        totalMessagesToday: 0
      },
      pools: {}
    };
    
    for (const poolType of Object.keys(this.pools)) {
      const pool = this.pools[poolType];
      
      status.pools[poolType] = {
        active: pool.active.map(i => ({
          name: i.name,
          health: i.healthScore,
          dailyCount: i.dailyCount,
          hourlyCount: i.hourlyCount,
          status: i.status
        })),
        warmup: pool.warmup.length,
        cooldown: pool.cooldown.length,
        retired: pool.retired.length,
        config: this.poolConfig[poolType]
      };
      
      status.summary.totalActive += pool.active.length;
      status.summary.totalWarmup += pool.warmup.length;
      status.summary.totalCooldown += pool.cooldown.length;
      status.summary.totalRetired += pool.retired.length;
      status.summary.totalMessagesToday += pool.active.reduce((sum, i) => sum + i.dailyCount, 0);
    }
    
    return status;
  }
}

export default new WhatsAppPoolManager();