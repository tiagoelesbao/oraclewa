import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { URL } from 'url';

// Carregar configuração do ambiente
dotenv.config();

console.log('🚀 Starting OracleWA SaaS v3.0 - SIMPLE WITHOUT ASYNC ISSUES');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Evolution API Config
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
const EMPIRE_INSTANCE = 'imperio1';

// Contador para delays simples
let lastMessageTime = 0;
const MIN_DELAY = 15000; // 15 segundos mínimo

// Função para delay simples
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para aplicar delay anti-ban simples
async function applySimpleDelay() {
  const now = Date.now();
  const timeSinceLastMessage = now - lastMessageTime;
  
  if (timeSinceLastMessage < MIN_DELAY) {
    const waitTime = MIN_DELAY - timeSinceLastMessage + Math.random() * 10000; // +0-10s random
    console.log(`⏳ Anti-ban delay: ${Math.round(waitTime / 1000)}s`);
    await sleep(waitTime);
  }
  
  lastMessageTime = Date.now();
}

// Função para simular digitação (sem await dentro de Promise)
function simulateTypingSync(phone) {
  const payload = JSON.stringify({
    number: phone,
    delay: 3000
  });
  
  const url = new URL(`/chat/sendPresence/${EMPIRE_INSTANCE}`, EVOLUTION_API_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 5000
  };
  
  console.log(`⌨️ Simulating typing for ${phone}...`);
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ Typing simulation sent: ${res.statusCode}`);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Typing simulation failed:`, error.message);
      resolve(false); // Don't block main flow
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.write(payload);
    req.end();
  });
}

// Função para enviar WhatsApp (versão simplificada sem async complications)
async function sendWhatsAppMessage(phone, customerName, type, data) {
  try {
    // Aplicar delay anti-ban simples
    await applySimpleDelay();
    
    // Limpar telefone
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    // Simular digitação (3 segundos)
    await simulateTypingSync(cleanPhone);
    await sleep(3000); // Aguardar "digitação"
    
    let message = '';
    
    if (type === 'order_paid') {
      message = `🎉 *PAGAMENTO CONFIRMADO*\\n\\nParabéns *${customerName}*! ✅\\n\\nSeu pedido de *${data.productName}* no valor de *R$ ${data.total}* foi confirmado com sucesso!\\n\\n🏆 *Você está concorrendo a R$ 100.000,00 pela Federal!*\\n\\n*Próximos passos:*\\n✅ Entre na nossa comunidade VIP\\n📱 Acompanhe os sorteios ao vivo\\n🎯 Boa sorte na sua sorte!\\n\\n👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\\n\\n*Império Prêmios* 🍀\\n_Sua sorte começa agora!_`;
    } else if (type === 'order_expired') {
      message = `🚨 *PEDIDO EXPIRADO*\\n\\nOi *${customerName}*! ⏰\\n\\nSeu pedido do produto *${data.productName}* no valor de *R$ ${data.total}* expirou.\\n\\n🔥 *Última chance para suas cotas!*\\n\\n⚠️ Concorra a *R$ 100.000,00 pela Federal!*\\n🗂️ *Garanta agora:*\\n\\n👉 https://imperiopremioss.com/campanha/rapidinha-valendo-1200000-mil-em-premiacoes?&afiliado=A0RJJ5L1QK\\n\\n*Império Prêmios* 🏆\\n_O tempo está acabando..._`;
    }
    
    const payload = JSON.stringify({
      number: cleanPhone,
      text: message
    });
    
    const url = new URL(`/message/sendText/${EMPIRE_INSTANCE}`, EVOLUTION_API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    };
    
    console.log(`📤 Sending WhatsApp to ${cleanPhone} via ${EMPIRE_INSTANCE}`);
    
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ WhatsApp sent successfully: ${res.statusCode}`);
          resolve({ success: true, status: res.statusCode, data });
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ WhatsApp send failed:`, error.message);
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(payload);
      req.end();
    });
    
  } catch (error) {
    console.error(`❌ WhatsApp function error:`, error.message);
    throw error;
  }
}

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
    version: '3.0.0-simple-fixed'
  });
});

// Webhook endpoints
app.post('/api/webhook/temp-order-paid', async (req, res) => {
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
    
    // ENVIAR WHATSAPP COM PROTEÇÕES ANTI-BAN
    try {
      console.log('🚀 Enviando mensagem WhatsApp com anti-ban...');
      await sendWhatsAppMessage(phone, userName, 'order_paid', { total, productName });
      console.log('✅ Mensagem de pedido pago enviada com sucesso!');
    } catch (whatsappError) {
      console.error('❌ Falha no envio WhatsApp:', whatsappError.message);
    }
    
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

app.post('/api/webhook/temp-order-expired', async (req, res) => {
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
    
    // ENVIAR WHATSAPP COM PROTEÇÕES ANTI-BAN
    try {
      console.log('🚀 Enviando mensagem WhatsApp com anti-ban...');
      await sendWhatsAppMessage(phone, userName, 'order_expired', { total, productName });
      console.log('✅ Mensagem de pedido EXPIRADO enviada com sucesso!');
    } catch (whatsappError) {
      console.error('❌ Falha no envio WhatsApp:', whatsappError.message);
    }
    
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
    whatsapp: 'active-with-antiban',
    lastMessage: new Date(lastMessageTime).toISOString()
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
  console.log(`🌟 OracleWA SaaS v3.0 SIMPLE FIXED running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📡 Webhook: /api/webhook/temp-order-*`);
  console.log(`🛡️ Simple Anti-ban: ACTIVE (15s+ delays + typing)`);
});