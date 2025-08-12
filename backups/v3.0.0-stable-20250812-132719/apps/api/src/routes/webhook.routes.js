import { Router } from 'express';
import { validateWebhook } from '../middlewares/webhookAuth.js';
import { 
  handleOrderExpired,
  handleOrderPaid,
  handleCarrinhoAbandonado,
  handleVendaExpirada,
  handleVendaAprovada,
  handleButtonClick
} from '../controllers/webhookController.js';
import { validateWebhookData } from '../middlewares/validation.js';
import Joi from 'joi';

const router = Router();

// Copy webhook schema for minimal test
const webhookSchemas = {
  order_expired: Joi.object({
    event: Joi.string().valid('order.expired').required(),
    timestamp: Joi.date().iso().optional(),
    data: Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      product: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        title: Joi.string().required()
      }).required(),
      user: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^[\+\(\)\d\s\-]{10,20}$/).required(),
        email: Joi.string().email().allow('').optional(),
        cpf: Joi.string().allow('').optional(),
        affiliateCode: Joi.string().allow('').optional(),
        createdAt: Joi.date().iso().optional()
      }).required(),
      pixCode: Joi.string().allow('').optional(),
      quantity: Joi.number().integer().positive().optional(),
      status: Joi.string().optional(),
      price: Joi.number().positive().optional(),
      subtotal: Joi.number().positive().optional(),
      discount: Joi.number().min(0).optional(),
      total: Joi.number().positive().required(),
      expirationAt: Joi.date().iso().optional(),
      affiliate: Joi.string().allow('').optional(),
      createdAt: Joi.date().iso().optional(),
      params: Joi.object().optional()
    }).required()
  })
};

// Debug endpoint - mostra dados recebidos
router.post('/debug', (req, res) => {
  console.log('=== WEBHOOK DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('===================');
  
  res.json({
    message: 'Debug data logged - check server logs',
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Debug específico para order-expired
router.post('/debug-expired', (req, res) => {
  console.log('=== DEBUG ORDER EXPIRED ===');
  console.log('All Headers:', JSON.stringify(req.headers, null, 2));
  console.log('X-AUTH-WEBHOOK:', req.headers['x-auth-webhook']);
  console.log('Expected Secret:', process.env.WEBHOOK_SECRET);
  console.log('Match:', req.headers['x-auth-webhook'] === process.env.WEBHOOK_SECRET);
  console.log('Body Event:', req.body?.event);
  console.log('Full Body:', JSON.stringify(req.body, null, 2));
  console.log('========================');
  
  res.json({
    success: true,
    authHeader: req.headers['x-auth-webhook'],
    expectedSecret: process.env.WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
    match: req.headers['x-auth-webhook'] === process.env.WEBHOOK_SECRET,
    event: req.body?.event,
    fullPayload: req.body,
    timestamp: new Date().toISOString()
  });
});

// Endpoint específico para capturar REAL expired webhooks do Império
router.post('/capture-real-expired', (req, res) => {
  console.log('=== REAL EXPIRED WEBHOOK CAPTURE ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw Body:', JSON.stringify(req.body, null, 2));
  
  // Extrair dados específicos
  const data = req.body?.data;
  if (data) {
    console.log('USER DATA:', JSON.stringify(data.user, null, 2));
    console.log('PRODUCT DATA:', JSON.stringify(data.product, null, 2));
    console.log('QUANTITY:', data.quantity);
    console.log('TOTAL:', data.total);
    console.log('EXPIRATION:', data.expirationAt);
  }
  console.log('===============================');
  
  res.json({ 
    success: true, 
    message: 'Real expired webhook captured for analysis',
    timestamp: new Date().toISOString(),
    receivedData: {
      event: req.body?.event,
      userData: data?.user,
      productData: data?.product,
      quantity: data?.quantity,
      total: data?.total,
      expiration: data?.expirationAt
    }
  });
});

// RAW CAPTURE - SEM AUTENTICAÇÃO E SEM VALIDAÇÃO
router.post('/raw-capture', (req, res) => {
  console.log('=== RAW WEBHOOK CAPTURE ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw Body:', JSON.stringify(req.body, null, 2));
  console.log('Query Params:', JSON.stringify(req.query, null, 2));
  console.log('========================');
  
  res.json({ 
    success: true, 
    message: 'Raw webhook captured successfully',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    query: req.query
  });
});

// WEBHOOK STATUS MONITOR - Endpoint para ver atividade recente
const recentWebhooks = [];
const MAX_RECENT_WEBHOOKS = 50;

router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    recentWebhooks: recentWebhooks.slice(-10), // Últimos 10
    totalProcessed: recentWebhooks.length,
    systemInfo: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    }
  });
});

// Middleware para capturar todos os webhooks
router.use((req, res, next) => {
  if (req.method === 'POST') {
    // LOG DETALHADO PARA DEBUG
    if (req.path.includes('order-expired')) {
      console.log('🔍 EXPIRED WEBHOOK DEBUG:');
      console.log('Path:', req.path);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('X-AUTH-WEBHOOK:', req.headers['x-auth-webhook']);
      console.log('Expected Secret:', process.env.WEBHOOK_SECRET);
      console.log('Match:', req.headers['x-auth-webhook'] === process.env.WEBHOOK_SECRET);
      console.log('====================');
    }
    const webhookInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length'),
      event: req.body?.event || 'unknown',
      userId: req.body?.data?.user?.id || 'unknown',
      userName: req.body?.data?.user?.name || 'unknown',
      phone: req.body?.data?.user?.phone || 'unknown',
      total: req.body?.data?.total || 0,
      status: 'processing'
    };
    
    recentWebhooks.push(webhookInfo);
    
    // Manter apenas os últimos N webhooks
    if (recentWebhooks.length > MAX_RECENT_WEBHOOKS) {
      recentWebhooks.shift();
    }
    
    console.log('📥 WEBHOOK RECEIVED:', JSON.stringify(webhookInfo, null, 2));
    
    // Interceptar response para capturar status final
    const originalSend = res.send;
    res.send = function(data) {
      webhookInfo.status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';
      webhookInfo.responseStatus = res.statusCode;
      webhookInfo.processedAt = new Date().toISOString();
      
      console.log('📤 WEBHOOK PROCESSED:', JSON.stringify({
        path: webhookInfo.path,
        event: webhookInfo.event,
        status: webhookInfo.status,
        responseStatus: webhookInfo.responseStatus,
        userName: webhookInfo.userName,
        phone: webhookInfo.phone
      }, null, 2));
      
      return originalSend.call(this, data);
    };
  }
  next();
});

// Endpoint de teste simples para formatação de número
router.post('/test-format', (req, res) => {
  try {
    const phoneNumber = req.body.phone || '5511959761948';
    
    // Testar formatação do número
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    console.log('=== TESTE FORMATAÇÃO ===');
    console.log('Original:', phoneNumber);
    console.log('Formatado:', formattedPhone);
    console.log('Com domínio:', formattedPhone + '@s.whatsapp.net');
    console.log('=======================');

    res.json({
      success: true,
      original: phoneNumber,
      formatted: formattedPhone,
      whatsappFormat: formattedPhone + '@s.whatsapp.net',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no teste:', error);
    res.status(500).json({
      error: 'Erro no teste de formatação',
      details: error.message
    });
  }
});

// Novos endpoints para o sistema Império
router.post('/order-expired', 
  validateWebhook,
  validateWebhookData('order_expired'),
  handleOrderExpired
);

router.post('/order-paid',
  validateWebhook,
  validateWebhookData('order_paid'),
  handleOrderPaid
);

// Teste direto com dados completos para seu número
router.post('/test-order-paid-complete', async (req, res) => {
  try {
    console.log('=== TESTE ORDER PAID COMPLETO ===');
    
    const testData = {
      user: { 
        name: req.body.user?.name || "Teste Botões", 
        phone: req.body.user?.phone || "5511959761948",
        email: req.body.user?.email || "teste@teste.com"
      },
      product: { 
        title: req.body.product?.title || "🏆 Sorteio Império - R$ 170.000" 
      },
      quantity: req.body.quantity || 2,
      total: req.body.total || "25.00",
      id: req.body.id || "TEST-" + Date.now(),
      createdAt: new Date().toISOString()
    };
    
    console.log('Dados de teste:', JSON.stringify(testData, null, 2));
    
    // Simular dados validados
    req.validatedData = { data: testData };
    
    await handleOrderPaid(req, res);
  } catch (error) {
    console.error('Erro no teste:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoints antigos (manter compatibilidade)
router.post('/carrinho-abandonado', 
  validateWebhook,
  validateWebhookData('carrinho_abandonado'),
  handleCarrinhoAbandonado
);

router.post('/venda-expirada',
  validateWebhook,
  validateWebhookData('venda_expirada'),
  handleVendaExpirada
);

router.post('/venda-aprovada',
  validateWebhook,
  validateWebhookData('venda_aprovada'),
  handleVendaAprovada
);

// ENDPOINT DE TESTE SEM AUTENTICAÇÃO - Para debugging
router.post('/test-order-expired', 
  validateWebhookData('order_expired'),
  handleOrderExpired
);

router.post('/test-order-paid',
  validateWebhookData('order_paid'),
  handleOrderPaid
);

// ENDPOINT TEMPORÁRIO SEM AUTENTICAÇÃO - Para teste do Império
router.post('/temp-order-expired', 
  validateWebhookData('order_expired'),
  handleOrderExpired
);

// MINIMAL TEST - Debug the 500 error step by step
router.post('/minimal-order-expired', async (req, res) => {
  try {
    console.log('=== MINIMAL ORDER EXPIRED TEST ===');
    console.log('Body received:', JSON.stringify(req.body, null, 2));
    
    // Step 1: Validation check
    const { error } = webhookSchemas.order_expired.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation failed:', error.details);
      return res.status(400).json({ error: 'Validation failed', details: error.details });
    }
    console.log('✅ Validation passed');
    
    // Step 2: Data extraction
    const { data } = req.body;
    console.log('✅ Data extracted:', data);
    
    // Step 3: Template render test
    const { renderTemplate } = await import('../services/templates/renderer.js');
    const messageData = {
      user: data.user,
      product: data.product,
      quantity: data.quantity,
      total: data.total,
      expirationAt: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString('pt-BR') : null,
      id: data.id
    };
    console.log('✅ Message data created');
    
    const message = await renderTemplate('order_expired', messageData);
    console.log('✅ Template rendered, length:', message?.length);
    
    // Step 4: Queue manager test
    const { addMessageToQueue } = await import('../services/queue/manager.js');
    console.log('✅ Queue manager imported');
    
    res.json({
      success: true,
      message: 'All steps completed successfully',
      templateLength: message?.length,
      messageData: messageData
    });
    
  } catch (error) {
    console.error('❌ Minimal test failed:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
});

router.post('/temp-order-paid',
  validateWebhookData('order_paid'),
  handleOrderPaid
);

// Endpoint para receber cliques de botões da Evolution API
router.post('/button-click', handleButtonClick);

// Endpoint sem auth para teste de botões
router.post('/test-button-click', handleButtonClick);

export default router;