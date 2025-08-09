import logger from '../utils/logger.js';
import { getInstancesStatus as getStatus } from '../services/whatsapp/evolution-manager.js';
import warmupManager from '../services/whatsapp/warmup-manager.js';
import axios from 'axios';

export const getInstancesStatus = async (req, res) => {
  try {
    const instances = getStatus();
    
    // Enriquecer dados com informações de aquecimento
    const enrichedInstances = await Promise.all(instances.map(async (instance) => {
      const dailyLimit = await warmupManager.getDailyLimit(instance.name);
      const isInWarmup = await warmupManager.isNumberInWarmup(instance.name);
      const canSend = await warmupManager.canSendMessage(instance.name);
      
      return {
        ...instance,
        dailyLimit,
        isInWarmup,
        canSend,
        warmupStatus: isInWarmup ? `Dia ${Math.floor((Date.now() - parseInt(await warmupManager.redis?.get(`warmup:${instance.name}`) || '0')) / (1000 * 60 * 60 * 24)) + 1}/7` : 'Aquecido'
      };
    }));
    
    const connectedCount = instances.filter(i => i.status === 'connected').length;
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour < 20;
    
    res.json({
      instances: enrichedInstances,
      summary: {
        total: instances.length,
        connected: connectedCount,
        disconnected: instances.filter(i => i.status === 'disconnected').length,
        error: instances.filter(i => i.status === 'error').length,
        singleNumberMode: instances.length === 1,
        businessHours: isBusinessHours,
        currentHour: hour,
        antibanActive: true
      },
      recommendations: instances.length === 1 ? [
        '🎯 Modo número único ativo',
        '🛡️ Rate limiting conservador aplicado',
        '⏱️ Delays entre mensagens: 15-45s',
        '📊 Limite diário baseado em aquecimento',
        '🕘 Horário comercial: 9h-20h apenas'
      ] : []
    });
  } catch (error) {
    logger.error('Error fetching instances status:', error);
    res.status(500).json({ error: 'Failed to fetch instances status' });
  }
};

export const generateQRCode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const instance = getStatus().find(i => i.id === instanceId);
    
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const evolutionUrl = `${process.env.EVOLUTION_API_URL}:${instance.port}`;
    const apiKey = process.env[`EVOLUTION_API_KEY_${instanceId.split('-')[1]}`];

    const response = await axios.get(`${evolutionUrl}/instance/connect`, {
      headers: {
        'apikey': apiKey
      }
    });

    if (response.data.qrcode) {
      res.json({
        instanceId,
        qrcode: response.data.qrcode,
        status: 'pending'
      });
    } else {
      res.json({
        instanceId,
        status: 'already_connected'
      });
    }
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export const disconnectInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const instance = getStatus().find(i => i.id === instanceId);
    
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const evolutionUrl = `${process.env.EVOLUTION_API_URL}:${instance.port}`;
    const apiKey = process.env[`EVOLUTION_API_KEY_${instanceId.split('-')[1]}`];

    await axios.delete(`${evolutionUrl}/instance/logout`, {
      headers: {
        'apikey': apiKey
      }
    });

    logger.info(`Instance ${instanceId} disconnected`);

    res.json({
      success: true,
      message: 'Instance disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting instance:', error);
    res.status(500).json({ error: 'Failed to disconnect instance' });
  }
};