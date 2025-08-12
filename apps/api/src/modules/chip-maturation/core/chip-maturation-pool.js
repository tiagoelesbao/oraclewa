/**
 * 🎯 CHIP MATURATION POOL
 * Gerencia pools de chips em maturação para OracleWA e clientes
 */

import logger from '../../../utils/logger.js';
import { EventEmitter } from 'events';

class ChipMaturationPool extends EventEmitter {
  constructor() {
    super();
    
    // Pool principal da OracleWA (chips de contingência)
    this.oraclePool = {
      chips: new Map(),
      config: {
        maxSize: 100,
        minActive: 10,
        targetMaturity: 30, // dias
        reserveRatio: 0.3 // 30% sempre em reserva
      },
      stats: {
        total: 0,
        active: 0,
        maturing: 0,
        ready: 0,
        inProduction: 0
      }
    };

    // Pools individuais por cliente
    this.clientPools = new Map();
    
    // Estados possíveis de um chip
    this.CHIP_STATES = {
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      MATURING: 'maturing',
      READY: 'ready',
      IN_PRODUCTION: 'in_production',
      BLOCKED: 'blocked',
      EXPIRED: 'expired'
    };

    // Fases de maturação
    this.MATURATION_PHASES = {
      BABY: { days: [0, 7], messages: 10, groups: 0 },
      CHILD: { days: [8, 14], messages: 25, groups: 1 },
      TEEN: { days: [15, 21], messages: 50, groups: 2 },
      ADULT: { days: [22, 30], messages: 100, groups: 3 },
      MATURE: { days: [31, Infinity], messages: 200, groups: 5 }
    };
  }

  /**
   * Inicializa o pool
   */
  async initialize() {
    try {
      logger.info('🏊 Inicializando Pool de Maturação de Chips...');
      
      // Carregar chips salvos do banco
      await this.loadSavedChips();
      
      // Verificar chips que precisam continuar maturação
      await this.resumeMaturation();
      
      // Iniciar monitoramento
      this.startMonitoring();
      
      logger.info('✅ Pool de Maturação inicializado');
      return true;
    } catch (error) {
      logger.error('❌ Erro ao inicializar pool:', error);
      throw error;
    }
  }

  /**
   * Adiciona chip ao pool da OracleWA
   */
  async addToOraclePool(chipData) {
    try {
      const chipId = chipData.id || `oracle_${Date.now()}`;
      
      // Validar se não excede limite
      if (this.oraclePool.chips.size >= this.oraclePool.config.maxSize) {
        throw new Error('Pool OracleWA cheio. Máximo: ' + this.oraclePool.config.maxSize);
      }

      // Estrutura completa do chip
      const chip = {
        ...chipData,
        id: chipId,
        pool: 'oracle',
        state: this.CHIP_STATES.CONNECTING,
        phase: this.getMaturationPhase(chipData.currentDay || 0),
        createdAt: new Date(),
        lastActivity: new Date(),
        history: [],
        conversations: new Map(),
        groups: new Set(),
        metrics: {
          ...chipData.metrics,
          healthScore: 100,
          riskLevel: 0,
          maturationProgress: 0
        }
      };

      // Adicionar ao pool
      this.oraclePool.chips.set(chipId, chip);
      this.updateOraclePoolStats();
      
      // Emitir evento
      this.emit('chip:added', { pool: 'oracle', chip });
      
      logger.info(`✅ Chip ${chipId} adicionado ao pool OracleWA`);
      return chip;

    } catch (error) {
      logger.error('❌ Erro ao adicionar chip ao pool OracleWA:', error);
      throw error;
    }
  }

  /**
   * Adiciona chip ao pool de um cliente
   */
  async addToClientPool(clientId, chipData) {
    try {
      // Criar pool do cliente se não existir
      if (!this.clientPools.has(clientId)) {
        this.clientPools.set(clientId, {
          chips: new Map(),
          config: {
            maxSize: 20,
            targetMaturity: 30
          },
          stats: {
            total: 0,
            active: 0,
            maturing: 0,
            ready: 0
          }
        });
      }

      const clientPool = this.clientPools.get(clientId);
      const chipId = chipData.id || `${clientId}_${Date.now()}`;

      // Validar limite
      if (clientPool.chips.size >= clientPool.config.maxSize) {
        throw new Error(`Pool do cliente ${clientId} cheio`);
      }

      // Estrutura do chip
      const chip = {
        ...chipData,
        id: chipId,
        pool: clientId,
        clientId,
        state: this.CHIP_STATES.CONNECTING,
        phase: this.getMaturationPhase(chipData.currentDay || 0),
        createdAt: new Date(),
        lastActivity: new Date(),
        history: [],
        conversations: new Map(),
        groups: new Set()
      };

      // Adicionar ao pool
      clientPool.chips.set(chipId, chip);
      this.updateClientPoolStats(clientId);
      
      // Emitir evento
      this.emit('chip:added', { pool: clientId, chip });
      
      logger.info(`✅ Chip ${chipId} adicionado ao pool do cliente ${clientId}`);
      return chip;

    } catch (error) {
      logger.error(`❌ Erro ao adicionar chip ao pool do cliente:`, error);
      throw error;
    }
  }

  /**
   * Obtém chips disponíveis para conversação
   */
  async getAvailableChipsForConversation(requesterChipId, maxResults = 5) {
    try {
      const availableChips = [];
      const requesterChip = this.findChipById(requesterChipId);
      
      if (!requesterChip) {
        throw new Error(`Chip ${requesterChipId} não encontrado`);
      }

      // Buscar no mesmo pool primeiro (Oracle ou cliente)
      const pool = requesterChip.pool === 'oracle' ? 
        this.oraclePool : 
        this.clientPools.get(requesterChip.pool);

      if (!pool) return [];

      // Filtrar chips disponíveis
      for (const [chipId, chip] of pool.chips) {
        if (
          chipId !== requesterChipId &&
          chip.state === this.CHIP_STATES.MATURING &&
          !this.hasRecentConversation(requesterChipId, chipId) &&
          this.canReceiveMessages(chip)
        ) {
          availableChips.push(chip);
          if (availableChips.length >= maxResults) break;
        }
      }

      // Se não houver chips suficientes, buscar em outros pools
      if (availableChips.length < maxResults && requesterChip.pool !== 'oracle') {
        for (const [oracleChipId, oracleChip] of this.oraclePool.chips) {
          if (
            oracleChip.state === this.CHIP_STATES.MATURING &&
            !this.hasRecentConversation(requesterChipId, oracleChipId) &&
            this.canReceiveMessages(oracleChip)
          ) {
            availableChips.push(oracleChip);
            if (availableChips.length >= maxResults) break;
          }
        }
      }

      logger.info(`🔍 Encontrados ${availableChips.length} chips disponíveis para conversar com ${requesterChipId}`);
      return availableChips;

    } catch (error) {
      logger.error('❌ Erro ao buscar chips disponíveis:', error);
      return [];
    }
  }

  /**
   * Move chip para produção
   */
  async moveToProduction(chipId, targetClient = null) {
    try {
      const chip = this.findChipById(chipId);
      
      if (!chip) {
        throw new Error(`Chip ${chipId} não encontrado`);
      }

      if (!chip.readyForProduction) {
        throw new Error(`Chip ${chipId} não está pronto para produção`);
      }

      logger.info(`🚀 Movendo chip ${chipId} para produção`);

      // Atualizar estado
      chip.state = this.CHIP_STATES.IN_PRODUCTION;
      chip.productionDate = new Date();
      chip.assignedTo = targetClient;

      // Se for atribuído a um cliente específico
      if (targetClient && chip.pool === 'oracle') {
        // Remover do pool Oracle
        this.oraclePool.chips.delete(chipId);
        
        // Adicionar ao pool do cliente
        if (!this.clientPools.has(targetClient)) {
          this.clientPools.set(targetClient, {
            chips: new Map(),
            config: { maxSize: 20 },
            stats: {}
          });
        }
        
        this.clientPools.get(targetClient).chips.set(chipId, chip);
        chip.pool = targetClient;
      }

      // Atualizar estatísticas
      this.updateAllStats();
      
      // Emitir evento
      this.emit('chip:production', { chipId, chip, targetClient });
      
      logger.info(`✅ Chip ${chipId} movido para produção${targetClient ? ` (cliente: ${targetClient})` : ''}`);
      return chip;

    } catch (error) {
      logger.error('❌ Erro ao mover chip para produção:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do pool Oracle
   */
  async getOraclePoolStats() {
    const stats = {
      ...this.oraclePool.stats,
      chips: []
    };

    for (const [chipId, chip] of this.oraclePool.chips) {
      stats.chips.push({
        id: chipId,
        state: chip.state,
        phase: chip.phase,
        currentDay: chip.currentDay,
        maturationProgress: chip.metrics?.maturationProgress || 0,
        healthScore: chip.metrics?.healthScore || 100,
        ready: chip.readyForProduction
      });
    }

    // Calcular distribuição por fase
    stats.distribution = {
      baby: stats.chips.filter(c => c.phase === 'BABY').length,
      child: stats.chips.filter(c => c.phase === 'CHILD').length,
      teen: stats.chips.filter(c => c.phase === 'TEEN').length,
      adult: stats.chips.filter(c => c.phase === 'ADULT').length,
      mature: stats.chips.filter(c => c.phase === 'MATURE').length
    };

    return stats;
  }

  /**
   * Obtém estatísticas dos pools de clientes
   */
  async getClientPoolsStats() {
    const stats = {};

    for (const [clientId, pool] of this.clientPools) {
      stats[clientId] = {
        ...pool.stats,
        chips: Array.from(pool.chips.values()).map(chip => ({
          id: chip.id,
          state: chip.state,
          phase: chip.phase,
          currentDay: chip.currentDay,
          ready: chip.readyForProduction
        }))
      };
    }

    return stats;
  }

  /**
   * Obtém todos os chips
   */
  async getAllChips() {
    const allChips = [];
    
    // Chips Oracle
    for (const chip of this.oraclePool.chips.values()) {
      allChips.push(chip);
    }
    
    // Chips de clientes
    for (const pool of this.clientPools.values()) {
      for (const chip of pool.chips.values()) {
        allChips.push(chip);
      }
    }
    
    return allChips;
  }

  /**
   * Obtém chips prontos para produção
   */
  async getProductionReadyChips(poolFilter = null) {
    const readyChips = [];
    
    if (!poolFilter || poolFilter === 'oracle') {
      for (const chip of this.oraclePool.chips.values()) {
        if (chip.readyForProduction && chip.state !== this.CHIP_STATES.IN_PRODUCTION) {
          readyChips.push(chip);
        }
      }
    }
    
    if (!poolFilter || poolFilter !== 'oracle') {
      const targetPool = poolFilter ? 
        this.clientPools.get(poolFilter) : 
        null;
      
      const pools = targetPool ? 
        [[poolFilter, targetPool]] : 
        this.clientPools.entries();
      
      for (const [clientId, pool] of pools) {
        for (const chip of pool.chips.values()) {
          if (chip.readyForProduction && chip.state !== this.CHIP_STATES.IN_PRODUCTION) {
            readyChips.push(chip);
          }
        }
      }
    }
    
    return readyChips;
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Determina a fase de maturação baseada no dia
   */
  getMaturationPhase(currentDay) {
    for (const [phase, config] of Object.entries(this.MATURATION_PHASES)) {
      if (currentDay >= config.days[0] && currentDay <= config.days[1]) {
        return phase;
      }
    }
    return 'MATURE';
  }

  /**
   * Verifica se houve conversa recente entre dois chips
   */
  hasRecentConversation(chip1Id, chip2Id, hoursThreshold = 24) {
    const chip1 = this.findChipById(chip1Id);
    if (!chip1) return false;
    
    const lastConversation = chip1.conversations.get(chip2Id);
    if (!lastConversation) return false;
    
    const hoursSince = (Date.now() - lastConversation.lastMessageAt) / (1000 * 60 * 60);
    return hoursSince < hoursThreshold;
  }

  /**
   * Verifica se chip pode receber mensagens
   */
  canReceiveMessages(chip) {
    const phase = this.MATURATION_PHASES[chip.phase];
    if (!phase) return false;
    
    const todayMessages = chip.metrics?.todayMessages || 0;
    return todayMessages < phase.messages;
  }

  /**
   * Encontra chip por ID em qualquer pool
   */
  findChipById(chipId) {
    // Buscar no pool Oracle
    if (this.oraclePool.chips.has(chipId)) {
      return this.oraclePool.chips.get(chipId);
    }
    
    // Buscar nos pools de clientes
    for (const pool of this.clientPools.values()) {
      if (pool.chips.has(chipId)) {
        return pool.chips.get(chipId);
      }
    }
    
    return null;
  }

  /**
   * Atualiza estatísticas do pool Oracle
   */
  updateOraclePoolStats() {
    const stats = {
      total: this.oraclePool.chips.size,
      active: 0,
      maturing: 0,
      ready: 0,
      inProduction: 0
    };
    
    for (const chip of this.oraclePool.chips.values()) {
      if (chip.state === this.CHIP_STATES.MATURING) stats.maturing++;
      if (chip.state === this.CHIP_STATES.READY) stats.ready++;
      if (chip.state === this.CHIP_STATES.IN_PRODUCTION) stats.inProduction++;
      if (chip.state !== this.CHIP_STATES.BLOCKED) stats.active++;
    }
    
    this.oraclePool.stats = stats;
  }

  /**
   * Atualiza estatísticas de um pool de cliente
   */
  updateClientPoolStats(clientId) {
    const pool = this.clientPools.get(clientId);
    if (!pool) return;
    
    const stats = {
      total: pool.chips.size,
      active: 0,
      maturing: 0,
      ready: 0
    };
    
    for (const chip of pool.chips.values()) {
      if (chip.state === this.CHIP_STATES.MATURING) stats.maturing++;
      if (chip.state === this.CHIP_STATES.READY) stats.ready++;
      if (chip.state !== this.CHIP_STATES.BLOCKED) stats.active++;
    }
    
    pool.stats = stats;
  }

  /**
   * Atualiza todas as estatísticas
   */
  updateAllStats() {
    this.updateOraclePoolStats();
    for (const clientId of this.clientPools.keys()) {
      this.updateClientPoolStats(clientId);
    }
  }

  /**
   * Inicia monitoramento dos pools
   */
  startMonitoring() {
    // Verificar saúde dos chips a cada 5 minutos
    setInterval(() => {
      this.checkChipsHealth();
    }, 5 * 60 * 1000);
    
    // Atualizar estatísticas a cada minuto
    setInterval(() => {
      this.updateAllStats();
    }, 60 * 1000);
    
    logger.info('📊 Monitoramento de pools iniciado');
  }

  /**
   * Verifica saúde dos chips
   */
  async checkChipsHealth() {
    const allChips = await this.getAllChips();
    
    for (const chip of allChips) {
      // Verificar última atividade
      const hoursSinceActivity = (Date.now() - chip.lastActivity) / (1000 * 60 * 60);
      
      if (hoursSinceActivity > 24) {
        chip.metrics.healthScore = Math.max(0, chip.metrics.healthScore - 10);
        logger.warn(`⚠️ Chip ${chip.id} sem atividade há ${hoursSinceActivity.toFixed(1)} horas`);
      }
      
      // Verificar se está bloqueado
      if (chip.metrics.healthScore < 50) {
        chip.metrics.riskLevel = 'high';
        this.emit('chip:risk', { chip, reason: 'low_health' });
      }
    }
  }

  /**
   * Carrega chips salvos
   */
  async loadSavedChips() {
    // TODO: Implementar carregamento do banco de dados
    logger.info('📂 Carregando chips salvos...');
  }

  /**
   * Retoma maturação de chips
   */
  async resumeMaturation() {
    // TODO: Retomar processos de maturação interrompidos
    logger.info('🔄 Retomando processos de maturação...');
  }
}

export default ChipMaturationPool;