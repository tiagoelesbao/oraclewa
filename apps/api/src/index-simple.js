import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';

// Carregar configuração do ambiente
dotenv.config();

console.log('🚀 Starting OracleWA SaaS v3.0');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${process.env.APP_PORT || 3000}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
const EMPIRE_INSTANCE = 'imperio1';

// Função para enviar mensagem WhatsApp
async function sendWhatsAppMessage(phone, customerName, type, data) {
  try {
    // Limpar número de telefone
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    let message = '';
    
    if (type === 'order_paid') {
      message = `🎉 **PAGAMENTO CONFIRMADO**\n\nParabéns **${customerName}**! ✅\n\nSeu pedido de **${data.productName}** no valor de **R$ ${data.total}** foi confirmado com sucesso!\n\n🏆 **Você está concorrendo a R$ 100.000,00 pela Federal!**\n\n**Próximos passos:**\n✅ Entre na nossa comunidade VIP\n📱 Acompanhe os sorteios ao vivo\n🎯 Boa sorte na sua sorte!\n\n👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n**Império Prêmios** 🍀\n_Sua sorte começa agora!_`;
    } else if (type === 'order_expired') {
      message = `🚨 **PEDIDO EXPIRADO**\n\nOi **${customerName}**! ⏰\n\nSeu pedido do produto **${data.productName}** no valor de **R$ ${data.total}** expirou.\n\n🔥 **Última chance para suas cotas!**\n\n⚠️ Concorra a **R$ 100.000,00 pela Federal!**\n🗂️ **Garanta agora:**\n\n👉 https://imperiopremioss.com/campanha/rapidinha-valendo-1200000-mil-em-premiacoes?&afiliado=A0RJJ5L1QK\n\n**Império Prêmios** 🏆\n_O tempo está acabando..._`;
    }
    
    const payload = {
      number: cleanPhone,
      text: message
    };
    
    console.log(`📤 Sending WhatsApp message to ${cleanPhone} via ${EMPIRE_INSTANCE}`);
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EMPIRE_INSTANCE}`,
      payload,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ WhatsApp message sent successfully:`, response.data);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message:`, error.message);
    throw error;
  }
}

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

// Endpoints com prefixo /api/webhook/ (URL completa do Railway)
app.post('/api/webhook/temp-order-paid', (req, res) => {
  try {
    console.log('💰 API Webhook - Império Order Paid received');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    
    // Extrair dados do payload correto
    const { event } = req.body;
    const userData = req.body.data?.user || {};
    const userName = userData.name || 'Cliente';
    const phone = userData.phone || 'N/A';
    const total = req.body.data?.total || 0;
    
    console.log(`✅ Processing order paid via API: ${userName} (${phone}) - R$ ${total}`);
    
    // Enviar mensagem WhatsApp
    try {
      await sendWhatsAppMessage(phone, userName, 'order_paid', { total, productName: req.body.data?.product?.title });
    } catch (whatsappError) {
      console.error('❌ WhatsApp send failed:', whatsappError.message);
    }
    
    res.json({ success: true, message: 'Order paid webhook processed via API', event });
  } catch (error) {
    console.error('❌ Error processing API order paid webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhook/temp-order-expired', (req, res) => {
  try {
    console.log('⏰ API Webhook - Império Order Expired received');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    
    // Extrair dados do payload correto
    const { event } = req.body;
    const userData = req.body.data?.user || {};
    const userName = userData.name || 'Cliente';
    const phone = userData.phone || 'N/A';
    const total = req.body.data?.total || 0;
    
    console.log(`⚠️ Processing order expired via API: ${userName} (${phone}) - R$ ${total}`);
    
    // Enviar mensagem WhatsApp
    try {
      await sendWhatsAppMessage(phone, userName, 'order_expired', { total, productName: req.body.data?.product?.title });
    } catch (whatsappError) {
      console.error('❌ WhatsApp send failed:', whatsappError.message);
    }
    
    res.json({ success: true, message: 'Order expired webhook processed via API', event });
  } catch (error) {
    console.error('❌ Error processing API order expired webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Também manter versões sem /api para compatibilidade
app.post('/webhook/temp-order-paid', (req, res) => {
  console.log('💰 Webhook without API prefix - redirecting to /temp-order-paid');
  req.url = '/temp-order-paid';
  req.method = 'POST';
  app.handle(req, res);
});

app.post('/webhook/temp-order-expired', (req, res) => {
  console.log('⏰ Webhook without API prefix - redirecting to /temp-order-expired');
  req.url = '/temp-order-expired';
  req.method = 'POST';
  app.handle(req, res);
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
      '/api/webhook/temp-order-paid',
      '/api/webhook/temp-order-expired',
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