import axios from 'axios';
import logger from '../../utils/logger.js';
import { getRedisClient } from '../redis/client.js';

const instances = [];
let currentInstanceIndex = 0;

export const initializeWhatsAppInstances = async () => {
  try {
    const instanceConfigs = [
      {
        id: 'instance-1',
        url: `${process.env.EVOLUTION_API_URL}:${process.env.EVOLUTION_INSTANCE_1_PORT}`,
        apiKey: process.env.EVOLUTION_API_KEY_1,
        port: process.env.EVOLUTION_INSTANCE_1_PORT
      },
      {
        id: 'instance-2',
        url: `${process.env.EVOLUTION_API_URL}:${process.env.EVOLUTION_INSTANCE_2_PORT}`,
        apiKey: process.env.EVOLUTION_API_KEY_2,
        port: process.env.EVOLUTION_INSTANCE_2_PORT
      },
      {
        id: 'instance-3',
        url: `${process.env.EVOLUTION_API_URL}:${process.env.EVOLUTION_INSTANCE_3_PORT}`,
        apiKey: process.env.EVOLUTION_API_KEY_3,
        port: process.env.EVOLUTION_INSTANCE_3_PORT
      },
      {
        id: 'instance-4',
        url: `${process.env.EVOLUTION_API_URL}:${process.env.EVOLUTION_INSTANCE_4_PORT}`,
        apiKey: process.env.EVOLUTION_API_KEY_4,
        port: process.env.EVOLUTION_INSTANCE_4_PORT
      }
    ];

    for (const config of instanceConfigs) {
      try {
        const instance = {
          ...config,
          client: axios.create({
            baseURL: config.url,
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.apiKey
            },
            timeout: 30000
          }),
          status: 'initializing',
          messageCount: 0,
          lastMessageTime: null
        };

        instances.push(instance);
        logger.info(`WhatsApp instance ${config.id} configured`);
      } catch (error) {
        logger.error(`Failed to initialize instance ${config.id}:`, error);
      }
    }

    await checkInstancesStatus();
    setInterval(checkInstancesStatus, 60000); // Check every minute
    setInterval(resetMessageCounts, 3600000); // Reset counts every hour

    logger.info('WhatsApp instances initialized');
  } catch (error) {
    logger.error('Failed to initialize WhatsApp instances:', error);
    throw error;
  }
};

const checkInstancesStatus = async () => {
  for (const instance of instances) {
    try {
      const response = await instance.client.get('/instance/connectionState');
      instance.status = response.data.state === 'open' ? 'connected' : 'disconnected';
      
      if (instance.status === 'disconnected') {
        logger.warn(`Instance ${instance.id} is disconnected`);
      }
    } catch (error) {
      instance.status = 'error';
      logger.error(`Failed to check status for instance ${instance.id}:`, error.message);
    }
  }
};

const resetMessageCounts = () => {
  for (const instance of instances) {
    instance.messageCount = 0;
    logger.info(`Reset message count for instance ${instance.id}`);
  }
};

export const getNextAvailableInstance = async () => {
  const redis = getRedisClient();
  const rateLimit = parseInt(process.env.RATE_LIMIT_PER_INSTANCE || '500');
  
  let attempts = 0;
  while (attempts < instances.length) {
    const instance = instances[currentInstanceIndex];
    currentInstanceIndex = (currentInstanceIndex + 1) % instances.length;
    
    if (instance.status === 'connected' && instance.messageCount < rateLimit) {
      instance.messageCount++;
      instance.lastMessageTime = new Date();
      
      await redis.hincrby('instance_stats', instance.id, 1);
      
      return instance;
    }
    
    attempts++;
  }
  
  throw new Error('No available WhatsApp instances');
};

export const sendMessage = async (phoneNumber, message, instanceId = null) => {
  try {
    let instance;
    
    if (instanceId) {
      instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }
    } else {
      instance = await getNextAvailableInstance();
    }
    
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    const response = await instance.client.post('/message/sendText', {
      number: formattedPhone,
      text: message
    });
    
    logger.info(`Message sent successfully via ${instance.id} to ${phoneNumber}`);
    return {
      success: true,
      instanceId: instance.id,
      messageId: response.data.key?.id,
      response: response.data
    };
  } catch (error) {
    logger.error('Failed to send message:', error);
    throw error;
  }
};

export const getInstancesStatus = () => {
  return instances.map(instance => ({
    id: instance.id,
    status: instance.status,
    messageCount: instance.messageCount,
    lastMessageTime: instance.lastMessageTime,
    port: instance.port
  }));
};

export default {
  initializeWhatsAppInstances,
  sendMessage,
  getNextAvailableInstance,
  getInstancesStatus
};