import Bull from 'bull';
import logger from '../../utils/logger.js';
import { processMessage } from './processors/messageProcessor.js';

const queues = {};

// In-memory queue for tracking pending messages when Redis is not available
class InMemoryQueue {
  constructor() {
    this.pendingMessages = [];
    this.processingMessages = new Set();
    this.completedCount = 0;
    this.failedCount = 0;
  }

  async add(message) {
    const job = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      data: message,
      createdAt: new Date(),
      status: 'pending'
    };
    this.pendingMessages.push(job);
    logger.info(`📥 Message added to in-memory queue: ${job.id}`);
    return job;
  }

  async getPendingCount() {
    return this.pendingMessages.length + this.processingMessages.size;
  }

  async processPending() {
    if (this.pendingMessages.length === 0) return null;
    
    const job = this.pendingMessages.shift();
    if (job) {
      this.processingMessages.add(job.id);
      job.status = 'processing';
    }
    return job;
  }

  async completeJob(jobId) {
    this.processingMessages.delete(jobId);
    this.completedCount++;
    logger.info(`✅ Job ${jobId} completed (total: ${this.completedCount})`);
  }

  async failJob(jobId) {
    this.processingMessages.delete(jobId);
    this.failedCount++;
    logger.error(`❌ Job ${jobId} failed (total: ${this.failedCount})`);
  }

  async clear() {
    const count = this.pendingMessages.length;
    this.pendingMessages = [];
    this.processingMessages.clear();
    logger.info(`🗑️ Cleared ${count} pending messages from in-memory queue`);
    return count;
  }

  getStats() {
    return {
      pending: this.pendingMessages.length,
      processing: this.processingMessages.size,
      completed: this.completedCount,
      failed: this.failedCount,
      total: this.pendingMessages.length + this.processingMessages.size
    };
  }
}

// Global in-memory queue instance
const inMemoryQueue = new InMemoryQueue();

export const initializeQueues = async () => {
  try {
    // Try to use Redis if available
    if (process.env.SKIP_DB !== 'true') {
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

        logger.info('✅ Redis queues initialized successfully');
      } catch (redisError) {
        logger.warn('⚠️ Redis not available, using in-memory queue:', redisError.message);
        // Redis failed, we'll use in-memory queue
      }
    } else {
      logger.info('📝 SKIP_DB=true, using in-memory queue');
    }

    // Start in-memory queue processor
    startInMemoryProcessor();
    
    logger.info('✅ Queue system initialized (in-memory mode)');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
};

// Process messages from in-memory queue
const startInMemoryProcessor = () => {
  setInterval(async () => {
    const job = await inMemoryQueue.processPending();
    if (job) {
      try {
        await processMessage(job);
        await inMemoryQueue.completeJob(job.id);
      } catch (error) {
        logger.error(`Failed to process job ${job.id}:`, error);
        await inMemoryQueue.failJob(job.id);
      }
    }
  }, 1000); // Check every second
};

export const addMessageToQueue = async (messageData, options = {}) => {
  try {
    // Always use in-memory queue for tracking
    const job = await inMemoryQueue.add(messageData);
    
    // If Redis queue is available, also add to it
    if (queues.messageQueue && process.env.SKIP_DB !== 'true') {
      try {
        const defaultOptions = {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        };

        await queues.messageQueue.add(messageData, {
          ...defaultOptions,
          ...options
        });
      } catch (redisError) {
        logger.warn('Failed to add to Redis queue, using in-memory only:', redisError.message);
      }
    }

    logger.info(`📬 Message added to queue with job ID: ${job.id}`);
    
    // Emit update for real-time UI
    if (global.io) {
      global.io.emit('queue-updated', {
        pending: await inMemoryQueue.getPendingCount(),
        stats: inMemoryQueue.getStats()
      });
    }
    
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
    
    // Clear in-memory queue
    const clearedCount = await inMemoryQueue.clear();
    results.inMemoryQueue = `cleared ${clearedCount} messages`;
    
    // Clear Redis queues if available
    if (queues.messageQueue && process.env.SKIP_DB !== 'true') {
      try {
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
        logger.info('✅ Redis message queue cleared');
      } catch (redisError) {
        logger.warn('Failed to clear Redis queue:', redisError.message);
      }
    }
    
    if (queues.retryQueue && process.env.SKIP_DB !== 'true') {
      try {
        await queues.retryQueue.clean(0, 'waiting');
        await queues.retryQueue.clean(0, 'delayed');
        await queues.retryQueue.clean(0, 'active');
        await queues.retryQueue.clean(0, 'completed');
        await queues.retryQueue.clean(0, 'failed');
        
        results.retryQueue = 'cleared';
        logger.info('✅ Retry queue cleared');
      } catch (redisError) {
        logger.warn('Failed to clear retry queue:', redisError.message);
      }
    }
    
    // Emit update for real-time UI
    if (global.io) {
      global.io.emit('queue-updated', {
        pending: 0,
        stats: inMemoryQueue.getStats()
      });
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
    // Always return in-memory queue count first
    const inMemoryCount = await inMemoryQueue.getPendingCount();
    
    // If Redis is available, also check it
    if (queues.messageQueue && process.env.SKIP_DB !== 'true') {
      try {
        const waiting = await queues.messageQueue.getWaiting();
        const delayed = await queues.messageQueue.getDelayed();
        const active = await queues.messageQueue.getActive();
        
        const redisCount = waiting.length + delayed.length + active.length;
        
        // Return the maximum of both counts
        return Math.max(inMemoryCount, redisCount);
      } catch (redisError) {
        logger.warn('Failed to get Redis queue count:', redisError.message);
      }
    }
    
    return inMemoryCount;
  } catch (error) {
    logger.error('Error getting pending webhook count:', error);
    return 0;
  }
};

// Export in-memory queue for direct access
export const getInMemoryQueue = () => inMemoryQueue;

export default { initializeQueues, addMessageToQueue, getQueue, clearQueues, getPendingWebhookCount };