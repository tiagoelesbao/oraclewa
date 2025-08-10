import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import logger from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { connectDatabase } from './database/connection.js';
import { initializeRedis } from './services/redis/client.js';
import { initializeQueues } from './services/queue/manager.js';
import providerManager from './providers/manager/provider-manager.js';
import multiTenantConfig from './config/multi-tenant-config.js';
import webhookHandler from './modules/webhooks/webhook-handler.js';
import broadcastManager from './modules/broadcast/broadcast-manager.js';
import costCalculator from './services/billing/cost-calculator.js';

// Carregar configuração do ambiente
dotenv.config();

// Logs de inicialização
logger.info('🚀 Starting OracleWA SaaS v3.0');
logger.info(`🌐 Multi-Tenant System with Provider Selection`);
logger.info(`💰 Providers: Evolution+Baileys (FREE) | Z-API (R$99/instância)`);
logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`🔧 Port: ${process.env.APP_PORT || 3000}`);

const app = express();
const server = createServer(app);
const PORT = process.env.APP_PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.use('/api', routes);

// Multi-tenant webhook endpoint
app.post('/webhook/:clientId/:type', async (req, res) => {
  try {
    const { clientId, type } = req.params;
    
    logger.info(`📥 Webhook received: ${type} for client ${clientId}`);
    
    // Process webhook using new handler
    const result = await webhookHandler.processWebhook(clientId, type, req.body);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy fallback for Império client
app.post('/webhook/temp-order-expired', async (req, res) => {
  try {
    logger.warn('⚠️ Legacy webhook endpoint - redirecting to new system');
    const result = await webhookHandler.processWebhook('imperio', 'order_expired', req.body);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Legacy webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.post('/webhook/temp-order-paid', async (req, res) => {
  try {
    logger.warn('⚠️ Legacy webhook endpoint - redirecting to new system');
    const result = await webhookHandler.processWebhook('imperio', 'order_paid', req.body);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Legacy webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.get('/health', async (req, res) => {
  try {
    const healthChecks = await providerManager.healthCheckAll();
    const clientStats = multiTenantConfig.getSystemStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '3.0.0',
      providers: healthChecks,
      clients: clientStats,
      features: {
        multiTenant: true,
        providerSelection: true,
        costOptimization: true,
        evolutionBaileys: true,
        zapi: process.env.ZAPI_CLIENT_TOKEN ? true : false
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

app.use(errorHandler);

async function startServer() {
  try {
    logger.info('🔧 Initializing system components...');

    // 1. Initialize multi-tenant configuration
    await multiTenantConfig.initialize();
    logger.info('✅ Multi-tenant configuration loaded');

    // 2. Initialize provider manager
    const providerConfig = {
      evolutionBaileys: {
        baseUrl: process.env.EVOLUTION_API_URL,
        apiKey: process.env.EVOLUTION_API_KEY
      },
      zapi: process.env.ZAPI_CLIENT_TOKEN ? {
        clientToken: process.env.ZAPI_CLIENT_TOKEN,
        baseUrl: process.env.ZAPI_BASE_URL
      } : null,
      clientMappings: {
        'imperio': 'evolution-baileys' // Império usa Evolution Baileys por padrão
      }
    };

    await providerManager.initialize(providerConfig);
    logger.info('✅ Provider Manager initialized');

    // 3. Initialize webhook handler
    await webhookHandler.initialize();
    logger.info('✅ Webhook Handler initialized');

    // 4. Initialize broadcast manager
    await broadcastManager.initialize();
    logger.info('✅ Broadcast Manager initialized');

    // 5. Initialize database (optional)
    if (process.env.SKIP_DB !== 'true') {
      try {
        await connectDatabase();
        logger.info('✅ Database connected');
      } catch (error) {
        logger.warn('⚠️ Database connection failed, continuing without DB:', error.message);
      }
    }

    // 6. Initialize Redis (optional)
    if (process.env.SKIP_DB !== 'true') {
      try {
        await initializeRedis();
        logger.info('✅ Redis connected');
        
        await initializeQueues();
        logger.info('✅ Message queues initialized');
      } catch (error) {
        logger.warn('⚠️ Redis connection failed, continuing without queues:', error.message);
      }
    }

    // 7. Display system status
    const activeClients = multiTenantConfig.getActiveClients();
    const providerComparison = providerManager.getProviderComparison();
    
    server.listen(PORT, () => {
      logger.info('🎉 OracleWA SaaS v3.0 started successfully!');
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`👥 Active Clients: ${activeClients.length}`);
      logger.info(`🔌 Available Providers: ${Object.keys(providerComparison).length}`);
      
      // Log provider details
      Object.entries(providerComparison).forEach(([name, provider]) => {
        const cost = provider.costs.perInstance > 0 ? `R$${provider.costs.perInstance}/mês` : 'GRATUITO';
        const features = provider.capabilities.buttons ? 'com botões' : 'texto básico';
        logger.info(`  📦 ${provider.name}: ${cost} (${features})`);
      });
      
      logger.info('🚀 System ready for production!');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();