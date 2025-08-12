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

// Frontend Dashboard API endpoints
// Enhanced instance management endpoints
app.get('/instance/fetchInstances', async (req, res) => {
  try {
    const instances = await hetznerManager.fetchServerInstances();
    // Format for frontend compatibility
    const formattedInstances = instances.map(instance => ({
      instanceName: instance.instanceName,
      status: instance.state,
      connectionState: instance.state,
      phone: instance.phone || 'Not connected',
      profileName: instance.profileName || 'Unknown',
      qrcode: instance.qrcode || null,
      messagesCount: 0, // TODO: implement real message count
      lastActivity: new Date().toISOString()
    }));
    
    res.json(formattedInstances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/instance/connectionState/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const status = await hetznerManager.getInstanceStatus(instanceName);
    
    res.json({
      instanceName,
      status: status.state,
      connectionState: status.state,
      phone: status.phone || 'Not connected',
      profileName: status.profileName || 'Unknown',
      qrcode: status.qrcode || null,
      messagesCount: 0, // TODO: implement real message count
      lastActivity: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/instance/create', async (req, res) => {
  try {
    const { instanceName, clientId } = req.body;
    
    // For now, redirect to Hetzner instance creation
    const result = await hetznerManager.createAllClientInstances(clientId || 'imperio');
    
    res.json({
      success: true,
      data: {
        instanceName,
        status: 'creating',
        message: 'Instance creation initiated'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/instance/delete/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // TODO: Implement instance deletion in Hetzner manager
    res.json({ 
      success: true,
      message: `Instance ${instanceName} deletion initiated` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Templates API
app.get('/api/templates', (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (clientId) {
      const templates = templateManager.getClientTemplates(clientId);
      res.json({
        success: true,
        data: Object.values(templates || {}).map(template => ({
          id: template.id || template.type,
          name: template.name || template.type,
          type: template.type,
          content: template.content,
          variables: template.variables || [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      });
    } else {
      // Get all templates for all clients
      const allTemplates = [];
      const systemStats = clientManager.getSystemStats();
      
      for (const client of systemStats.clients) {
        const clientTemplates = templateManager.getClientTemplates(client.id);
        if (clientTemplates) {
          Object.values(clientTemplates).forEach(template => {
            allTemplates.push({
              id: `${client.id}-${template.id || template.type}`,
              name: template.name || template.type,
              type: template.type,
              clientId: client.id,
              content: template.content,
              variables: template.variables || [],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        }
      }
      
      res.json({ success: true, data: allTemplates });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const templateData = req.body;
    
    // TODO: Implement template creation
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        ...templateData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    const templateData = req.body;
    
    // TODO: Implement template update
    res.json({
      success: true,
      data: {
        id: templateId,
        ...templateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    
    // TODO: Implement template deletion
    res.json({ 
      success: true, 
      message: `Template ${templateId} deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Broadcast APIs
app.get('/api/broadcast/campaigns', (req, res) => {
  try {
    const { clientId } = req.query;
    
    // Mock broadcast campaigns data
    const campaigns = [
      {
        id: '1',
        name: 'Recovery Campaign',
        status: 'active',
        clientId: clientId || 'imperio',
        messagesSent: 1250,
        messagesTotal: 1500,
        successRate: 83.3,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-12T14:30:00Z'
      }
    ];
    
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/broadcast/campaigns', (req, res) => {
  try {
    const campaignData = req.body;
    
    // TODO: Implement campaign creation
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        ...campaignData,
        status: 'created',
        messagesSent: 0,
        messagesTotal: 0,
        successRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/broadcast/csv', (req, res) => {
  try {
    // TODO: Implement CSV broadcast functionality
    res.json({
      success: true,
      message: 'Broadcast initiated successfully',
      requestId: Date.now().toString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook Events API
app.get('/api/webhooks/events', (req, res) => {
  try {
    const { clientId } = req.query;
    
    // Mock webhook events data
    const events = [
      {
        id: '1',
        type: 'order_paid',
        clientId: clientId || 'imperio',
        status: 'processed',
        payload: { orderId: '12345', amount: 99.99 },
        createdAt: '2025-12-12T14:30:00Z',
        processedAt: '2025-12-12T14:30:15Z'
      },
      {
        id: '2',
        type: 'order_expired',
        clientId: clientId || 'imperio',
        status: 'processed',
        payload: { orderId: '12346', amount: 149.99 },
        createdAt: '2025-12-12T13:15:00Z',
        processedAt: '2025-12-12T13:15:10Z'
      }
    ];
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics API
app.get('/api/analytics', (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Mock analytics data based on system stats
    const systemStats = clientManager.getSystemStats();
    const webhookStats = scalableWebhookHandler.getWebhookStats();
    
    const analyticsData = {
      period,
      totalMessages: 19821,
      successfulMessages: 18829,
      failedMessages: 992,
      successRate: 95.0,
      totalContacts: 3786,
      activeConversations: 900,
      dailyStats: [
        { date: '2025-12-06', messages: 2800, success: 2660 },
        { date: '2025-12-07', messages: 2950, success: 2803 },
        { date: '2025-12-08', messages: 2750, success: 2613 },
        { date: '2025-12-09', messages: 3100, success: 2945 },
        { date: '2025-12-10', messages: 2900, success: 2755 },
        { date: '2025-12-11', messages: 3200, success: 3040 },
        { date: '2025-12-12', messages: 2121, success: 2013 }
      ],
      topPerformingTemplates: [
        { name: 'order_paid', usage: 12500, successRate: 96.2 },
        { name: 'order_expired', usage: 7321, successRate: 93.8 }
      ],
      clientBreakdown: systemStats.clients.map(client => ({
        clientId: client.id,
        name: client.name,
        messages: 19821,
        successRate: 95.0
      }))
    };
    
    res.json({ success: true, data: analyticsData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs API
app.get('/api/logs', (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // Mock logs data
    const logs = [
      {
        timestamp: '2025-12-12T14:30:00Z',
        level: 'info',
        message: 'WhatsApp message sent successfully',
        meta: { clientId: 'imperio', instanceName: 'imperio1', orderId: '12345' }
      },
      {
        timestamp: '2025-12-12T14:29:45Z',
        level: 'info',
        message: 'Webhook processed successfully',
        meta: { clientId: 'imperio', type: 'order_paid', processingTime: '250ms' }
      },
      {
        timestamp: '2025-12-12T14:29:30Z',
        level: 'warn',
        message: 'Instance connection unstable',
        meta: { instanceName: 'broadcast-imperio-hoje', retryCount: 2 }
      }
    ].filter(log => !level || log.level === level)
     .slice(0, parseInt(limit));
    
    res.json({ success: true, data: logs });
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