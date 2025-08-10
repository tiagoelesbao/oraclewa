import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

// Carregar configuração do ambiente
dotenv.config();

console.log('🚀 Starting OracleWA SaaS v3.0');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${process.env.APP_PORT || 3000}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Webhook endpoints básicos
app.post('/webhook/:clientId/:type', async (req, res) => {
  console.log(`📥 Webhook received: ${req.params.clientId}/${req.params.type}`);
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  res.json({ 
    success: true, 
    message: 'Webhook received',
    client: req.params.clientId,
    type: req.params.type
  });
});

// Império webhook shortcuts - URLs sem /webhook prefix
app.post('/temp-order-paid', (req, res) => {
  try {
    console.log('💰 Império Order Paid webhook received');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    
    // Processar webhook aqui (por enquanto apenas log)
    const { event, userName, phone, total } = req.body;
    console.log(`✅ Processing order paid: ${userName} (${phone}) - R$ ${total}`);
    
    res.json({ success: true, message: 'Order paid webhook processed', event });
  } catch (error) {
    console.error('❌ Error processing order paid webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/temp-order-expired', (req, res) => {
  try {
    console.log('⏰ Império Order Expired webhook received');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    
    // Processar webhook aqui (por enquanto apenas log)
    const { event, userName, phone, total } = req.body;
    console.log(`⚠️ Processing order expired: ${userName} (${phone}) - R$ ${total}`);
    
    res.json({ success: true, message: 'Order expired webhook processed', event });
  } catch (error) {
    console.error('❌ Error processing order expired webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Também manter com prefix para compatibilidade
app.post('/webhook/temp-order-paid', (req, res) => {
  console.log('💰 Webhook with prefix - redirecting...');
  req.url = '/temp-order-paid';
  app._router.handle(req, res);
});

app.post('/webhook/temp-order-expired', (req, res) => {
  console.log('⏰ Webhook with prefix - redirecting...');
  req.url = '/temp-order-expired';
  app._router.handle(req, res);
});

// Dashboard básico
app.get('/api/management/dashboard', (req, res) => {
  res.json({
    system: 'OracleWA SaaS v3.0',
    status: 'running',
    clients: ['imperio'],
    features: ['webhooks', 'templates', 'multi-tenant']
  });
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      '/health',
      '/temp-order-paid',
      '/temp-order-expired', 
      '/webhook/temp-order-paid',
      '/webhook/temp-order-expired',
      '/webhook/:clientId/:type',
      '/api/management/dashboard'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌟 OracleWA SaaS v3.0 running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📡 Webhooks ready: /webhook/:clientId/:type`);
  console.log(`👑 Império webhooks: /webhook/temp-order-*`);
});