import express from 'express';
import dotenv from 'dotenv';

// Carregar configuração do ambiente
dotenv.config();

console.log('🚀 Starting OracleWA SaaS v3.0 - SUPER SIMPLE');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware básico
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '3.0.0-simple'
  });
});

// Webhook endpoints - SEM integração WhatsApp por enquanto
app.post('/api/webhook/temp-order-paid', (req, res) => {
  try {
    console.log('💰 ORDEM PAGA RECEBIDA');
    
    const userData = req.body.data?.user || {};
    const userName = userData.name || 'Cliente';
    const phone = userData.phone || 'N/A';
    const total = req.body.data?.total || 0;
    const productName = req.body.data?.product?.title || 'Produto';
    
    console.log(`✅ Cliente: ${userName}`);
    console.log(`📞 Telefone: ${phone}`);
    console.log(`💰 Valor: R$ ${total}`);
    console.log(`🎁 Produto: ${productName}`);
    
    // TODO: Aqui vai a integração WhatsApp quando estabilizar
    console.log('📝 WhatsApp message would be sent here');
    
    res.json({ 
      success: true, 
      message: 'Order paid processed',
      customer: userName,
      phone: phone,
      total: total
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhook/temp-order-expired', (req, res) => {
  try {
    console.log('⏰ ORDEM EXPIRADA RECEBIDA');
    
    const userData = req.body.data?.user || {};
    const userName = userData.name || 'Cliente';
    const phone = userData.phone || 'N/A';
    const total = req.body.data?.total || 0;
    const productName = req.body.data?.product?.title || 'Produto';
    
    console.log(`✅ Cliente: ${userName}`);
    console.log(`📞 Telefone: ${phone}`);
    console.log(`💰 Valor: R$ ${total}`);
    console.log(`🎁 Produto: ${productName}`);
    
    // TODO: Aqui vai a integração WhatsApp quando estabilizar
    console.log('📝 WhatsApp message would be sent here');
    
    res.json({ 
      success: true, 
      message: 'Order expired processed',
      customer: userName,
      phone: phone,
      total: total
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Outros endpoints básicos
app.post('/temp-order-paid', (req, res) => {
  console.log('🔄 Redirect from /temp-order-paid to /api/webhook/temp-order-paid');
  req.url = '/api/webhook/temp-order-paid';
  app.handle(req, res);
});

app.post('/temp-order-expired', (req, res) => {
  console.log('🔄 Redirect from /temp-order-expired to /api/webhook/temp-order-expired');
  req.url = '/api/webhook/temp-order-expired';
  app.handle(req, res);
});

// Dashboard
app.get('/api/management/dashboard', (req, res) => {
  res.json({
    system: 'OracleWA SaaS v3.0 - Simple Mode',
    status: 'running',
    webhooks: 'receiving',
    whatsapp: 'pending-integration'
  });
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET /health',
      'POST /api/webhook/temp-order-paid',
      'POST /api/webhook/temp-order-expired',
      'GET /api/management/dashboard'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌟 OracleWA SaaS v3.0 SIMPLE running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📡 Webhook: /api/webhook/temp-order-*`);
});