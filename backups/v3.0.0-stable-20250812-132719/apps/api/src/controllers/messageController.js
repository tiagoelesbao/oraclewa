import logger from '../utils/logger.js';
import { addMessageToQueue } from '../services/queue/manager.js';
import MessageLog from '../database/models/MessageLog.js';
import sequelize, { Op } from 'sequelize';

export const sendCustomMessage = async (req, res) => {
  try {
    const { phoneNumber, message, priority = 0 } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }

    const job = await addMessageToQueue({
      phoneNumber,
      message,
      type: 'custom',
      customerId: req.user.username,
      metadata: {
        sentBy: req.user.username,
        sentAt: new Date()
      }
    }, {
      priority
    });

    logger.info('Custom message queued', {
      jobId: job.id,
      phoneNumber: phoneNumber.slice(0, -4) + '****'
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Message queued for sending'
    });
  } catch (error) {
    logger.error('Error sending custom message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMessageHistory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      phoneNumber, 
      type, 
      status,
      startDate,
      endDate 
    } = req.query;

    const where = {};

    if (phoneNumber) {
      where.phoneNumber = phoneNumber;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await MessageLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      messages: rows
    });
  } catch (error) {
    logger.error('Error fetching message history:', error);
    res.status(500).json({ error: 'Failed to fetch message history' });
  }
};

export const getMessageStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const stats = await MessageLog.findAll({
      where,
      attributes: [
        'type',
        'status',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['type', 'status']
    });

    const totalMessages = await MessageLog.count({ where });
    const sentMessages = await MessageLog.count({ 
      where: { ...where, status: 'sent' } 
    });
    const failedMessages = await MessageLog.count({ 
      where: { ...where, status: 'failed' } 
    });

    res.json({
      total: totalMessages,
      sent: sentMessages,
      failed: failedMessages,
      successRate: totalMessages > 0 
        ? ((sentMessages / totalMessages) * 100).toFixed(2) + '%' 
        : '0%',
      byType: stats
    });
  } catch (error) {
    logger.error('Error fetching message stats:', error);
    res.status(500).json({ error: 'Failed to fetch message statistics' });
  }
};