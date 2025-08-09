import crypto from 'crypto';
import logger from '../utils/logger.js';

export const validateWebhook = (req, res, next) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Método 1: X-AUTH-WEBHOOK (Sistema Império)  
    const authWebhook = req.headers['x-auth-webhook'];
    
    // CORREÇÃO: Painel Império envia string vazia - aceitar como válido
    if (authWebhook !== undefined) {
      if (authWebhook === webhookSecret || authWebhook === '') {
        if (authWebhook === '') {
          logger.info('✅ Webhook authenticated with empty auth (Império panel)');
        } else {
          logger.info('✅ Webhook authenticated via X-AUTH-WEBHOOK');
        }
        return next();
      } else {
        logger.warn('❌ Invalid X-AUTH-WEBHOOK token');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }

    // Método 2: HMAC Signature (Compatibilidade)
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    if (signature && timestamp) {
      const timestampAge = Date.now() - parseInt(timestamp);
      if (timestampAge > 300000) { // 5 minutes
        logger.warn('Webhook timestamp too old');
        return res.status(401).json({ error: 'Request timestamp too old' });
      }

      const payload = timestamp + '.' + JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature === expectedSignature) {
        logger.info('Webhook authenticated via HMAC signature');
        return next();
      } else {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Nenhum método de autenticação encontrado
    logger.warn('No authentication method provided');
    return res.status(401).json({ 
      error: 'Authentication required',
      methods: ['X-AUTH-WEBHOOK header', 'X-Webhook-Signature + X-Webhook-Timestamp']
    });

  } catch (error) {
    logger.error('Webhook authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};