import axios from 'axios';
import logger from '../../utils/logger.js';
import { getRedisClient } from '../redis/client.js';
import warmupManager from './warmup-manager.js';

const instances = [];
let currentInstanceIndex = 0;

// Função para detectar quais instâncias estão realmente funcionando
const getWorkingInstances = async (client, potentialInstances) => {
  const workingInstances = [];
  
  logger.info('🔍 Detectando instâncias funcionais...');
  
  for (const instanceName of potentialInstances) {
    try {
      const response = await client.get(`/instance/connectionState/${instanceName}`);
      const state = response.data?.instance?.state;
      
      if (state === 'open') {
        workingInstances.push(instanceName);
        logger.info(`✅ ${instanceName}: Conectada e funcionando`);
      } else {
        logger.warn(`⚠️ ${instanceName}: Estado ${state || 'desconhecido'}`);
      }
    } catch (error) {
      logger.error(`❌ ${instanceName}: Erro ao verificar - ${error.message}`);
    }
  }
  
  if (workingInstances.length === 0) {
    logger.error('🚨 NENHUMA INSTÂNCIA FUNCIONANDO! Usando todas mesmo assim...');
    return potentialInstances; // Fallback
  }
  
  logger.info(`🎯 Usando ${workingInstances.length} instância(s): ${workingInstances.join(', ')}`);
  return workingInstances;
};

export const initializeWhatsAppInstances = async () => {
  try {
    // Configuração para Evolution API unificada
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    
    // Cliente axios único para Evolution API
    const evolutionClient = axios.create({
      baseURL: evolutionUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      timeout: 30000
    });

    // Detectar automaticamente instâncias funcionais
    // Começamos com todas as disponíveis e filtramos as que funcionam
    const potentialInstances = ['imperio1', 'imperio3'];
    const instanceNames = await getWorkingInstances(evolutionClient, potentialInstances);

    for (const instanceName of instanceNames) {
      try {
        const instance = {
          id: instanceName,
          name: instanceName,
          client: evolutionClient,
          status: 'initializing',
          messageCount: 0,
          lastMessageTime: null
        };

        instances.push(instance);
        logger.info(`WhatsApp instance ${instanceName} configured`);
      } catch (error) {
        logger.error(`Failed to initialize instance ${instanceName}:`, error);
      }
    }

    await checkInstancesStatus();
    setInterval(checkInstancesStatus, 60000); // Check every minute
    setInterval(resetMessageCounts, 3600000); // Reset counts every hour

    // Log especial para operação com poucos números
    if (instances.length === 1) {
      logger.info(`🎯 MODO NÚMERO ÚNICO ATIVADO - Usando apenas: ${instances[0].name}`);
      logger.info('🛡️ Anti-ban ativo: delays, rate limiting e variações de mensagem');
    } else {
      logger.info(`Evolution API instances initialized - Total: ${instances.length}`);
    }
  } catch (error) {
    logger.error('Failed to initialize Evolution API instances:', error);
    throw error;
  }
};

const checkInstancesStatus = async () => {
  for (const instance of instances) {
    try {
      const response = await instance.client.get(`/instance/connectionState/${instance.name}`);
      const state = response.data?.instance?.state;
      
      instance.status = state === 'open' ? 'connected' : 'disconnected';
      
      if (instance.status === 'disconnected') {
        logger.warn(`Instance ${instance.name} is disconnected`);
        // Tentar reconectar automaticamente
        try {
          await instance.client.get(`/instance/connect/${instance.name}`);
          logger.info(`Attempting to reconnect ${instance.name}`);
        } catch (reconnectError) {
          logger.error(`Failed to reconnect ${instance.name}:`, reconnectError.message);
        }
      }
    } catch (error) {
      instance.status = 'error';
      logger.error(`Failed to check status for instance ${instance.name}:`, error.message);
    }
  }
};

const resetMessageCounts = () => {
  for (const instance of instances) {
    instance.messageCount = 0;
    logger.info(`Reset message count for instance ${instance.name}`);
  }
};

export const getNextAvailableInstance = async () => {
  const redis = process.env.SKIP_DB !== 'true' ? getRedisClient() : null;
  
  let attempts = 0;
  while (attempts < instances.length) {
    const instance = instances[currentInstanceIndex];
    currentInstanceIndex = (currentInstanceIndex + 1) % instances.length;
    
    // Verificar se pode enviar mensagem (limites e horários)
    const canSend = await warmupManager.canSendMessage(instance.name);
    
    if (instance.status === 'connected' && canSend) {
      instance.messageCount++;
      instance.lastMessageTime = new Date();
      
      // Registrar mensagem enviada
      await warmupManager.recordMessageSent(instance.name);
      
      // Only update Redis stats if available
      if (process.env.SKIP_DB !== 'true' && redis) {
        await redis.hincrby('instance_stats', instance.name, 1);
      }
      
      return instance;
    }
    
    attempts++;
  }
  
  throw new Error('No available WhatsApp instances - all at limit or outside business hours');
};

export const sendMessage = async (phoneNumber, message, instanceName = null, messageOptions = null) => {
  try {
    // VERIFICAR HORÁRIO COMERCIAL E LIMITES PRIMEIRO
    const targetInstance = instanceName || 'imperio1';
    const canSend = await warmupManager.canSendMessage(targetInstance);
    if (!canSend) {
      logger.warn(`🚫 Cannot send message - blocked by warmup manager (business hours/limits)`);
      return {
        success: false,
        reason: 'warmup_blocked',
        message: 'Message blocked by business hours or rate limits'
      };
    }
    
    // Verificar se pode enviar para este destinatário
    const canMessage = await warmupManager.canMessageRecipient(phoneNumber);
    if (!canMessage) {
      logger.warn(`Skipping message to ${phoneNumber} - contacted recently`);
      return {
        success: false,
        reason: 'recipient_cooldown',
        message: 'Recipient contacted in the last 24 hours'
      };
    }
    
    // Aguardar delay recomendado
    const delay = await warmupManager.getRecommendedDelay(instanceName || 'any');
    if (delay > 0) {
      logger.info(`Waiting ${Math.round(delay/1000)}s before sending message...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    let instance;
    
    if (instanceName) {
      instance = instances.find(i => i.name === instanceName);
      if (!instance) {
        throw new Error(`Instance ${instanceName} not found`);
      }
    } else {
      instance = await getNextAvailableInstance();
    }
    
    // Formatar número para padrão brasileiro com logs detalhados
    logger.info(`Original phone number: ${phoneNumber}`);
    
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    logger.info(`After removing non-digits: ${formattedPhone}`);
    
    // Adicionar código do país se não tiver
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    logger.info(`Final formatted phone: ${formattedPhone}`);
    
    let response;
    
    // Verificar se deve enviar mensagem com botões
    // SOLUÇÃO: Botões interativos do Evolution API (Baileys) não chegam no celular
    // Usando mensagem de texto otimizada com links e CTAs claros
    if (messageOptions?.buttons && messageOptions.buttons.length > 0) {
      // Converter botões para mensagem de texto otimizada
      let enhancedMessage = message + '\n\n';
      
      // Adicionar seção de ações
      enhancedMessage += '🎯 *PRÓXIMOS PASSOS:*\n\n';
      
      messageOptions.buttons.forEach((button, index) => {
        if (button.id === 'join_community') {
          enhancedMessage += '🔗 *ENTRE NA NOSSA COMUNIDADE VIP*\n';
          enhancedMessage += 'Acesse o link abaixo para participar:\n';
          enhancedMessage += '👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n';
        } else if (button.id === 'confirm_receipt') {
          enhancedMessage += '✅ *CONFIRME SEU RECEBIMENTO*\n';
          enhancedMessage += 'Responda com *"OK"* para confirmar\n\n';
        }
      });
      
      // Adicionar rodapé motivacional
      enhancedMessage += '🍀 *Boa sorte no sorteio!*\n';
      enhancedMessage += '📱 Salve nosso contato para atualizações\n\n';
      enhancedMessage += '_Império Premiações - Realizando sonhos_ 🏆';
      
      // Enviar como mensagem de texto otimizada (Evolution API v2 format)
      response = await instance.client.post('/message/sendText/' + instance.name, {
        number: formattedPhone,
        text: enhancedMessage
      });
      
      logger.info(`Enhanced text message sent successfully via ${instance.name} to ${phoneNumber}`, {
        buttonCount: messageOptions.buttons.length,
        format: 'enhanced_text_message',
        note: 'Interactive buttons not supported by Baileys - using optimized text format'
      });
    } else if (messageOptions?.listMessage) {
      // Enviar mensagem de lista usando Evolution API v1.7.1
      response = await instance.client.post('/message/sendList/' + instance.name, {
        number: formattedPhone,
        listMessage: messageOptions.listMessage
      });
      
      logger.info(`List message sent successfully via ${instance.name} to ${phoneNumber}`, {
        sections: messageOptions.listMessage.sections?.length || 0,
        format: 'v1.7.1_listMessage'
      });
    } else {
      // Mensagem de texto simples (Evolution API v2 format)
      response = await instance.client.post('/message/sendText/' + instance.name, {
        number: formattedPhone,
        text: message
      });
      
      logger.info(`Text message sent successfully via ${instance.name} to ${phoneNumber}`);
    }
    
    // Registrar mensagem enviada (para controle consecutivo e contadores)
    await warmupManager.recordMessageSent(instance.name);
    
    // Registrar contato com destinatário
    await warmupManager.recordRecipientContact(phoneNumber);
    
    logger.info(`Message sent successfully via ${instance.name} to ${phoneNumber}`, {
      hasButtons: !!(messageOptions?.buttons || messageOptions?.replyButtons)
    });
    
    return {
      success: true,
      instanceName: instance.name,
      messageId: response.data?.key?.id || response.data?.id,
      response: response.data
    };
  } catch (error) {
    logger.error('Failed to send message:', error);
    throw error;
  }
};

export const sendMessageWithMedia = async (phoneNumber, message, mediaUrl, instanceName = null) => {
  try {
    let instance;
    
    if (instanceName) {
      instance = instances.find(i => i.name === instanceName);
      if (!instance) {
        throw new Error(`Instance ${instanceName} not found`);
      }
    } else {
      instance = await getNextAvailableInstance();
    }
    
    logger.info(`Original phone number (media): ${phoneNumber}`);
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    logger.info(`After removing non-digits (media): ${formattedPhone}`);
    
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    logger.info(`Final formatted phone (media): ${formattedPhone}`);
    
    const response = await instance.client.post('/message/sendMedia/' + instance.name, {
      number: formattedPhone,
      mediaMessage: {
        mediatype: 'image',
        media: mediaUrl,
        caption: message
      }
    });
    
    logger.info(`Media message sent successfully via ${instance.name} to ${phoneNumber}`);
    return {
      success: true,
      instanceName: instance.name,
      messageId: response.data?.key?.id || response.data?.id,
      response: response.data
    };
  } catch (error) {
    logger.error('Failed to send media message:', error);
    throw error;
  }
};

export const getInstancesStatus = () => {
  return instances.map(instance => ({
    name: instance.name,
    status: instance.status,
    messageCount: instance.messageCount,
    lastMessageTime: instance.lastMessageTime
  }));
};

export const getQRCode = async (instanceName) => {
  try {
    const instance = instances.find(i => i.name === instanceName);
    if (!instance) {
      throw new Error(`Instance ${instanceName} not found`);
    }
    
    const response = await instance.client.get(`/instance/connect/${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to get QR code for ${instanceName}:`, error);
    throw error;
  }
};

export default {
  initializeWhatsAppInstances,
  sendMessage,
  sendMessageWithMedia,
  getNextAvailableInstance,
  getInstancesStatus,
  getQRCode
};