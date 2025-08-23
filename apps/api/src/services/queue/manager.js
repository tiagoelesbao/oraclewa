import Bull from 'bull';
import logger from '../../utils/logger.js';
import { processMessage } from './processors/messageProcessor.js';

const queues = {};

export const initializeQueues = async () => {
  try {
    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    };

    queues.messageQueue = new Bull('message-queue', redisConfig);
    queues.retryQueue = new Bull('retry-queue', redisConfig);

    queues.messageQueue.process(10, processMessage);

    queues.messageQueue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    queues.messageQueue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    queues.messageQueue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });

    await queues.messageQueue.isReady();
    await queues.retryQueue.isReady();

    logger.info('Message queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
};

export const addMessageToQueue = async (messageData, options = {}) => {
  try {
    // If SKIP_DB is true, process message directly without queue
    if (process.env.SKIP_DB === 'true') {
      logger.info('Processing message directly (SKIP_DB=true)');
      await processMessage({ data: messageData });
      return { id: 'direct-' + Date.now() };
    }
    
    const defaultOptions = {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    };

    const job = await queues.messageQueue.add(messageData, {
      ...defaultOptions,
      ...options
    });

    logger.info(`Message added to queue with job ID: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add message to queue:', error);
    throw error;
  }
};

export const getQueue = (queueName) => {
  return queues[queueName];
};

export const clearQueues = async () => {
  try {
    const results = {};
    
    // If SKIP_DB is true, no queues to clear
    if (process.env.SKIP_DB === 'true') {
      logger.info('SKIP_DB=true, no queues to clear');
      return { status: 'skipped', reason: 'SKIP_DB enabled' };
    }
    
    if (queues.messageQueue) {
      // Clear waiting jobs
      await queues.messageQueue.clean(0, 'waiting');
      // Clear delayed jobs  
      await queues.messageQueue.clean(0, 'delayed');
      // Clear active jobs
      await queues.messageQueue.clean(0, 'active');
      // Clear completed jobs
      await queues.messageQueue.clean(0, 'completed');
      // Clear failed jobs
      await queues.messageQueue.clean(0, 'failed');
      
      results.messageQueue = 'cleared';
      logger.info('✅ Message queue cleared');
    }
    
    if (queues.retryQueue) {
      await queues.retryQueue.clean(0, 'waiting');
      await queues.retryQueue.clean(0, 'delayed');
      await queues.retryQueue.clean(0, 'active');
      await queues.retryQueue.clean(0, 'completed');
      await queues.retryQueue.clean(0, 'failed');
      
      results.retryQueue = 'cleared';
      logger.info('✅ Retry queue cleared');
    }
    
    return results;
  } catch (error) {
    logger.error('Error clearing queues:', error);
    throw error;
  }
};

// Get pending webhook count for queue monitoring
export const getPendingWebhookCount = async () => {
  try {
    if (process.env.SKIP_DB === 'true') {
      return 0;
    }
    
    if (!queues.messageQueue) {
      return 0;
    }
    
    const waiting = await queues.messageQueue.getWaiting();
    const delayed = await queues.messageQueue.getDelayed();
    const active = await queues.messageQueue.getActive();
    
    return waiting.length + delayed.length + active.length;
  } catch (error) {
    logger.error('Error getting pending webhook count:', error);
    return 0;
  }
};

export default { initializeQueues, addMessageToQueue, getQueue, clearQueues, getPendingWebhookCount };