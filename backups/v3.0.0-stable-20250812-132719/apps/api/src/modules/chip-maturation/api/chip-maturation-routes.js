/**
 * 🛣️ CHIP MATURATION API ROUTES
 * Endpoints para gerenciar o sistema de maturação de chips
 */

import express from 'express';
import chipMaturationModule from '../index.js';
import logger from '../../../utils/logger.js';

const router = express.Router();

// ========== GESTÃO DE CHIPS ==========

/**
 * GET /api/chip-maturation/stats
 * Estatísticas gerais do sistema de maturação
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('📊 Solicitação de estatísticas de maturação');
    
    const stats = await chipMaturationModule.getStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    logger.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chip-maturation/chips
 * Adicionar novo chip ao pool de maturação
 */
router.post('/chips', async (req, res) => {
  try {
    const {
      instanceName,
      phoneNumber,
      owner = 'oraclewa',
      strategy = 'gradual_conti_chips',
      priority = 'normal'
    } = req.body;

    // Validações
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📱 Adicionando chip ${instanceName} ao pool de maturação`);

    const chipData = {
      instanceName,
      phoneNumber,
      owner,
      strategy,
      priority
    };

    const maturationRecord = await chipMaturationModule.addChipToMaturation(chipData);

    res.status(201).json({
      success: true,
      message: 'Chip adicionado ao pool de maturação',
      chip: maturationRecord,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao adicionar chip:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/chips
 * Listar todos os chips em maturação
 */
router.get('/chips', async (req, res) => {
  try {
    const { owner, status, strategy } = req.query;
    
    logger.info('📋 Listando chips em maturação');
    
    let chips = await chipMaturationModule.pool.getAllChips();
    
    // Aplicar filtros
    if (owner) {
      chips = chips.filter(chip => chip.owner === owner);
    }
    
    if (status) {
      chips = chips.filter(chip => chip.status === status);
    }
    
    if (strategy) {
      chips = chips.filter(chip => chip.strategy === strategy);
    }

    // Formatear resposta
    const formattedChips = chips.map(chip => ({
      id: chip.id,
      instanceName: chip.instanceName,
      phoneNumber: chip.phoneNumber,
      owner: chip.owner,
      strategy: chip.strategy,
      status: chip.status,
      phase: chip.phase,
      currentDay: chip.currentDay,
      progress: Math.min((chip.currentDay / 30) * 100, 100),
      readyForProduction: chip.readyForProduction,
      metrics: chip.metrics,
      createdAt: chip.startDate
    }));

    res.json({
      success: true,
      count: formattedChips.length,
      chips: formattedChips,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao listar chips:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/chips/:chipId
 * Detalhes de um chip específico
 */
router.get('/chips/:chipId', async (req, res) => {
  try {
    const { chipId } = req.params;
    
    logger.info(`🔍 Buscando detalhes do chip ${chipId}`);
    
    const chip = chipMaturationModule.pool.findChipById(chipId);
    
    if (!chip) {
      return res.status(404).json({
        success: false,
        error: 'Chip não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    // Obter progresso da estratégia
    const strategyManager = new chipMaturationModule.MaturationStrategyManager();
    const progress = strategyManager.getProgress(chip.strategy, chip.currentDay);
    const nextActions = strategyManager.getNextActions(chip.strategy, chip.currentDay);

    res.json({
      success: true,
      chip: {
        ...chip,
        progress,
        nextActions,
        estimatedReadyDate: new Date(chip.startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao buscar chip:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/chip-maturation/chips/:chipId/strategy
 * Alterar estratégia de maturação de um chip
 */
router.put('/chips/:chipId/strategy', async (req, res) => {
  try {
    const { chipId } = req.params;
    const { strategy } = req.body;
    
    if (!strategy) {
      return res.status(400).json({
        success: false,
        error: 'Nova estratégia é obrigatória',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`🔄 Alterando estratégia do chip ${chipId} para ${strategy}`);
    
    const chip = chipMaturationModule.pool.findChipById(chipId);
    
    if (!chip) {
      return res.status(404).json({
        success: false,
        error: 'Chip não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    // Validar estratégia
    const strategyManager = new chipMaturationModule.MaturationStrategyManager();
    if (!strategyManager.getStrategy(strategy)) {
      return res.status(400).json({
        success: false,
        error: 'Estratégia inválida',
        availableStrategies: strategyManager.listStrategies(),
        timestamp: new Date().toISOString()
      });
    }

    // Alterar estratégia
    chip.strategy = strategy;
    chip.history.push({
      action: 'strategy_changed',
      oldStrategy: chip.strategy,
      newStrategy: strategy,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Estratégia alterada com sucesso',
      chip: {
        id: chip.id,
        instanceName: chip.instanceName,
        strategy: chip.strategy,
        currentDay: chip.currentDay
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao alterar estratégia:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chip-maturation/chips/:chipId/production
 * Mover chip para produção
 */
router.post('/chips/:chipId/production', async (req, res) => {
  try {
    const { chipId } = req.params;
    const { targetClient } = req.body;
    
    logger.info(`🚀 Movendo chip ${chipId} para produção`);
    
    const result = await chipMaturationModule.pool.moveToProduction(chipId, targetClient);
    
    res.json({
      success: true,
      message: 'Chip movido para produção com sucesso',
      chip: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao mover chip para produção:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== GESTÃO DE POOLS ==========

/**
 * GET /api/chip-maturation/pools/oracle
 * Estatísticas do pool Oracle
 */
router.get('/pools/oracle', async (req, res) => {
  try {
    logger.info('📊 Solicitando estatísticas do pool Oracle');
    
    const stats = await chipMaturationModule.pool.getOraclePoolStats();
    
    res.json({
      success: true,
      pool: 'oracle',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao obter stats do pool Oracle:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/pools/clients
 * Estatísticas dos pools de clientes
 */
router.get('/pools/clients', async (req, res) => {
  try {
    logger.info('📊 Solicitando estatísticas dos pools de clientes');
    
    const stats = await chipMaturationModule.pool.getClientPoolsStats();
    
    res.json({
      success: true,
      pools: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao obter stats dos pools:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/pools/production-ready
 * Chips prontos para produção
 */
router.get('/pools/production-ready', async (req, res) => {
  try {
    const { pool } = req.query;
    
    logger.info('🎯 Buscando chips prontos para produção');
    
    const readyChips = await chipMaturationModule.pool.getProductionReadyChips(pool);
    
    res.json({
      success: true,
      count: readyChips.length,
      chips: readyChips.map(chip => ({
        id: chip.id,
        instanceName: chip.instanceName,
        owner: chip.owner,
        strategy: chip.strategy,
        currentDay: chip.currentDay,
        metrics: chip.metrics,
        readySince: chip.readyForProduction
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao buscar chips prontos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== CONVERSAS E GRUPOS ==========

/**
 * GET /api/chip-maturation/conversations/stats
 * Estatísticas de conversas
 */
router.get('/conversations/stats', async (req, res) => {
  try {
    logger.info('💬 Solicitando estatísticas de conversas');
    
    const stats = await chipMaturationModule.conversationManager.getTodayStats();
    
    res.json({
      success: true,
      conversations: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao obter stats de conversas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chip-maturation/conversations/schedule
 * Agendar conversa entre chips
 */
router.post('/conversations/schedule', async (req, res) => {
  try {
    const { from, to, messageCount, conversationType, startDelay } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Campos "from" e "to" são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`💬 Agendando conversa: ${from} <-> ${to}`);
    
    const conversation = await chipMaturationModule.conversationManager.scheduleConversation({
      from,
      to,
      messageCount: messageCount || 10,
      conversationType: conversationType || 'casual_chat',
      startDelay: startDelay || 0
    });

    res.status(201).json({
      success: true,
      message: 'Conversa agendada com sucesso',
      conversation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao agendar conversa:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/groups/stats
 * Estatísticas de grupos
 */
router.get('/groups/stats', async (req, res) => {
  try {
    logger.info('👥 Solicitando estatísticas de grupos');
    
    const stats = await chipMaturationModule.groupManager.getActivityStats();
    
    res.json({
      success: true,
      groups: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao obter stats de grupos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chip-maturation/groups/join
 * Agendar entrada em grupo
 */
router.post('/groups/join', async (req, res) => {
  try {
    const { instanceName, groupUrl, category, delay } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`👥 Agendando entrada em grupo: ${instanceName}`);
    
    const joinRequest = await chipMaturationModule.groupManager.scheduleJoinGroup({
      instanceName,
      groupUrl,
      category,
      delay: delay || 0
    });

    if (!joinRequest) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível agendar entrada (limite atingido ou grupo indisponível)',
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Entrada em grupo agendada com sucesso',
      joinRequest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao agendar entrada em grupo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== ESTRATÉGIAS ==========

/**
 * GET /api/chip-maturation/strategies
 * Listar estratégias disponíveis
 */
router.get('/strategies', (req, res) => {
  try {
    const strategyManager = new chipMaturationModule.MaturationStrategyManager();
    const strategies = strategyManager.listStrategies();
    
    res.json({
      success: true,
      strategies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao listar estratégias:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chip-maturation/strategies/recommend
 * Recomendar estratégia
 */
router.post('/strategies/recommend', (req, res) => {
  try {
    const params = req.body;
    
    const strategyManager = new chipMaturationModule.MaturationStrategyManager();
    const recommended = strategyManager.recommendStrategy(params);
    
    res.json({
      success: true,
      recommended,
      strategy: strategyManager.getStrategy(recommended),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro ao recomendar estratégia:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== SISTEMA ==========

/**
 * POST /api/chip-maturation/system/initialize
 * Inicializar sistema de maturação
 */
router.post('/system/initialize', async (req, res) => {
  try {
    logger.info('🚀 Inicializando sistema de maturação via API');
    
    if (chipMaturationModule.initialized) {
      return res.status(200).json({
        success: true,
        message: 'Sistema já inicializado',
        timestamp: new Date().toISOString()
      });
    }

    await chipMaturationModule.initialize();
    
    res.json({
      success: true,
      message: 'Sistema de maturação inicializado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao inicializar sistema:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/chip-maturation/system/health
 * Health check do sistema
 */
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: chipMaturationModule.initialized ? 'healthy' : 'initializing',
      initialized: chipMaturationModule.initialized,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;