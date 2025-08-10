import express from 'express';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import AntibanStrategy from './modules/broadcast/strategies/antiban-strategy.js';

// Carregar configuração do ambiente
dotenv.config();

console.log('🚀 Starting OracleWA SaaS v3.0 - WITH WHATSAPP + ANTIBAN INTEGRATION');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Evolution API Config
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
const EMPIRE_INSTANCE = 'imperio1';

// Initialize AntibanStrategy
const antibanStrategy = new AntibanStrategy();

// Função para simular digitação
async function simulateTyping(phone) {
  return new Promise((resolve, reject) => {
    try {
      const payload = JSON.stringify({
        number: phone,
        delay: 3000 // 3 segundos
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
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ Typing simulation sent: ${res.statusCode}`);
          resolve({ success: true, status: res.statusCode, data });
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ Typing simulation failed:`, error.message);
        resolve({ success: false, error: error.message }); // Don't reject to avoid blocking main flow
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
      
      req.write(payload);
      req.end();
      
    } catch (error) {
      console.error(`❌ Typing simulation error:`, error.message);
      resolve({ success: false, error: error.message });
    }
  });
}

// Função para simular presença online
async function simulatePresence(phone, presence = 'available') {
  return new Promise((resolve, reject) => {
    try {
      const payload = JSON.stringify({
        number: phone,
        presence: presence
      });
      
      const url = new URL(`/chat/updatePresence/${EMPIRE_INSTANCE}`, EVOLUTION_API_URL);
      
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
      
      console.log(`👤 Setting presence ${presence} for ${phone}...`);
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ Presence updated: ${res.statusCode}`);
          resolve({ success: true, status: res.statusCode, data });
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ Presence update failed:`, error.message);
        resolve({ success: false, error: error.message }); // Don't reject to avoid blocking main flow
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
      
      req.write(payload);
      req.end();
      
    } catch (error) {
      console.error(`❌ Presence update error:`, error.message);
      resolve({ success: false, error: error.message });
    }
  });
}

// Função para enviar WhatsApp (usando http nativo) com anti-ban
async function sendWhatsAppMessage(phone, customerName, type, data) {
  return new Promise((resolve, reject) => {
    try {
      // Limpar telefone
      let cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('55')) {
        cleanPhone = '55' + cleanPhone;
      }
      
      let message = '';
      
      if (type === 'order_paid') {
        message = `🎉 *PAGAMENTO CONFIRMADO*\n\nParabéns *${customerName}*! ✅\n\nSeu pedido de *${data.productName}* no valor de *R$ ${data.total}* foi confirmado com sucesso!\n\n🏆 *Você está concorrendo a R$ 100.000,00 pela Federal!*\n\n*Próximos passos:*\n✅ Entre na nossa comunidade VIP\n📱 Acompanhe os sorteios ao vivo\n🎯 Boa sorte na sua sorte!\n\n👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n*Império Prêmios* 🍀\n_Sua sorte começa agora!_`;
      } else if (type === 'order_expired') {
        message = `🚨 *PEDIDO EXPIRADO*\n\nOi *${customerName}*! ⏰\n\nSeu pedido do produto *${data.productName}* no valor de *R$ ${data.total}* expirou.\n\n🔥 *Última chance para suas cotas!*\n\n⚠️ Concorra a *R$ 100.000,00 pela Federal!*\n🗂️ *Garanta agora:*\n\n👉 https://imperiopremioss.com/campanha/rapidinha-valendo-1200000-mil-em-premiacoes?&afiliado=A0RJJ5L1QK\n\n*Império Prêmios* 🏆\n_O tempo está acabando..._`;
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
      
      // ANTI-BAN: Aplicar estratégias antes do envio
      try {
        await antibanStrategy.beforeSend(EMPIRE_INSTANCE, cleanPhone);
      } catch (antibanError) {
        console.warn(`⚠️ Anti-ban check failed: ${antibanError.message}`);
        reject(new Error(`Anti-ban limit reached: ${antibanError.message}`));
        return;
      }
      
      // ANTI-BAN: Simular presença online
      await simulatePresence(cleanPhone, 'available');
      
      // ANTI-BAN: Simular digitação por 3 segundos
      await simulateTyping(cleanPhone);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar digitação
      
      console.log(`📤 Sending WhatsApp to ${cleanPhone} via ${EMPIRE_INSTANCE}`);
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          console.log(`✅ WhatsApp sent successfully: ${res.statusCode}`);
          
          // ANTI-BAN: Aplicar estratégias após o envio
          try {
            await antibanStrategy.afterSend(EMPIRE_INSTANCE, cleanPhone);
          } catch (antibanError) {
            console.warn(`⚠️ Anti-ban after-send failed: ${antibanError.message}`);
          }
          
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
      
    } catch (error) {
      console.error(`❌ WhatsApp function error:`, error.message);
      reject(error);
    }
  });
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
    version: '3.0.0-simple'
  });
});

// Webhook endpoints - SEM integração WhatsApp por enquanto
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
    
    // ENVIAR WHATSAPP COM ANTI-BAN - REATIVADO!
    try {
      console.log('🚀 Enviando mensagem WhatsApp com proteções anti-ban...');
      await sendWhatsAppMessage(phone, userName, 'order_paid', { total, productName });
      console.log('✅ Mensagem de pedido pago enviada com sucesso!');
    } catch (whatsappError) {
      console.error('❌ Falha no envio WhatsApp:', whatsappError.message);
      // Se for erro de limite anti-ban, informar no response
      if (whatsappError.message.includes('Anti-ban limit')) {
        console.log('⏳ Mensagem será reagendada devido a limites anti-ban');
      }
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
    
    // ENVIAR WHATSAPP COM ANTI-BAN - REATIVADO!
    try {
      console.log('🚀 Enviando mensagem WhatsApp com proteções anti-ban...');
      await sendWhatsAppMessage(phone, userName, 'order_expired', { total, productName });
      console.log('✅ Mensagem de pedido EXPIRADO enviada com sucesso!');
    } catch (whatsappError) {
      console.error('❌ Falha no envio WhatsApp:', whatsappError.message);
      // Se for erro de limite anti-ban, informar no response
      if (whatsappError.message.includes('Anti-ban limit')) {
        console.log('⏳ Mensagem será reagendada devido a limites anti-ban');
      }
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

// Initialize and start server
async function startServer() {
  try {
    await antibanStrategy.initialize();
    console.log('🛡️ Anti-ban strategy initialized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 OracleWA SaaS v3.0 SIMPLE running on port ${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log(`📡 Webhook: /api/webhook/temp-order-*`);
      console.log(`🛡️ Anti-ban protections: ACTIVE`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();