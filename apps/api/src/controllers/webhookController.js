import logger from '../utils/logger.js';
import { addMessageToQueue } from '../services/queue/manager.js';
import { renderTemplate } from '../services/templates/renderer.js';
import { handleButtonClick as processButtonClick } from '../services/templates/button-options.js';
import { sendMessage } from '../services/whatsapp/evolution-manager.js';

// Conditional import for WebhookLog
let WebhookLog;
if (process.env.SKIP_DB !== 'true') {
  WebhookLog = (await import('../database/models/WebhookLog.js')).default;
}

// Novos handlers para o sistema Império
export const handleOrderExpired = async (req, res) => {
  try {
    logger.info('=== ORDER EXPIRED WEBHOOK START ===');
    logger.info('Validated data:', JSON.stringify(req.validatedData, null, 2));
    
    const { data } = req.validatedData;
    logger.info('Extracted data:', JSON.stringify(data, null, 2));
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true' && WebhookLog) {
      logger.info('Attempting to log to database...');
      await WebhookLog.create({
        type: 'order_expired',
        payload: req.validatedData,
        status: 'processing'
      });
      logger.info('Database log successful');
    } else {
      logger.info('Skipping database log');
    }

    logger.info('Creating message data...');
    
    // Garantir que o total seja formatado corretamente
    let formattedTotal = data.total;
    if (typeof data.total === 'number') {
      formattedTotal = data.total.toFixed(2);
    } else if (typeof data.total === 'string' && data.total) {
      // Se veio como string, garantir formato correto
      const numericTotal = parseFloat(data.total.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numericTotal)) {
        formattedTotal = numericTotal.toFixed(2);
      }
    }
    
    const messageData = {
      user: data.user,
      product: data.product,
      quantity: data.quantity || 1,
      total: formattedTotal,
      pixCode: data.pixCode || '',
      expirationAt: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString('pt-BR') : null,
      affiliate: data.affiliate || 'A0RJJ5L1QK',
      id: data.id
    };
    logger.info('Message data created:', JSON.stringify(messageData, null, 2));
    
    logger.info('Rendering template...');
    const message = await renderTemplate('order_expired', messageData);
    logger.info('Template rendered successfully, message length:', message ? message.length : 0);
    
    // Apenas botão para acessar o site (recuperação de venda)
    const messageOptions = {
      buttons: [
        {
          type: 'url',
          displayText: 'Acessar Site',
          url: `https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK`
        }
      ]
    };

    logger.info('Adding message to queue...');
    logger.info('Phone number:', data.user.phone);
    
    await addMessageToQueue({
      phoneNumber: data.user.phone,
      message,
      messageOptions,
      type: 'order_expired',
      customerId: data.user.email || data.user.phone || data.id,
      metadata: {
        orderId: data.id,
        orderTotal: data.total,
        expiresAt: data.expirationAt,
        buttons: messageOptions.buttons,
        // ADD COMPLETE TEMPLATE DATA for messageProcessor  
        user: data.user,
        product: data.product,
        quantity: data.quantity || 1,
        total: formattedTotal,
        pixCode: data.pixCode || '',
        expirationAt: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString('pt-BR') : null,
        affiliate: data.affiliate || 'A0RJJ5L1QK',
        id: data.id,
        timestamp: new Date().toISOString() // Para verificar frescor da mensagem
      }
    }, {
      priority: 2,
      delay: 60000 // 1 minute delay
    });
    
    logger.info('Message added to queue successfully');

    logger.info('Order expired webhook processed', {
      orderId: data.id,
      customerId: data.user.email || data.user.phone
    });

    res.json({
      success: true,
      message: 'Webhook received and queued for processing'
    });
  } catch (error) {
    logger.error('Error processing order expired webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

export const handleOrderPaid = async (req, res) => {
  try {
    logger.info('=== ORDER PAID WEBHOOK START ===');
    logger.info('Validated data:', JSON.stringify(req.validatedData, null, 2));
    
    const { data } = req.validatedData;
    logger.info('Extracted data:', JSON.stringify(data, null, 2));
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true' && WebhookLog) {
      logger.info('Attempting to log to database...');
      await WebhookLog.create({
        type: 'order_paid',
        payload: req.validatedData,
        status: 'processing'
      });
      logger.info('Database log successful');
    } else {
      logger.info('Skipping database log');
    }

    logger.info('Creating message data...');
    
    // Garantir que o total seja formatado corretamente
    let formattedTotal = data.total;
    if (typeof data.total === 'number') {
      formattedTotal = data.total.toFixed(2);
    } else if (typeof data.total === 'string' && data.total) {
      // Se veio como string, garantir formato correto
      const numericTotal = parseFloat(data.total.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numericTotal)) {
        formattedTotal = numericTotal.toFixed(2);
      }
    }
    
    const messageData = {
      user: data.user,
      product: data.product,
      quantity: data.quantity || 1,
      total: formattedTotal,
      createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
      id: data.id
    };
    logger.info('Message data created:', JSON.stringify(messageData, null, 2));
    
    logger.info('Rendering template...');
    const message = await renderTemplate('order_paid', messageData);
    logger.info('Template rendered successfully, message length:', message ? message.length : 0);
    
    // Adicionar botão de resposta rápida
    const messageOptions = {
      replyButtons: [
        {
          id: 'confirm_receipt',
          title: 'Confirmar Recebimento'
        }
      ]
    };

    logger.info('Adding message to queue...');
    logger.info('Phone number:', data.user.phone);
    
    await addMessageToQueue({
      phoneNumber: data.user.phone,
      message,
      messageOptions,
      type: 'order_paid',
      customerId: data.user.email || data.user.phone || data.id,
      metadata: {
        orderId: data.id,
        orderTotal: data.total,
        replyButtons: messageOptions.replyButtons,
        timestamp: new Date().toISOString(), // Para verificar frescor da mensagem
        // DADOS COMPLETOS PARA TEMPLATE RENDERING
        user: data.user,
        product: data.product,
        quantity: data.quantity || 1,
        total: formattedTotal,
        createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        id: data.id
      }
    }, {
      priority: 3 // Highest priority
    });
    
    logger.info('Message added to queue successfully');

    logger.info('Order paid webhook processed', {
      orderId: data.id,
      customerId: data.user.email || data.user.phone
    });

    res.json({
      success: true,
      message: 'Webhook received and queued for processing'
    });
  } catch (error) {
    logger.error('Error processing order paid webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

// Handlers antigos (compatibilidade)

export const handleCarrinhoAbandonado = async (req, res) => {
  try {
    const { data } = req.validatedData;
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true') {
      await WebhookLog.create({
        type: 'carrinho_abandonado',
        payload: req.validatedData,
        status: 'processing'
      });
    }

    const message = await renderTemplate('carrinho_abandonado', {
      customerName: data.customer.name.split(' ')[0],
      cartTotal: data.cart.total.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      recoveryUrl: data.cart.recovery_url,
      items: data.cart.items
    });

    await addMessageToQueue({
      phoneNumber: data.customer.phone,
      message,
      type: 'carrinho_abandonado',
      customerId: data.customer.email,
      metadata: {
        cartId: data.cart.id,
        cartTotal: data.cart.total
      }
    }, {
      priority: 1,
      delay: 300000 // 5 minutes delay
    });

    logger.info('Carrinho abandonado webhook processed', {
      cartId: data.cart.id,
      customerId: data.customer.email
    });

    res.json({
      success: true,
      message: 'Webhook received and queued for processing'
    });
  } catch (error) {
    logger.error('Error processing carrinho abandonado webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

export const handleVendaExpirada = async (req, res) => {
  try {
    const { data } = req.validatedData;
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true') {
      await WebhookLog.create({
        type: 'venda_expirada',
        payload: req.validatedData,
        status: 'processing'
      });
    }

    const message = await renderTemplate('venda_expirada', {
      customerName: data.customer.name.split(' ')[0],
      orderTotal: data.order.total.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      paymentUrl: data.order.payment_url,
      expirationDate: new Date(data.order.expiration_date).toLocaleDateString('pt-BR')
    });

    await addMessageToQueue({
      phoneNumber: data.customer.phone,
      message,
      type: 'venda_expirada',
      customerId: data.customer.email,
      metadata: {
        orderId: data.order.id,
        orderTotal: data.order.total
      }
    }, {
      priority: 2 // Higher priority than abandoned cart
    });

    logger.info('Venda expirada webhook processed', {
      orderId: data.order.id,
      customerId: data.customer.email
    });

    res.json({
      success: true,
      message: 'Webhook received and queued for processing'
    });
  } catch (error) {
    logger.error('Error processing venda expirada webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

export const handleVendaAprovada = async (req, res) => {
  try {
    const { data } = req.validatedData;
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true') {
      await WebhookLog.create({
        type: 'venda_aprovada',
        payload: req.validatedData,
        status: 'processing'
      });
    }

    const message = await renderTemplate('venda_aprovada', {
      customerName: data.customer.name.split(' ')[0],
      orderId: data.order.id,
      orderTotal: data.order.total.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      items: data.order.items,
      trackingCode: data.order.tracking_code,
      estimatedDelivery: data.order.estimated_delivery 
        ? new Date(data.order.estimated_delivery).toLocaleDateString('pt-BR')
        : null
    });

    await addMessageToQueue({
      phoneNumber: data.customer.phone,
      message,
      type: 'venda_aprovada',
      customerId: data.customer.email,
      metadata: {
        orderId: data.order.id,
        orderTotal: data.order.total,
        trackingCode: data.order.tracking_code
      }
    }, {
      priority: 3 // Highest priority
    });

    logger.info('Venda aprovada webhook processed', {
      orderId: data.order.id,
      customerId: data.customer.email
    });

    res.json({
      success: true,
      message: 'Webhook received and queued for processing'
    });
  } catch (error) {
    logger.error('Error processing venda aprovada webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

// Handler para cliques de botões (Evolution API webhooks)
export const handleButtonClick = async (req, res) => {
  try {
    logger.info('=== BUTTON CLICK WEBHOOK START ===');
    logger.info('Button click data:', JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    
    // Extrair informações do clique do botão (Evolution API v1.7.1)
    const buttonId = data?.message?.buttonsResponseMessage?.selectedButtonId || 
                     data?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
                     data?.selectedButtonId ||
                     data?.buttonId;
    
    // Extrair número de telefone do formato Evolution API v1.7.1
    let phoneNumber = data?.key?.remoteJid || data?.from || data?.phoneNumber;
    if (phoneNumber && phoneNumber.includes('@s.whatsapp.net')) {
      phoneNumber = phoneNumber.replace('@s.whatsapp.net', '');
    }
    const messageType = data?.messageType || 'unknown';
    
    if (!buttonId || !phoneNumber) {
      logger.warn('Missing buttonId or phoneNumber in button click webhook');
      return res.status(400).json({
        error: 'Missing required fields: buttonId or phoneNumber'
      });
    }
    
    logger.info(`Button clicked: ${buttonId} by ${phoneNumber}`);
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true' && WebhookLog) {
      await WebhookLog.create({
        type: 'button_click',
        payload: req.body,
        status: 'processing'
      });
    }
    
    // Processar clique do botão
    const buttonResponse = await processButtonClick(buttonId, phoneNumber, messageType);
    
    // Se há uma resposta automática, enviar mensagem
    if (buttonResponse.message && buttonResponse.action !== 'redirect') {
      await sendMessage(phoneNumber, buttonResponse.message);
      logger.info(`Sent automatic response for button click: ${buttonId}`);
    }
    
    // Log específico para redirecionamentos de comunidade
    if (buttonResponse.action === 'redirect' && buttonId === 'join_community') {
      logger.info(`User ${phoneNumber} redirected to community via button click`);
    }
    
    res.json({
      success: true,
      action: buttonResponse.action,
      message: 'Button click processed successfully'
    });
    
  } catch (error) {
    logger.error('Error processing button click webhook:', error);
    res.status(500).json({
      error: 'Failed to process button click'
    });
  }
};