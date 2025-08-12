import { Router } from 'express';
import logger from '../utils/logger.js';
import { getRedisClient } from '../services/redis/client.js';

const router = Router();

// Status diário simples para monitoramento
router.get('/daily', async (req, res) => {
  try {
    const redis = process.env.SKIP_DB !== 'true' ? getRedisClient() : null;
    
    if (!redis) {
      return res.json({
        status: 'running',
        message: 'Sistema operacional (sem Redis para contadores)',
        timestamp: new Date().toISOString(),
        mode: 'ultra_conservative'
      });
    }

    const instanceName = 'imperio1';
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.toISOString().slice(0, 13);
    
    // Buscar contadores
    const dailyKey = `daily_count:${instanceName}:${today}`;
    const hourlyKey = `hourly_count:${instanceName}:${currentHour}`;
    
    const dailyCount = parseInt(await redis.get(dailyKey) || '0');
    const hourlyCount = parseInt(await redis.get(hourlyKey) || '0');
    
    // Calcular limites e status
    const dailyLimit = 600;
    const hourlyLimit = 25;
    const dailyRemaining = Math.max(0, dailyLimit - dailyCount);
    const hourlyRemaining = Math.max(0, hourlyLimit - hourlyCount);
    
    // Status de saúde
    const isHealthy = dailyCount < dailyLimit * 0.9 && hourlyCount < hourlyLimit * 0.8;
    const needsAttention = dailyCount > dailyLimit * 0.8 || hourlyCount > hourlyLimit * 0.8;
    
    res.json({
      status: isHealthy ? 'healthy' : needsAttention ? 'attention' : 'critical',
      timestamp: new Date().toISOString(),
      mode: 'ultra_conservative',
      limits: {
        daily: { sent: dailyCount, limit: dailyLimit, remaining: dailyRemaining },
        hourly: { sent: hourlyCount, limit: hourlyLimit, remaining: hourlyRemaining }
      },
      nextWindow: {
        hourReset: `${String(now.getHours() + 1).padStart(2, '0')}:00`,
        dayReset: 'Meia-noite'
      },
      settings: {
        delayBetweenMessages: '60-120 segundos',
        maxHourly: '25 mensagens',
        maxDaily: '600 mensagens',
        businessHours: '9h-21h'
      }
    });
    
  } catch (error) {
    logger.error('Error fetching daily status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar status',
      timestamp: new Date().toISOString()
    });
  }
});

// Status resumido para URL rápida
router.get('/quick', async (req, res) => {
  try {
    const redis = process.env.SKIP_DB !== 'true' ? getRedisClient() : null;
    
    if (!redis) {
      return res.json({ status: '✅ Online', messages: 'N/A', mode: 'Ultra Conservador' });
    }

    const instanceName = 'imperio1';
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily_count:${instanceName}:${today}`;
    const dailyCount = parseInt(await redis.get(dailyKey) || '0');
    
    res.json({
      status: dailyCount < 500 ? '✅ Saudável' : dailyCount < 580 ? '⚠️ Atenção' : '🚨 Crítico',
      messages: `${dailyCount}/600 hoje`,
      mode: 'Ultra Conservador',
      delay: '1-2 min'
    });
    
  } catch (error) {
    res.json({ status: '❌ Erro', messages: 'N/A', mode: 'Ultra Conservador' });
  }
});

// Nova rota para executar testes do sistema
router.get('/test', async (req, res) => {
  try {
    logger.info('🧪 Executando testes do sistema via API...');
    
    // Importar e executar testes
    const { runSystemTests } = await import('../api/test/system-test.js');
    const testResults = await runSystemTests();
    
    res.json({
      status: 'tests_completed',
      timestamp: new Date().toISOString(),
      results: testResults
    });
  } catch (error) {
    logger.error('Error running system tests:', error);
    res.status(500).json({ 
      error: 'Failed to run tests',
      details: error.message 
    });
  }
});

export default router;