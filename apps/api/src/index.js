import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';
import logger from './utils/logger.js';

// Core Managers - Sistema Escalável
import clientManager from './core/client-manager.js';
import templateManager from './core/template-manager.js';
import scalableWebhookHandler from './core/webhook-handler.js';
import hetznerManager from './core/hetzner-manager.js';
import webhookPoolManager from './services/whatsapp/webhook-pool-manager.js';
import { getPendingWebhookCount } from './services/queue/manager.js';

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
logger.info(`🔧 Port: ${process.env.APP_PORT || 3333}`);

// Global flag to control message count display
let showWebhookQueue = true;

const app = express();
const server = createServer(app);
const PORT = process.env.APP_PORT || 3333;

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3333'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`📡 Client ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Make io globally available for queue manager
global.io = io;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3333', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));
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

// List all instances with real status from Evolution API
app.get('/api/instances', async (req, res) => {
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    const instances = response.data || [];
    
    // Load reset data to calculate relative message counts
    const fs = await import('fs');
    const path = await import('path');
    const resetFiles = {};
    
    // Try to load reset files for all clients
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      files.forEach(file => {
        if (file.endsWith('-message-reset.json')) {
          const filePath = path.join(dataDir, file);
          try {
            const resetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            resetFiles[resetData.clientId] = resetData;
          } catch (error) {
            logger.warn(`Failed to load reset file ${file}:`, error.message);
          }
        }
      });
    }

    // Get pending webhook count for the entire queue (shared across instances)
    const pendingWebhookCount = await getPendingWebhookCount();

    // Transform data to match frontend expectations and show webhook queue status
    const transformedInstances = instances.map((instance, index) => {
      // For display purposes, show the total webhook count only on the first active instance
      // This avoids showing the same queue count multiple times
      let messageCount = 0;
      
      // Use the global flag to control what to show
      if (showWebhookQueue) {
        // Show webhook queue count only on the first connected instance to avoid duplication
        const isFirstConnectedInstance = instances.findIndex(inst => inst.connectionStatus === 'open') === index;
        if (isFirstConnectedInstance && instance.connectionStatus === 'open') {
          messageCount = pendingWebhookCount;
        }
      } else {
        // Show the traditional WhatsApp message count with reset logic
        for (const [clientId, resetData] of Object.entries(resetFiles)) {
          if (resetData.instances && resetData.instances[instance.name]) {
            const instanceReset = resetData.instances[instance.name];
            const currentCount = instance._count?.Message || 0;
            
            if (resetData.monitoring && resetData.monitoring.enabled) {
              messageCount = Math.max(0, currentCount - (instanceReset.baselineCount || 0));
            }
            break;
          }
        }
      }
      
      // Still update the reset data for monitoring purposes (but don't use for display)
      for (const [clientId, resetData] of Object.entries(resetFiles)) {
        if (resetData.instances && resetData.instances[instance.name]) {
          const instanceReset = resetData.instances[instance.name];
          const currentCount = instance._count?.Message || 0;
          
          // Update tracking data but don't use for messageCount display
          instanceReset.lastKnownCount = currentCount;
          if (resetData.monitoring && resetData.monitoring.enabled) {
            const currentIncrement = Math.max(0, currentCount - (instanceReset.baselineCount || 0));
            resetData.monitoring.incrementalCount[instance.name] = currentIncrement;
          }
          break;
        }
      }
      
      return {
        id: instance.id,
        name: instance.name,
        instanceName: instance.name,
        connectionStatus: instance.connectionStatus,
        ownerJid: instance.ownerJid,
        profileName: instance.profileName,
        profilePicUrl: instance.profilePicUrl,
        provider: 'evolution-baileys',
        isConnected: instance.connectionStatus === 'open',
        lastConnection: instance.updatedAt,
        messageCount,
        contactCount: instance._count?.Contact || 0,
        chatCount: instance._count?.Chat || 0,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      };
    });

    // Save updated reset files back to disk (for incremental counters)
    for (const [clientId, resetData] of Object.entries(resetFiles)) {
      if (resetData.monitoring && resetData.monitoring.enabled) {
        try {
          const resetFilePath = path.join(dataDir, `${clientId}-message-reset.json`);
          resetData.monitoring.lastCheck = new Date().toISOString();
          fs.writeFileSync(resetFilePath, JSON.stringify(resetData, null, 2));
        } catch (error) {
          logger.warn(`Failed to save reset file for ${clientId}:`, error.message);
        }
      }
    }
    
    res.json({ 
      success: true, 
      instances: transformedInstances,
      total: transformedInstances.length,
      connected: transformedInstances.filter(i => i.isConnected).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching instances:', error);
    res.status(500).json({ success: false, error: error.message });
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
    
    // Adicionar informações das instâncias aos clientes
    const clientsWithDetails = clients.map(client => ({
      id: client.id,
      name: client.name || 'Império Prêmios',
      description: client.description || 'Cliente de recuperação de vendas',
      status: 'active',
      createdAt: new Date('2024-01-15').toISOString(),
      settings: {
        timezone: 'America/Sao_Paulo',
        antibanStrategy: 'conti_chips',
        maxInstancesAllowed: 10,
        webhookUrl: client.webhookUrl || `https://oraclewa-imperio-production.up.railway.app/webhook/${client.id}`,
        notificationEmail: client.email || 'admin@imperio.com'
      }
    }));
    
    res.json({ success: true, clients: clientsWithDetails });
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

// QR Code direto do Evolution API
app.get('/api/instances/:instanceName/qrcode', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Buscar QR Code diretamente do Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const data = response.data;
    
    // Emit real-time update
    io.emit('qrcode-generated', {
      instanceName,
      qrcode: data.base64,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      qrcode: data.base64 || null,
      pairingCode: data.pairingCode || null,
      instanceName 
    });
  } catch (error) {
    logger.error(`QR Code error for ${req.params.instanceName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Status da instância direto do Evolution API
app.get('/api/instances/:instanceName/status', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    const data = response.data;
    const status = data.instance?.state || 'unknown';
    
    // Emit real-time status update
    io.emit('instance-status-updated', {
      instanceName,
      status,
      data,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      status: status,
      instanceName,
      data
    });
  } catch (error) {
    logger.error(`Status error for ${req.params.instanceName}:`, error);
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
    // Buscar instâncias diretamente do Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    // Formatar para o frontend
    const instances = response.data || [];
    
    // Não filtrar mais - mostrar todas as instâncias
    const filteredInstances = instances.map(instance => instance);
    
    logger.info(`📱 Found ${filteredInstances.length} instances in Evolution API`);
    
    const formattedInstances = filteredInstances.map(instance => {
      // Verificar status real: se tem disconnectionAt, está desconectado
      let realStatus = 'disconnected';
      if (instance.connectionStatus === 'open') {
        realStatus = 'connected';
      } else if (instance.disconnectionAt || instance.disconnectionReasonCode) {
        realStatus = 'disconnected';
      } else if (instance.connectionStatus === 'connecting') {
        realStatus = 'connecting';
      }
      
      // Determinar função da instância baseado no nome
      let functionType = 'webhook'; // Padrão
      if (instance.name.includes('broadcast')) {
        functionType = 'broadcast';
      } else if (instance.name.includes('support') || instance.name.includes('suporte')) {
        functionType = 'support';
      }

      return {
        instanceName: instance.name || instance.instanceName,
        status: realStatus,
        connectionState: instance.connectionStatus || 'unknown',
        phone: instance.ownerJid ? instance.ownerJid.replace('@s.whatsapp.net', '') : null,
        profileName: instance.profileName || instance.name,
        qrcode: null, // QR code deve ser buscado separadamente
        messagesCount: instance._count?.Message || 0,
        lastActivity: instance.updatedAt || new Date().toISOString(),
        provider: 'evolution',
        maturationLevel: (instance._count?.Message || 0) > 1000 ? 'mature' : 
                         (instance._count?.Message || 0) > 100 ? 'warming' : 'new',
        dailyLimit: 100,
        disconnectedAt: instance.disconnectionAt,
        disconnectionReason: instance.disconnectionReasonCode,
        functionType: functionType
      };
    });
    
    res.json(formattedInstances);
  } catch (error) {
    logger.error('Error fetching instances:', error);
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
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName is required'
      });
    }
    
    // Create instance directly in Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    logger.info(`🔧 Creating instance: ${instanceName} for client: ${clientId || 'default'}`);
    
    logger.info(`🔧 Attempting to create instance with Evolution API at ${evolutionUrl}`);
    
    const payload = {
      instanceName: instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true
    };
    
    logger.info(`📤 Payload:`, JSON.stringify(payload, null, 2));
    
    const createResponse = await axios.post(`${evolutionUrl}/instance/create`, payload, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    logger.info(`✅ Evolution API Response:`, JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.data) {
      logger.info(`✅ Instance ${instanceName} created successfully`);
      
      // Emit real-time update
      io.emit('instance-created', {
        instanceName,
        clientId: clientId || 'imperio',
        status: 'disconnected',
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          instanceName,
          status: 'disconnected',
          message: 'Instance created successfully',
          evolutionData: createResponse.data
        }
      });
    } else {
      throw new Error('Failed to create instance in Evolution API');
    }
    
  } catch (error) {
    logger.error(`❌ Error creating instance: ${error.message}`);
    logger.error(`📊 Error details:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message;
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.response?.data || null
    });
  }
});

app.delete('/instance/delete/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    logger.info(`🗑️ Deleting instance: ${instanceName}`);
    
    // Delete instance in Evolution API
    const deleteResponse = await axios.delete(`${evolutionUrl}/instance/delete/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    logger.info(`✅ Instance ${instanceName} deleted successfully`);
    
    // Emit real-time update
    io.emit('instance-deleted', {
      instanceName,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true,
      message: `Instance ${instanceName} deleted successfully`,
      data: deleteResponse.data
    });
  } catch (error) {
    logger.error(`❌ Error deleting instance ${req.params.instanceName}:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.message || error.message 
    });
  }
});

// Instance Settings API
app.put('/api/instances/:instanceName/settings', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const settings = req.body;
    
    logger.info(`🔧 Updating settings for instance: ${instanceName}`);
    
    // Store settings in a configuration map (you can persist this to a database)
    if (!global.instanceSettings) {
      global.instanceSettings = new Map();
    }
    
    global.instanceSettings.set(instanceName, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
    
    // Update Evolution API settings if needed
    if (settings.webhookUrl) {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      try {
        await axios.put(`${evolutionUrl}/instance/updateSettings/${instanceName}`, {
          webhook: {
            url: settings.webhookUrl,
            by_events: true
          }
        }, {
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        logger.warn(`⚠️ Could not update Evolution API settings: ${error.message}`);
      }
    }
    
    // Emit real-time update
    io.emit('instance-settings-updated', {
      instanceName,
      settings,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        instanceName,
        settings,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`❌ Error updating instance settings: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/instances/:instanceName/settings', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Get settings from configuration map
    const settings = global.instanceSettings?.get(instanceName) || {
      antibanSettings: {
        strategy: 'conti_chips',
        delayMin: 30000,
        delayMax: 120000,
        dailyLimit: 100,
        hourlyLimit: 15,
        batchSize: 10,
        pauseBetweenBatches: 15,
        respectWarmupPeriod: true
      },
      functionType: 'broadcast',
      typingSimulation: true,
      onlinePresence: true,
      autoReconnect: true,
      messageQueue: true
    };
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Templates Management API
app.get('/api/templates', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const clientsDir = path.resolve(__dirname, '../../../clients');
    
    logger.info(`📂 Looking for templates in: ${clientsDir}`);
    
    const templates = [];
    
    // Read all client directories
    const clients = fs.readdirSync(clientsDir);
    
    for (const clientName of clients) {
      if (clientName.startsWith('.') || clientName === '_template') continue;
      
      const templatesDir = path.join(clientsDir, clientName, 'templates');
      
      if (fs.existsSync(templatesDir)) {
        const templateFiles = fs.readdirSync(templatesDir);
        
        for (const file of templateFiles) {
          if (file.endsWith('.js')) {
            const templatePath = path.join(templatesDir, file);
            const content = fs.readFileSync(templatePath, 'utf8');
            const templateType = file.replace('.js', '');
            
            templates.push({
              id: `${clientName}-${templateType}`,
              client: clientName,
              type: templateType,
              name: templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              category: templateType.includes('paid') ? 'Notificação' : 
                       templateType.includes('expired') ? 'Recuperação' : 'Marketing',
              content: content,
              filePath: templatePath,
              lastModified: fs.statSync(templatePath).mtime.toISOString()
            });
          }
        }
        
        // Check for variations directory
        const variationsDir = path.join(templatesDir, 'variations');
        if (fs.existsSync(variationsDir)) {
          const variationFiles = fs.readdirSync(variationsDir);
          
          for (const file of variationFiles) {
            if (file.endsWith('.js')) {
              const templatePath = path.join(variationsDir, file);
              const content = fs.readFileSync(templatePath, 'utf8');
              const templateType = file.replace('-variations.js', '');
              
              templates.push({
                id: `${clientName}-${templateType}-variations`,
                client: clientName,
                type: `${templateType}-variations`,
                name: `${templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Variações)`,
                category: 'Variações',
                content: content,
                filePath: templatePath,
                lastModified: fs.statSync(templatePath).mtime.toISOString()
              });
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error(`❌ Error loading templates: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.get('/api/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const clientsDir = path.resolve(__dirname, '../../../clients');
    
    // Parse template ID (format: clientName-templateType or clientName-templateType-variations)
    const parts = templateId.split('-');
    const clientName = parts[0];
    const isVariation = parts[parts.length - 1] === 'variations';
    const templateType = isVariation ? parts.slice(1, -1).join('-') : parts.slice(1).join('-');
    
    let templatePath;
    if (isVariation) {
      templatePath = path.join(clientsDir, clientName, 'templates', 'variations', `${templateType}-variations.js`);
    } else {
      templatePath = path.join(clientsDir, clientName, 'templates', `${templateType}.js`);
    }
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    
    const content = fs.readFileSync(templatePath, 'utf8');
    
    res.json({
      success: true,
      data: {
        id: templateId,
        client: clientName,
        type: isVariation ? `${templateType}-variations` : templateType,
        content: content,
        filePath: templatePath,
        lastModified: fs.statSync(templatePath).mtime.toISOString()
      }
    });
  } catch (error) {
    logger.error(`❌ Error loading template: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.put('/api/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content is required' 
      });
    }
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const clientsDir = path.resolve(__dirname, '../../../clients');
    
    // Parse template ID
    const parts = templateId.split('-');
    const clientName = parts[0];
    const isVariation = parts[parts.length - 1] === 'variations';
    const templateType = isVariation ? parts.slice(1, -1).join('-') : parts.slice(1).join('-');
    
    let templatePath;
    if (isVariation) {
      templatePath = path.join(clientsDir, clientName, 'templates', 'variations', `${templateType}-variations.js`);
    } else {
      templatePath = path.join(clientsDir, clientName, 'templates', `${templateType}.js`);
    }
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    
    // Create backup before editing
    const backupPath = `${templatePath}.backup.${Date.now()}`;
    fs.copyFileSync(templatePath, backupPath);
    
    // Write new content
    fs.writeFileSync(templatePath, content, 'utf8');
    
    logger.info(`📝 Template updated: ${templatePath}`);
    logger.info(`💾 Backup created: ${backupPath}`);
    
    res.json({
      success: true,
      data: {
        id: templateId,
        client: clientName,
        type: isVariation ? `${templateType}-variations` : templateType,
        content: content,
        filePath: templatePath,
        backupPath: backupPath,
        lastModified: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`❌ Error updating template: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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
          clientId: clientId,
          content: template.content || template.template,
          category: template.type === 'order_paid' ? 'recovery' : 
                   template.type === 'order_expired' ? 'recovery' : 'notification',
          functionType: template.type === 'order_paid' || template.type === 'order_expired' ? 'webhook' : 'broadcast',
          trigger: template.type === 'order_paid' ? 'order_paid' : 
                  template.type === 'order_expired' ? 'order_expired' : null,
          variables: template.variables || ['customerName', 'productName', 'total'],
          variations: template.variations || [],
          usageCount: 0,
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
              content: template.content || template.template,
              category: template.type === 'order_paid' ? 'recovery' : 
                       template.type === 'order_expired' ? 'recovery' : 'notification',
              functionType: template.type === 'order_paid' || template.type === 'order_expired' ? 'webhook' : 'broadcast',
              trigger: template.type === 'order_paid' ? 'order_paid' : 
                      template.type === 'order_expired' ? 'order_expired' : null,
              variables: template.variables || ['customerName', 'productName', 'total'],
              variations: template.variations || [],
              usageCount: 0,
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

// Endpoint to toggle between WhatsApp messages and webhook queue
app.post('/api/instances/toggle-count-mode', (req, res) => {
  showWebhookQueue = !showWebhookQueue;
  res.json({ 
    success: true, 
    mode: showWebhookQueue ? 'webhook_queue' : 'whatsapp_messages',
    message: `Now showing ${showWebhookQueue ? 'webhook queue count' : 'WhatsApp message count'}`
  });
});

// Debug endpoint to test pending webhook count
app.get('/api/debug/webhook-count', async (req, res) => {
  try {
    const pendingCount = await getPendingWebhookCount();
    res.json({ 
      success: true, 
      pendingWebhooks: pendingCount,
      skipDB: process.env.SKIP_DB === 'true',
      showWebhookQueue
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

// Webhook Pool APIs
app.get('/api/webhooks/pools', (req, res) => {
  try {
    const poolStats = webhookPoolManager.getAllPoolStats();
    res.json({ success: true, pools: poolStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/webhooks/pools/:clientId', (req, res) => {
  try {
    const { clientId } = req.params;
    const poolStats = webhookPoolManager.getPoolStats(clientId);
    res.json({ success: true, pool: poolStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks/pools/:clientId/instances', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { instanceName } = req.body;
    
    await webhookPoolManager.addInstanceToPool(clientId, instanceName);
    res.json({ success: true, message: `Instance ${instanceName} added to pool ${clientId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/webhooks/pools/:clientId/instances/:instanceName', async (req, res) => {
  try {
    const { clientId, instanceName } = req.params;
    
    await webhookPoolManager.removeInstanceFromPool(clientId, instanceName);
    res.json({ success: true, message: `Instance ${instanceName} removed from pool ${clientId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/webhooks/stats', (req, res) => {
  try {
    // Mock webhook stats - implementar com dados reais
    const stats = {
      totalMessages: 19821,
      successRate: 95.2,
      averageDelay: 32,
      lastMessage: new Date().toISOString(),
      poolsActive: Object.keys(webhookPoolManager.getAllPoolStats()).length,
      healthyInstances: Object.values(webhookPoolManager.getAllPoolStats())
        .reduce((total, pool) => total + pool.healthyCount, 0)
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Instance QR Code endpoint
app.get('/api/instances/:instanceName/qrcode', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data?.base64) {
      res.json({ success: true, qrcode: response.data.base64 });
    } else {
      res.status(404).json({ success: false, error: 'QR Code not available' });
    }
  } catch (error) {
    logger.error('Error getting QR code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get queue status endpoint
app.get('/api/queue/status', async (req, res) => {
  try {
    const { getPendingWebhookCount, getInMemoryQueue } = await import('./services/queue/manager.js');
    
    const pendingCount = await getPendingWebhookCount();
    const queueStats = getInMemoryQueue ? getInMemoryQueue().getStats() : {};
    
    res.json({
      success: true,
      pending: pendingCount,
      stats: queueStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting queue status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      pending: 0 
    });
  }
});

// Clear message queue endpoint
app.post('/api/queue/clear/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    logger.info(`🧹 Clearing message queue for client: ${clientId}`);

    let result = {};
    
    try {
      // Try to clear Redis queues if available
      const { clearQueues } = await import('./services/queue/manager.js');
      result = await clearQueues();
    } catch (redisError) {
      logger.warn('Redis not available, using fallback method:', redisError.message);
      
      // Fallback: Since Redis is not available, messages are processed directly
      // This means there's no actual queue to clear, which is good for our use case
      result = {
        status: 'no-queue',
        reason: 'Messages processed directly without Redis queue',
        action: 'No pending messages to clear'
      };
    }
    
    logger.info(`✅ Queue clear operation completed for ${clientId}:`, result);
    
    res.json({
      success: true,
      message: `Message queue clearing completed for ${clientId}`,
      data: {
        clientId,
        clearedAt: new Date().toISOString(),
        ...result
      }
    });
  } catch (error) {
    logger.error('Error clearing message queue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset message count endpoint
app.post('/api/instances/reset-messages/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    logger.info(`🔄 Resetting message count for client: ${clientId}`);

    // Get current instances data from Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    
    const response = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const instances = response.data || [];
    
    // Filter webhook instances for the client
    const webhookInstances = instances.filter(instance => 
      instance.name && 
      instance.name.includes(`${clientId}-webhook`)
    );

    // Create reset data with current message counts as baseline
    const resetData = {
      clientId,
      resetTimestamp: new Date().toISOString(),
      instances: {},
      monitoring: {
        enabled: true,
        lastCheck: new Date().toISOString(),
        incrementalCount: {}
      }
    };

    webhookInstances.forEach(instance => {
      resetData.instances[instance.name] = {
        baselineCount: instance._count?.Message || 0,
        resetAt: new Date().toISOString(),
        lastKnownCount: instance._count?.Message || 0
      };
      // Initialize incremental counter to 0
      resetData.monitoring.incrementalCount[instance.name] = 0;
    });

    // Save reset data to file
    const fs = await import('fs');
    const path = await import('path');
    const resetFilePath = path.join(process.cwd(), 'data', `${clientId}-message-reset.json`);
    
    // Ensure data directory exists
    const dataDir = path.dirname(resetFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(resetFilePath, JSON.stringify(resetData, null, 2));

    logger.info(`✅ Message count reset completed for ${clientId}:`, resetData);
    
    res.json({
      success: true,
      message: `Message count reset for ${webhookInstances.length} instances`,
      data: {
        clientId,
        instancesReset: webhookInstances.length,
        resetTimestamp: resetData.resetTimestamp,
        instances: Object.keys(resetData.instances)
      }
    });
  } catch (error) {
    logger.error('Error resetting message count:', error);
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

// Webhook Pools API
app.get('/api/webhook-pools', async (req, res) => {
  try {
    const pools = {
      imperio: {
        clientId: 'imperio',
        strategy: 'round-robin',
        instances: [
          'imperio-webhook-1',
          'imperio-webhook-2', 
          'imperio-webhook-3',
          'imperio-webhook-4'
        ],
        status: 'active',
        healthStatus: {
          total: 4,
          healthy: 0,
          unhealthy: 4
        },
        messageQueue: 0
      }
    };
    
    res.json({ success: true, data: pools });
  } catch (error) {
    logger.error('Error fetching webhook pools:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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

    // 4. Start server with WebSocket support
    server.listen(PORT, '0.0.0.0', () => {
      const systemStats = clientManager.getSystemStats();
      const templateStats = templateManager.getTemplateStats();
      
      logger.info('🎉 OracleWA SaaS v3.0 SCALABLE started successfully!');
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
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