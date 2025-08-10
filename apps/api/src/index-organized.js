import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import logger from './utils/logger.js';
import SimpleWhatsAppManager from './services/whatsapp/simple-manager.js';
import ImperioWebhookHandler from '../../../clients/imperio/webhooks/webhook-handler.js';

// Carregar configuração do ambiente
dotenv.config();

// Logs de inicialização
logger.info('🚀 Starting OracleWA SaaS v3.0 - ORGANIZED');
logger.info(`📁 Multi-tenant structure with clean separation`);
logger.info(`🛡️ Anti-ban protection: 90s+ delays + typing simulation`);
logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`🔧 Port: ${process.env.APP_PORT || 3000}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Initialize managers
const whatsappManager = new SimpleWhatsAppManager();
const imperioHandler = new ImperioWebhookHandler(whatsappManager);

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

// Health check with anti-ban stats
app.get('/health', (req, res) => {
  try {
    const antibanStats = whatsappManager.getStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '3.0.0-organized',
      mode: 'multi-tenant-structure',
      antiban: antibanStats,
      clients: {
        imperio: {
          status: 'active',
          webhooks: ['order_paid', 'order_expired'],
          templates: 2,
          features: ['anti-ban', 'typing-simulation', 'organized-structure']
        }
      },
      features: {
        multiTenant: true,
        antibanDelays: true,
        typingSimulation: true,
        organizedStructure: true,
        cleanSeparation: true
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

// Multi-tenant webhook endpoints for Imperio
app.post('/api/webhook/temp-order-paid', async (req, res) => {
  try {
    const result = await imperioHandler.processWebhook('order_paid', req.body);
    res.json(result);
  } catch (error) {
    logger.error('❌ Webhook error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhook/temp-order-expired', async (req, res) => {
  try {
    const result = await imperioHandler.processWebhook('order_expired', req.body);
    res.json(result);
  } catch (error) {
    logger.error('❌ Webhook error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multi-tenant webhook router - for future clients
app.post('/webhook/:clientId/:type', async (req, res) => {
  try {
    const { clientId, type } = req.params;
    
    // Route to appropriate client handler
    let result;
    switch (clientId) {
      case 'imperio':
        result = await imperioHandler.processWebhook(type, req.body);
        break;
      default:
        throw new Error(`Client '${clientId}' not found`);
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`❌ Multi-tenant webhook error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy redirects for backward compatibility
app.post('/temp-order-paid', (req, res) => {
  req.url = '/api/webhook/temp-order-paid';
  app.handle(req, res);
});

app.post('/temp-order-expired', (req, res) => {
  req.url = '/api/webhook/temp-order-expired';
  app.handle(req, res);
});

// Dashboard/Management endpoint
app.get('/api/management/dashboard', (req, res) => {
  const antibanStats = whatsappManager.getStats();
  
  res.json({
    system: 'OracleWA SaaS v3.0 - Organized Multi-Tenant',
    status: 'running',
    timestamp: new Date().toISOString(),
    clients: {
      total: 1,
      active: 1,
      imperio: {
        status: 'active',
        webhooks: 'receiving',
        whatsapp: 'connected-with-antiban',
        lastActivity: antibanStats.lastMessageTime
      }
    },
    antiban: antibanStats,
    structure: {
      organized: true,
      separation: 'client-based',
      templates: '/clients/{client}/templates/',
      webhooks: '/clients/{client}/webhooks/',
      services: '/apps/api/src/services/'
    }
  });
});

// Error handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET /health',
      'GET /api/management/dashboard', 
      'POST /api/webhook/temp-order-paid',
      'POST /api/webhook/temp-order-expired',
      'POST /webhook/:clientId/:type'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info('🎉 OracleWA SaaS v3.0 ORGANIZED started successfully!');
  logger.info(`🌐 Server: http://localhost:${PORT}`);
  logger.info(`📁 Structure: Multi-tenant with clean separation`);
  logger.info(`🛡️ Anti-ban: Active with 90s+ delays`);
  logger.info(`👥 Clients: Império (active)`);
  logger.info('🚀 System ready for production!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});