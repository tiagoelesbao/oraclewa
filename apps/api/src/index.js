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
import { initializeWhatsAppInstances } from './services/whatsapp/evolution-manager.js';
import { handleOrderExpired, handleOrderPaid } from './controllers/webhookController.js';
import { validateWebhookData } from './middlewares/validation.js';
import { broadcastModule } from './modules/broadcast/index.js';
import clientConfigLoader from './config/client-loader.js';

// Carregar configuração do ambiente
dotenv.config();

// Carregar configuração específica do cliente
const clientConfig = clientConfigLoader.loadClientConfig();

// Logs de inicialização
logger.info('🚀 Starting OracleWA Multi-Tenant System');
logger.info(`📋 Client: ${clientConfig.client?.id || 'default'} (${clientConfig.client?.name || 'Default'})`);
logger.info(`🔧 Service Type: ${clientConfig.client?.serviceType || 'all'}`);

if (clientConfig.broadcast?.isolated) {
  logger.info('🔒 Broadcast service is ISOLATED from recovery');
}

if (clientConfig.broadcast?.antiban?.enabled) {
  logger.info(`🛡️  Anti-ban strategy: ${clientConfig.broadcast.antiban.strategy}`);
}

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

// FALLBACK DIRECT: Handle webhooks that come without /api prefix
app.post('/webhook/temp-order-expired', 
  validateWebhookData('order_expired'),
  async (req, res) => {
    try {
      logger.warn('⚠️ ORDER_EXPIRED webhook received without /api prefix - handling directly');
      logger.info('Direct fallback request:', {
        path: req.path,
        headers: req.headers,
        body: req.body
      });
      
      // Call the controller directly
      await handleOrderExpired(req, res);
    } catch (error) {
      logger.error('Error in fallback order_expired handler:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
);

app.post('/webhook/temp-order-paid',
  validateWebhookData('order_paid'), 
  async (req, res) => {
    try {
      logger.warn('⚠️ ORDER_PAID webhook received without /api prefix - handling directly');
      logger.info('Direct fallback request:', {
        path: req.path,
        headers: req.headers,
        body: req.body
      });
      
      // Call the controller directly
      await handleOrderPaid(req, res);
    } catch (error) {
      logger.error('Error in fallback order_paid handler:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    if (process.env.SKIP_DB !== 'true') {
      await connectDatabase();
      logger.info('Database connected successfully');
    } else {
      logger.info('Skipping database connection (SKIP_DB=true)');
    }

    if (process.env.SKIP_DB !== 'true') {
      await initializeRedis();
      logger.info('Redis connected successfully');
      
      await initializeQueues();
      logger.info('Message queues initialized');
    } else {
      logger.info('Skipping Redis connection (SKIP_DB=true)');
      logger.info('Skipping message queues (SKIP_DB=true)');
    }

    await initializeWhatsAppInstances();
    logger.info('WhatsApp instances initialized');

    // Initialize broadcast module (non-blocking)
    if (broadcastModule.isEnabled()) {
      try {
        const broadcastInitialized = await broadcastModule.initialize();
        if (broadcastInitialized) {
          logger.info('🚀 Broadcast module initialized successfully');
        } else {
          logger.warn('⚠️ Broadcast module failed to initialize');
        }
      } catch (error) {
        logger.error('❌ Broadcast module initialization error:', error);
      }
    } else {
      logger.info('ℹ️ Broadcast module is disabled');
    }

    server.listen(PORT, () => {
      logger.info(`OracleWA server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Core Module: ✅ Active`);
      logger.info(`Broadcast Module: ${broadcastModule.isEnabled() ? '✅ Enabled' : '❌ Disabled'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
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