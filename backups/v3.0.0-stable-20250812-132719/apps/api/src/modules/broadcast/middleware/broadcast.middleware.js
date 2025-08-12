import logger from '../../../utils/logger.js';

// Validate broadcast request data
export const validateBroadcastRequest = (req, res, next) => {
  try {
    const { body } = req;
    
    // Log incoming request for debugging
    logger.info('Broadcast request validation:', {
      endpoint: req.path,
      hasPhone: !!body.phone,
      hasPhones: !!body.phones,
      hasMessage: !!body.message,
      hasTemplate: !!body.template,
      buttonCount: body.buttons?.length || 0
    });

    // Validate required fields based on endpoint
    if (req.path === '/send') {
      if (!body.phone) {
        return res.status(400).json({
          error: 'Phone number is required',
          field: 'phone'
        });
      }
      
      if (!body.message) {
        return res.status(400).json({
          error: 'Message is required',
          field: 'message'
        });
      }
    }

    if (req.path === '/campaign') {
      if (!body.phones || !Array.isArray(body.phones) || body.phones.length === 0) {
        return res.status(400).json({
          error: 'Phones array is required and must not be empty',
          field: 'phones'
        });
      }

      if (!body.message && !body.template) {
        return res.status(400).json({
          error: 'Either message or template is required',
          fields: ['message', 'template']
        });
      }
    }

    if (req.path === '/template') {
      if (!body.phone) {
        return res.status(400).json({
          error: 'Phone number is required',
          field: 'phone'
        });
      }
      
      if (!body.template) {
        return res.status(400).json({
          error: 'Template name is required',
          field: 'template'
        });
      }
    }

    // Validate phone numbers format
    if (body.phone) {
      const phoneRegex = /^\d{10,13}$/;
      const cleanPhone = body.phone.replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          error: 'Invalid phone number format',
          field: 'phone',
          expected: '10-13 digits'
        });
      }
    }

    if (body.phones) {
      const invalidPhones = [];
      const phoneRegex = /^\d{10,13}$/;
      
      body.phones.forEach((phone, index) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          invalidPhones.push({ index, phone });
        }
      });

      if (invalidPhones.length > 0 && invalidPhones.length === body.phones.length) {
        return res.status(400).json({
          error: 'All phone numbers are invalid',
          field: 'phones',
          invalidPhones
        });
      }
    }

    // Validate buttons format
    if (body.buttons && Array.isArray(body.buttons)) {
      if (body.buttons.length > 3) {
        return res.status(400).json({
          error: 'Maximum 3 buttons allowed',
          field: 'buttons',
          limit: 3
        });
      }

      const buttonErrors = [];
      body.buttons.forEach((button, index) => {
        if (!button.id || !button.title) {
          buttonErrors.push({ index, error: 'Button must have id and title' });
        }
        if (button.title.length > 20) {
          buttonErrors.push({ index, error: 'Button title must be 20 characters or less' });
        }
      });

      if (buttonErrors.length > 0) {
        return res.status(400).json({
          error: 'Invalid button format',
          field: 'buttons',
          buttonErrors
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Broadcast validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: error.message
    });
  }
};

// Validate webhook request
export const validateWebhookRequest = (req, res, next) => {
  try {
    const { body } = req;
    
    // Log webhook data
    logger.info('Webhook validation:', {
      hasData: !!body.data,
      hasMessage: !!body.data?.message,
      messageType: body.data?.message ? Object.keys(body.data.message)[0] : 'none'
    });

    // Basic webhook structure validation
    if (!body.data) {
      return res.status(400).json({
        error: 'Webhook data is required',
        field: 'data'
      });
    }

    // Accept webhook even if structure is different - ZAPI format varies
    next();
  } catch (error) {
    logger.error('Webhook validation error:', error);
    res.status(500).json({
      error: 'Webhook validation failed',
      details: error.message
    });
  }
};

// Rate limiting middleware
export const rateLimitMiddleware = (req, res, next) => {
  try {
    // Simple rate limiting based on IP
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30; // Max 30 requests per minute

    if (!req.app.locals.rateLimitStore) {
      req.app.locals.rateLimitStore = new Map();
    }

    const store = req.app.locals.rateLimitStore;
    const clientData = store.get(clientIP) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - clientData.windowStart > windowMs) {
      clientData.count = 0;
      clientData.windowStart = now;
    }

    clientData.count++;
    store.set(clientIP, clientData);

    if (clientData.count > maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit: maxRequests,
        windowMs,
        retryAfter: Math.ceil((windowMs - (now - clientData.windowStart)) / 1000)
      });
    }

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count),
      'X-RateLimit-Reset': new Date(clientData.windowStart + windowMs)
    });

    next();
  } catch (error) {
    logger.error('Rate limit middleware error:', error);
    next(); // Don't block on rate limit errors
  }
};

// Authentication middleware (for future use)
export const authMiddleware = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey = process.env.BROADCAST_API_KEY || 'your-secret-key';

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key is required',
        header: 'x-api-key'
      });
    }

    if (apiKey !== validApiKey) {
      return res.status(403).json({
        error: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
};

export default {
  validateBroadcastRequest,
  validateWebhookRequest,
  rateLimitMiddleware,
  authMiddleware
};