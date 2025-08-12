import { Router } from 'express';
import webhookRoutes from './webhook.routes.js';
import messageRoutes from './message.routes.js';
import instanceRoutes from './instance.routes.js';
import authRoutes from './auth.routes.js';
import statusRoutes from './status.routes.js';
import managementRoutes from './management.routes.js';
import broadcastRoutes from '../modules/broadcast/routes/broadcast.routes.js';
import webhookHandler from '../modules/webhooks/webhook-handler.js';

const router = Router();

router.use('/webhook', webhookRoutes);
router.use('/messages', messageRoutes);
router.use('/instances', instanceRoutes);
router.use('/auth', authRoutes);
router.use('/status', statusRoutes);
router.use('/management', managementRoutes);
router.use('/broadcast', broadcastRoutes);

// ========================================
// ROTAS MULTI-TENANT WEBHOOKS 
// ========================================
// Formato: /api/webhook/{clientId}/{eventType}
// Exemplo: /api/webhook/imperio/order_expired

router.post('/webhook/:clientId/:eventType', async (req, res) => {
  try {
    const { clientId, eventType } = req.params;
    const payload = req.body;
    
    // Log de entrada
    console.log(`\n🔔 WEBHOOK RECEIVED [${clientId.toUpperCase()}]`);
    console.log(`📋 Event Type: ${eventType}`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
    
    // Processar webhook
    const result = await webhookHandler.processWebhook(clientId, eventType, payload);
    
    // Log de sucesso
    console.log(`✅ WEBHOOK PROCESSED [${clientId.toUpperCase()}]:`, result);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ WEBHOOK ERROR [${req.params.clientId?.toUpperCase() || 'UNKNOWN'}]:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/', (req, res) => {
  res.json({
    name: 'OracleWA SaaS',
    version: '3.0.0',
    description: 'Multi-tenant WhatsApp system with intelligent provider selection',
    features: {
      multiTenant: true,
      providerSelection: true,
      evolutionBaileys: 'FREE',
      zapi: 'R$99/instance',
      antibanStrategies: true,
      costOptimization: true
    },
    endpoints: {
      webhook: '/api/webhook/:clientId/:type',
      management: '/api/management/*',
      broadcast: '/api/broadcast/*',
      health: '/health'
    },
    status: 'active'
  });
});

export default router;