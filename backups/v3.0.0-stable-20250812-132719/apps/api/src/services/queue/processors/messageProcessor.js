import logger from '../../../utils/logger.js';
import { sendMessage } from '../../whatsapp/evolution-manager.js';
import TypingSimulator from '../../whatsapp/typing-simulator.js';
import { renderTemplateWithButtons } from '../../templates/renderer.js';

export const processMessage = async (job) => {
  const { phoneNumber, message, messageOptions, type, customerId, metadata } = job.data;
  
  try {
    // 🕘 VERIFICAR FRESCOR DA MENSAGEM (lead quente)
    const messageAge = metadata?.timestamp ? Date.now() - new Date(metadata.timestamp).getTime() : 0;
    const MAX_MESSAGE_AGE = 4 * 60 * 60 * 1000; // 4 horas máximo
    
    if (messageAge > MAX_MESSAGE_AGE) {
      logger.warn(`🗑️ Mensagem muito antiga (${Math.round(messageAge / 60000)} min) - descartando para manter lead quente`, {
        type,
        phoneNumber: phoneNumber.slice(0, -4) + '****',
        ageMinutes: Math.round(messageAge / 60000)
      });
      return {
        success: false,
        reason: 'message_too_old',
        message: 'Message discarded - lead no longer fresh'
      };
    }
    
    logger.info(`🤖 Processing message with HUMAN SIMULATION`, {
      type,
      phoneNumber: phoneNumber.slice(0, -4) + '****',
      messageLength: message.length,
      ageMinutes: Math.round(messageAge / 60000),
      hasButtons: !!(messageOptions?.buttons || messageOptions?.replyButtons)
    });
    
    // SIMULAÇÃO DE COMPORTAMENTO HUMANO
    const isTemplate = TypingSimulator.isTemplateMessage(message);
    const shouldSimulate = process.env.DISABLE_TYPING_SIMULATION !== 'true';
    
    if (shouldSimulate) {
      logger.info(`✍️ Iniciando simulação de digitação humana...`);
      await TypingSimulator.simulateTyping(message, phoneNumber);
    } else {
      logger.info(`⚡ Simulação desabilitada - enviando diretamente`);
    }
    
    let result;
    
    // Se há tipo de template especificado, renderizar com botões
    if (type === 'order_paid') {
      try {
        const templateData = metadata || {};
        const templateResult = await renderTemplateWithButtons(type, templateData);
        
        if (templateResult.buttonOptions) {
          // Enviar mensagem com botões interativos
          result = await sendMessage(phoneNumber, templateResult.message, null, templateResult.buttonOptions);
          logger.info(`Sent ${type} message with interactive buttons`);
        } else {
          // Fallback para mensagem de texto
          result = await sendMessage(phoneNumber, templateResult.message);
        }
      } catch (templateError) {
        logger.warn(`Template rendering failed, using original message: ${templateError.message}`);
        result = await sendMessage(phoneNumber, message);
      }
    } else if (messageOptions?.buttons || messageOptions?.replyButtons) {
      // Se há botões ou opções especiais, usar função apropriada
      result = await sendMessage(phoneNumber, message, null, messageOptions);
    } else {
      result = await sendMessage(phoneNumber, message);
    }
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true') {
      // TODO: Re-enable when database is available
      logger.info('Skipping message log (SKIP_DB=true)');
    }
    
    logger.info(`Message sent successfully for job ${job.id}`);
    return result;
  } catch (error) {
    logger.error(`Failed to process message job ${job.id}:`, error);
    
    // Skip database logging if SKIP_DB is true
    if (process.env.SKIP_DB !== 'true') {
      // TODO: Re-enable when database is available
      logger.error('Skipping error log (SKIP_DB=true)');
    }
    
    throw error;
  }
};