/**
 * Monitoring Routes
 * Endpoints para monitoramento e controle do sistema
 */

import express from 'express';
import logger from '../utils/logger.js';
import webhookPoolManager from '../services/whatsapp/webhook-pool-manager.js';
import autoReconnectService from '../services/whatsapp/auto-reconnect.js';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/monitoring/status
 * Status geral do sistema
 */
router.get('/status', async (req, res) => {
  try {
    const poolStats = webhookPoolManager.getAllPoolStats();
    const reconnectStatus = autoReconnectService.getReconnectStatus();
    
    // Verificar status de cada instância
    const instances = ['imperio-webhook-1', 'imperio-webhook-2', 'imperio-webhook-4'];
    const instancesHealth = [];
    
    for (const instanceName of instances) {
      const health = await webhookPoolManager.checkInstanceHealth(instanceName);
      instancesHealth.push({
        name: instanceName,
        ...health
      });
    }
    
    // Calcular métricas
    const totalInstances = instancesHealth.length;
    const healthyInstances = instancesHealth.filter(i => i.status === 'healthy').length;
    const unhealthyInstances = instancesHealth.filter(i => i.status === 'unhealthy').length;
    const healthPercentage = (healthyInstances / totalInstances) * 100;
    
    // Determinar status geral
    let systemStatus = 'operational';
    let statusMessage = 'All systems operational';
    
    if (healthPercentage === 0) {
      systemStatus = 'critical';
      statusMessage = 'CRITICAL: All WhatsApp instances are offline';
    } else if (healthPercentage < 50) {
      systemStatus = 'degraded';
      statusMessage = `WARNING: Only ${healthyInstances}/${totalInstances} instances operational`;
    } else if (healthPercentage < 100) {
      systemStatus = 'partial';
      statusMessage = `NOTICE: ${unhealthyInstances} instance(s) offline`;
    }
    
    res.json({
      success: true,
      system: {
        status: systemStatus,
        message: statusMessage,
        timestamp: new Date().toISOString()
      },
      metrics: {
        total: totalInstances,
        healthy: healthyInstances,
        unhealthy: unhealthyInstances,
        healthPercentage: Math.round(healthPercentage)
      },
      instances: instancesHealth,
      pools: poolStats,
      autoReconnect: reconnectStatus
    });
  } catch (error) {
    logger.error('❌ Monitoring status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/reconnect/:instanceName
 * Força reconexão de uma instância específica
 */
router.post('/reconnect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    logger.info(`🔄 Manual reconnect requested for ${instanceName}`);
    
    await autoReconnectService.attemptReconnect(instanceName);
    
    // Aguardar um pouco e verificar status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const health = await webhookPoolManager.checkInstanceHealth(instanceName);
    
    res.json({
      success: true,
      instanceName,
      status: health.status,
      state: health.state,
      message: health.status === 'healthy' ? 
        'Instance reconnected successfully' : 
        'Reconnection attempt initiated, check status for updates'
    });
  } catch (error) {
    logger.error(`❌ Reconnect error for ${req.params.instanceName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/reconnect-all
 * Força reconexão de todas as instâncias
 */
router.post('/reconnect-all', async (req, res) => {
  try {
    logger.info('🔄 Manual reconnect-all requested');
    
    const results = await autoReconnectService.forceReconnectAll();
    
    res.json({
      success: true,
      message: 'Reconnection attempted for all instances',
      results
    });
  } catch (error) {
    logger.error('❌ Reconnect-all error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Obtém alertas críticos ativos
 */
router.get('/alerts', (req, res) => {
  try {
    const reconnectStatus = autoReconnectService.getReconnectStatus();
    const alerts = [];
    
    // Verificar instâncias com falhas críticas
    for (const instance of reconnectStatus.instances) {
      if (instance.critical) {
        alerts.push({
          type: 'critical',
          category: 'instance_failure',
          instanceName: instance.instanceName,
          message: `Instance ${instance.instanceName} failed to reconnect after ${instance.maxAttempts} attempts`,
          timestamp: new Date().toISOString(),
          actionRequired: 'Manual intervention needed - check WhatsApp connection'
        });
      }
    }
    
    res.json({
      success: true,
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      alerts
    });
  } catch (error) {
    logger.error('❌ Alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/auto-reconnect/:action
 * Controla o serviço de reconexão automática
 */
router.post('/auto-reconnect/:action', (req, res) => {
  try {
    const { action } = req.params;
    
    if (action === 'start') {
      autoReconnectService.startMonitoring(webhookPoolManager);
      res.json({
        success: true,
        message: 'Auto-reconnect service started'
      });
    } else if (action === 'stop') {
      autoReconnectService.stopMonitoring();
      res.json({
        success: true,
        message: 'Auto-reconnect service stopped'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "start" or "stop"'
      });
    }
  } catch (error) {
    logger.error(`❌ Auto-reconnect ${req.params.action} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/health-check/:instanceName
 * Verifica saúde de uma instância específica
 */
router.get('/health-check/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    const health = await webhookPoolManager.checkInstanceHealth(instanceName);
    
    res.json({
      success: true,
      instanceName,
      ...health
    });
  } catch (error) {
    logger.error(`❌ Health check error for ${req.params.instanceName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;