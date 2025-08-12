import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import logger from './utils/logger.js';

// Core Managers - Sistema Escalável
import clientManager from './core/client-manager.js';
import templateManager from './core/template-manager.js';
import scalableWebhookHandler from './core/webhook-handler.js';
import hetznerManager from './core/hetzner-manager.js';

// Chip Maturation Module
import chipMaturationModule from './modules/chip-maturation/index.js';
import chipMaturationRoutes from './modules/chip-maturation/api/chip-maturation-routes.js';

// Carregar configuração do ambiente
dotenv.config();

// Logs de inicialização
logger.info('🚀 Starting OracleWA SaaS v3.0 - SCALABLE ARCHITECTURE');
logger.info('🏗️ Multi-tenant system with true client separation');
logger.info('🛡️ Anti-ban protection: 90s+ delays + typing simulation');
logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`🔧 Port: ${process.env.APP_PORT || 3000}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 50)
  });
  next();
});

// Health check com estatísticas completas
app.get('/health', (req, res) => {
  try {
    const systemStats = clientManager.getSystemStats();
    const templateStats = templateManager.getTemplateStats();
    const webhookStats = scalableWebhookHandler.getWebhookStats();
    const hetznerStats = hetznerManager.getInstanceStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '3.0.0-scalable',
      architecture: 'multi-tenant-scalable',
      system: systemStats,
      templates: templateStats,
      webhooks: webhookStats,
      hetzner: hetznerStats,
      features: {
        trueMultiTenant: true,
        clientSeparation: true,
        dynamicTemplates: true,
        scalableWebhooks: true,
        antibanDelays: true,
        typingSimulation: true,
        autoClientDiscovery: true,
        hetznerIntegration: true,
        chipMaturationModule: chipMaturationModule.initialized
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Chip Maturation API Routes
app.use('/api/chip-maturation', chipMaturationRoutes);

// Webhook escalável - Rota principal para todos os clientes
app.post('/webhook/:clientId/:type', async (req, res) => {
  try {
    const { clientId, type } = req.params;
    const result = await scalableWebhookHandler.processWebhook(clientId, type, req.body);
    res.json(result);
  } catch (error) {
    logger.error(`❌ Webhook error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoints específicos para Império (backward compatibility)
app.post('/api/webhook/temp-order-paid', async (req, res) => {
  try {
    // Resposta imediata para evitar timeout 499
    const requestId = Date.now().toString();
    res.json({ 
      success: true, 
      message: 'Webhook received and queued for processing',
      requestId,
      timestamp: new Date().toISOString()
    });

    // Processar assincronamente (não await)
    scalableWebhookHandler.processWebhook('imperio', 'order_paid', req.body)
      .then(result => {
        logger.info(`✅ Async webhook processed: ${requestId}`, result);
      })
      .catch(error => {
        logger.error(`❌ Async webhook error: ${requestId}`, error.message);
      });

  } catch (error) {
    logger.error('❌ Webhook sync error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhook/temp-order-expired', async (req, res) => {
  try {
    // Resposta imediata para evitar timeout 499
    const requestId = Date.now().toString();
    res.json({ 
      success: true, 
      message: 'Webhook received and queued for processing',
      requestId,
      timestamp: new Date().toISOString()
    });

    // Processar assincronamente (não await)
    scalableWebhookHandler.processWebhook('imperio', 'order_expired', req.body)
      .then(result => {
        logger.info(`✅ Async webhook processed: ${requestId}`, result);
      })
      .catch(error => {
        logger.error(`❌ Async webhook error: ${requestId}`, error.message);
      });

  } catch (error) {
    logger.error('❌ Webhook sync error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Status de processamento webhook por requestId
app.get('/api/webhook/status/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  // Em produção, isso seria consultado de um banco/cache
  // Por enquanto, resposta genérica
  res.json({
    requestId,
    status: 'processed', // pending, processing, processed, failed
    message: 'Webhook processing completed',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint para testar payloads
app.post('/api/debug/webhook/:clientId/:type', async (req, res) => {
  try {
    const { clientId, type } = req.params;
    logger.info(`🧪 DEBUG: Testing payload for ${clientId}/${type}`);
    
    // Log do payload recebido
    console.log('📦 Raw Payload:', JSON.stringify(req.body, null, 2));
    
    // Simular processamento sem enviar WhatsApp
    const client = clientManager.getClient(clientId);
    const extractedData = scalableWebhookHandler.extractPayloadData ? 
      await scalableWebhookHandler.extractPayloadData(client, type, req.body) :
      req.body;
    
    console.log('🔍 Extracted Data:', extractedData);
    
    res.json({
      success: true,
      debug: true,
      clientId,
      type,
      rawPayload: req.body,
      extractedData,
      message: 'Debug completed - no WhatsApp sent'
    });
  } catch (error) {
    logger.error(`❌ Debug error:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      debug: true
    });
  }
});

// Legacy redirects
app.post('/temp-order-paid', (req, res) => {
  req.url = '/api/webhook/temp-order-paid';
  app.handle(req, res);
});

app.post('/temp-order-expired', (req, res) => {
  req.url = '/api/webhook/temp-order-expired';
  app.handle(req, res);
});

// API de gerenciamento escalável
app.get('/api/management/clients', (req, res) => {
  try {
    const clients = clientManager.getActiveClients();
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/management/clients/:clientId', (req, res) => {
  try {
    const client = clientManager.getClient(req.params.clientId);
    const templates = templateManager.getClientTemplates(req.params.clientId);
    const manager = scalableWebhookHandler.getClientManager(req.params.clientId);
    
    res.json({ 
      success: true, 
      client,
      templates,
      antiban: manager.getStats()
    });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Broadcast files por cliente
app.get('/api/management/clients/:clientId/broadcast/files', async (req, res) => {
  try {
    const files = await clientManager.getClientBroadcastFiles(req.params.clientId);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard escalável
app.get('/api/management/dashboard', (req, res) => {
  try {
    const systemStats = clientManager.getSystemStats();
    const templateStats = templateManager.getTemplateStats();
    const webhookStats = scalableWebhookHandler.getWebhookStats();
    
    res.json({
      system: 'OracleWA SaaS v3.0 - Scalable Multi-Tenant',
      status: 'running',
      timestamp: new Date().toISOString(),
      architecture: {
        type: 'multi-tenant-scalable',
        clientSeparation: true,
        dataIsolation: true,
        dynamicLoading: true
      },
      stats: {
        system: systemStats,
        templates: templateStats, 
        webhooks: webhookStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hetzner management endpoints
app.get('/api/management/hetzner/instances', async (req, res) => {
  try {
    const instances = await hetznerManager.fetchServerInstances();
    res.json({ success: true, instances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/management/hetzner/instances/:clientId/create', async (req, res) => {
  try {
    const { clientId } = req.params;
    const results = await hetznerManager.createAllClientInstances(clientId);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/management/hetzner/instances/:instanceName/qrcode', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const qrcode = await hetznerManager.getInstanceQRCode(instanceName);
    res.json({ success: true, qrcode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/management/hetzner/instances/:instanceName/status', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const status = await hetznerManager.getInstanceStatus(instanceName);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/management/hetzner/sync', async (req, res) => {
  try {
    const syncResult = await hetznerManager.syncInstances();
    res.json({ success: true, syncResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reload endpoints para desenvolvimento
app.post('/api/management/reload/clients', async (req, res) => {
  try {
    await clientManager.reloadAllClients();
    res.json({ success: true, message: 'All clients reloaded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/management/reload/templates', async (req, res) => {
  try {
    await templateManager.reloadAllTemplates();
    res.json({ success: true, message: 'All templates reloaded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET /health',
      'GET /api/management/dashboard',
      'GET /api/management/clients',
      'GET /api/management/clients/:clientId',
      'POST /webhook/:clientId/:type',
      'POST /api/webhook/temp-order-paid',
      'POST /api/webhook/temp-order-expired'
    ]
  });
});

// Inicialização escalável
async function initializeScalableSystem() {
  try {
    logger.info('🔧 Initializing Scalable Multi-Tenant System...');

    // 1. Initialize Client Manager
    await clientManager.initialize();

    // 2. Initialize Template Manager
    await templateManager.initialize();

    // 3. Initialize Scalable Webhook Handler
    await scalableWebhookHandler.initialize();

    // 4. Initialize Hetzner Manager (optional)
    try {
      await hetznerManager.initialize();
      logger.info('✅ Hetzner Manager initialized');
    } catch (error) {
      logger.warn('⚠️ Hetzner Manager failed to initialize (continuing without it):', error.message);
    }

    // 5. Initialize Chip Maturation Module
    try {
      await chipMaturationModule.initialize();
      logger.info('✅ Chip Maturation Module initialized');
    } catch (error) {
      logger.warn('⚠️ Chip Maturation Module failed to initialize (continuing without it):', error.message);
    }

    logger.info('✅ All core managers initialized successfully');

    // 4. Start server
    app.listen(PORT, '0.0.0.0', () => {
      const systemStats = clientManager.getSystemStats();
      const templateStats = templateManager.getTemplateStats();
      
      logger.info('🎉 OracleWA SaaS v3.0 SCALABLE started successfully!');
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`👥 Clients: ${systemStats.activeClients}/${systemStats.totalClients} active`);
      logger.info(`🎨 Templates: ${templateStats.totalTemplates} loaded`);
      logger.info(`🛡️ Anti-ban: Active with 90s+ delays per client`);
      logger.info(`🌱 Chip Maturation: ${chipMaturationModule.initialized ? 'Active' : 'Disabled'}`);
      logger.info('🏗️ Architecture: True Multi-Tenant with Client Separation');
      logger.info('🚀 System ready for unlimited scaling!');
    });

  } catch (error) {
    logger.error('❌ Failed to initialize scalable system:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar sistema escalável
initializeScalableSystem();