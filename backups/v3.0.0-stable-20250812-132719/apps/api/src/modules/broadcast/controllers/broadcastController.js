import { getBroadcastProviderSelector, BROADCAST_PROVIDERS } from '../services/provider-selector.js';
import { getBroadcastTemplateWithButtons, listBroadcastTemplates, validateTemplateData } from '../templates/broadcast-templates.js';
import { getEvolutionTemplateWithCTAs, listEvolutionTemplates, validateEvolutionTemplateData } from '../templates/evolution-templates.js';
import logger from '../../../utils/logger.js';

// Send single message with buttons
export const sendMessage = async (req, res) => {
  try {
    logger.info('=== BROADCAST SEND MESSAGE START ===');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    const { phone, message, buttons = [], provider = null } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        error: 'Phone and message are required'
      });
    }

    const providerSelector = await getBroadcastProviderSelector();
    
    const result = await providerSelector.sendMessage(phone, message, {
      buttons,
      provider
    });

    logger.info('Message sent successfully:', result);

    res.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider || provider || 'auto-selected',
      hasButtons: buttons.length > 0,
      providerUsed: provider ? 'requested' : 'auto-selected'
    });
  } catch (error) {
    logger.error('Error sending broadcast message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
};

// Send broadcast to multiple phones
export const sendBroadcast = async (req, res) => {
  try {
    logger.info('=== BROADCAST SEND MULTIPLE START ===');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      phones, 
      message, 
      buttons = [], 
      template = null,
      templateData = {},
      options = {} 
    } = req.body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({
        error: 'Phones array is required and must not be empty'
      });
    }

    if (!message && !template) {
      return res.status(400).json({
        error: 'Either message or template is required'
      });
    }

    const providerSelector = await getBroadcastProviderSelector();
    
    // Get provider manager for validation
    const providerManager = await providerSelector.getProviderManager(provider);
    
    // Validate phone numbers
    const { validPhones, invalidPhones } = await providerManager.validatePhoneNumbers(phones);
    
    if (validPhones.length === 0) {
      return res.status(400).json({
        error: 'No valid phone numbers provided',
        invalidPhones
      });
    }

    let finalMessage = message;
    let finalButtons = buttons;

    // If using template
    if (template) {
      try {
        validateTemplateData(template, templateData);
        const templateObj = getBroadcastTemplateWithButtons(template);
        finalMessage = templateObj.compile(templateData);
        finalButtons = templateObj.buttons;
      } catch (templateError) {
        return res.status(400).json({
          error: 'Template error',
          details: templateError.message
        });
      }
    }

    // Send broadcast
    const result = await providerSelector.sendBroadcast(validPhones, finalMessage, {
      buttons: finalButtons,
      provider,
      ...options
    });

    logger.info('Broadcast completed:', result);

    res.json({
      success: true,
      summary: {
        total: phones.length,
        validPhones: validPhones.length,
        invalidPhones: invalidPhones.length,
        sent: result.sent,
        failed: result.failed
      },
      invalidPhones,
      provider: 'zapi',
      template: template || null,
      hasButtons: finalButtons.length > 0
    });
  } catch (error) {
    logger.error('Error sending broadcast:', error);
    res.status(500).json({
      error: 'Failed to send broadcast',
      details: error.message
    });
  }
};

// Send template message
export const sendTemplate = async (req, res) => {
  try {
    logger.info('=== BROADCAST SEND TEMPLATE START ===');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    const { phone, template, data = {} } = req.body;

    if (!phone || !template) {
      return res.status(400).json({
        error: 'Phone and template are required'
      });
    }

    try {
      validateTemplateData(template, data);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Template validation failed',
        details: validationError.message
      });
    }

    const zapiManager = await getZapiManager();
    const result = await zapiManager.sendTemplateMessage(phone, template, data);

    logger.info('Template message sent successfully:', result);

    res.json({
      success: true,
      messageId: result.messageId,
      template,
      provider: 'zapi'
    });
  } catch (error) {
    logger.error('Error sending template message:', error);
    res.status(500).json({
      error: 'Failed to send template message',
      details: error.message
    });
  }
};

// List available templates
export const getTemplates = async (req, res) => {
  try {
    const templates = listBroadcastTemplates();
    
    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Error listing templates:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      details: error.message
    });
  }
};

// Get broadcast status
export const getStatus = async (req, res) => {
  try {
    const providerSelector = await getBroadcastProviderSelector();
    const status = await providerSelector.getStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting broadcast status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      details: error.message
    });
  }
};

// Handle ZAPI webhooks
export const handleWebhook = async (req, res) => {
  try {
    logger.info('=== ZAPI WEBHOOK RECEIVED ===');
    logger.info('Webhook data:', JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    
    // Process different webhook events
    if (data?.message?.buttonsResponseMessage) {
      // Button click event
      const buttonId = data.message.buttonsResponseMessage.selectedButtonId;
      const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
      
      logger.info(`Button clicked: ${buttonId} by ${phoneNumber}`);
      
      // Process button click
      await processButtonClick(buttonId, phoneNumber, data);
    } else if (data?.message?.conversation) {
      // Text message received
      const messageText = data.message.conversation;
      const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
      
      logger.info(`Message received: "${messageText}" from ${phoneNumber}`);
      
      // Process text message (could be response to button)
      await processTextMessage(messageText, phoneNumber, data);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Error processing ZAPI webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error.message
    });
  }
};

// Process button clicks
const processButtonClick = async (buttonId, phoneNumber, data) => {
  try {
    const zapiManager = await getZapiManager();
    
    switch (buttonId) {
      case 'buy_now':
        await zapiManager.sendMessage(phoneNumber, 
          '🛒 Redirecionando você para a compra...\n\nhttps://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK'
        );
        break;
        
      case 'more_info':
        await zapiManager.sendMessage(phoneNumber,
          '📋 *INFORMAÇÕES DETALHADAS*\n\n🏆 Prêmio: R$ 170.000,00\n🎯 Sorteio: Loteria Federal\n📅 Data: Em breve\n\n📞 Dúvidas? Responda esta mensagem!'
        );
        break;
        
      case 'join_community':
        await zapiManager.sendMessage(phoneNumber,
          '👥 *COMUNIDADE VIP IMPÉRIO*\n\n🔗 Entre no nosso grupo:\nhttps://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n✨ Novidades em primeira mão!'
        );
        break;
        
      case 'complete_purchase':
        await zapiManager.sendMessage(phoneNumber,
          '✅ *FINALIZAR COMPRA*\n\n🔗 Complete sua compra agora:\nhttps://imperiopremioss.com/checkout\n\n⏰ Não perca suas cotas!'
        );
        break;
        
      default:
        logger.info(`Unhandled button: ${buttonId}`);
        await zapiManager.sendMessage(phoneNumber,
          '👋 Obrigado pela interação! Em breve entraremos em contato.'
        );
    }
    
    // Log interaction for analytics
    logger.info('Button interaction processed', {
      buttonId,
      phoneNumber: phoneNumber.slice(0, -4) + '****',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing button click:', error);
  }
};

// Process text messages
const processTextMessage = async (messageText, phoneNumber, data) => {
  try {
    const zapiManager = await getZapiManager();
    const lowerText = messageText.toLowerCase().trim();
    
    // Auto-responses based on keywords
    if (lowerText.includes('info') || lowerText.includes('informação')) {
      await zapiManager.sendMessage(phoneNumber,
        '📋 *INFORMAÇÕES IMPÉRIO PREMIAÇÕES*\n\n🏆 Sorteios pela Loteria Federal\n💰 Prêmios de até R$ 170.000\n🎯 Transparência total\n\n🔗 Site: https://imperiopremioss.com'
      );
    } else if (lowerText.includes('comprar') || lowerText.includes('participar')) {
      await zapiManager.sendMessage(phoneNumber,
        '🛒 *QUERO PARTICIPAR*\n\n🔗 Acesse nosso site:\nhttps://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK\n\n🍀 Boa sorte!'
      );
    } else if (lowerText.includes('grupo') || lowerText.includes('comunidade')) {
      await zapiManager.sendMessage(phoneNumber,
        '👥 *COMUNIDADE VIP*\n\n🔗 Entre no grupo:\nhttps://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n✨ Seja bem-vindo(a)!'
      );
    }
    
    // Log for analytics
    logger.info('Text message processed', {
      messageLength: messageText.length,
      phoneNumber: phoneNumber.slice(0, -4) + '****',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing text message:', error);
  }
};

// Get available providers
export const getProviders = async (req, res) => {
  try {
    const providerSelector = await getBroadcastProviderSelector();
    const providers = providerSelector.getAvailableProviders();
    
    res.json({
      success: true,
      providers,
      count: providers.length,
      default: providerSelector.defaultProvider
    });
  } catch (error) {
    logger.error('Error getting providers:', error);
    res.status(500).json({
      error: 'Failed to get providers',
      details: error.message
    });
  }
};

// Get provider recommendation
export const getProviderRecommendation = async (req, res) => {
  try {
    const { needsButtons, budget, messageVolume, features } = req.query;
    
    const requirements = {
      needsButtons: needsButtons === 'true',
      budget: budget || 'low',
      messageVolume: messageVolume || 'medium',
      features: features ? features.split(',') : []
    };

    const providerSelector = await getBroadcastProviderSelector();
    const recommendation = providerSelector.recommendProvider(requirements);
    
    res.json({
      success: true,
      recommendation,
      requirements
    });
  } catch (error) {
    logger.error('Error getting provider recommendation:', error);
    res.status(500).json({
      error: 'Failed to get recommendation',
      details: error.message
    });
  }
};

// Calculate costs
export const calculateCosts = async (req, res) => {
  try {
    const { messageCount = 0, provider = null } = req.query;
    
    const providerSelector = await getBroadcastProviderSelector();
    const costs = providerSelector.calculateMonthlyCost(parseInt(messageCount), provider);
    
    res.json({
      success: true,
      costs,
      messageCount: parseInt(messageCount),
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error calculating costs:', error);
    res.status(500).json({
      error: 'Failed to calculate costs',
      details: error.message
    });
  }
};

// Get all templates (both ZAPI and Evolution)
export const getAllTemplates = async (req, res) => {
  try {
    const { provider = 'all' } = req.query;
    
    const templates = {
      zapi: [],
      evolution: [],
      combined: []
    };

    // Get ZAPI templates
    if (provider === 'all' || provider === 'zapi') {
      templates.zapi = listBroadcastTemplates();
    }

    // Get Evolution templates
    if (provider === 'all' || provider === 'evolution') {
      templates.evolution = listEvolutionTemplates();
    }

    // Combined list
    if (provider === 'all') {
      templates.combined = [...templates.zapi, ...templates.evolution];
    }
    
    res.json({
      success: true,
      templates: provider === 'all' ? templates : templates[provider] || [],
      provider,
      count: {
        zapi: templates.zapi.length,
        evolution: templates.evolution.length,
        total: templates.zapi.length + templates.evolution.length
      }
    });
  } catch (error) {
    logger.error('Error listing all templates:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      details: error.message
    });
  }
};

export default {
  sendMessage,
  sendBroadcast,
  sendTemplate,
  getTemplates,
  getAllTemplates,
  getStatus,
  getProviders,
  getProviderRecommendation,
  calculateCosts,
  handleWebhook
};