import Joi from 'joi';

const webhookSchemas = {
  // Schemas corretos para o sistema Império (estrutura real)
  order_expired: Joi.object({
    event: Joi.string().valid('order.expired').required(),
    timestamp: Joi.date().iso().optional(),
    data: Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      product: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        title: Joi.string().required()
      }).required(),
      user: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^[\+\(\)\d\s\-]{10,20}$/).required(),
        email: Joi.string().email().allow('').optional(),
        cpf: Joi.string().allow('').optional(),
        affiliateCode: Joi.string().allow('').optional(),
        createdAt: Joi.date().iso().optional()
      }).required(),
      pixCode: Joi.string().allow('').optional(),
      quantity: Joi.number().integer().positive().optional(),
      status: Joi.string().optional(),
      price: Joi.number().positive().optional(),
      subtotal: Joi.number().positive().optional(),
      discount: Joi.number().min(0).optional(),
      total: Joi.number().positive().required(),
      expirationAt: Joi.date().iso().optional(),
      affiliate: Joi.string().allow('').optional(),
      createdAt: Joi.date().iso().optional(),
      params: Joi.object().optional()
    }).required()
  }),

  order_paid: Joi.object({
    event: Joi.string().valid('order.paid').required(),
    timestamp: Joi.date().iso().optional(),
    data: Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      product: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        title: Joi.string().required()
      }).required(),
      user: Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^[\+\(\)\d\s\-]{10,20}$/).required(),
        email: Joi.string().email().allow('').optional(),
        cpf: Joi.string().allow('').optional(),
        affiliateCode: Joi.string().allow('').optional(),
        createdAt: Joi.date().iso().optional()
      }).required(),
      pixCode: Joi.string().allow('').optional(),
      quantity: Joi.number().integer().positive().optional(),
      status: Joi.string().optional(),
      price: Joi.number().positive().optional(),
      subtotal: Joi.number().positive().optional(),
      discount: Joi.number().min(0).optional(),
      total: Joi.number().positive().required(),
      expirationAt: Joi.date().iso().optional(),
      affiliate: Joi.string().allow('').optional(),
      createdAt: Joi.date().iso().optional(),
      params: Joi.object().optional()
    }).required()
  }),

  // Schemas antigos (compatibilidade)
  carrinho_abandonado: Joi.object({
    event: Joi.string().valid('carrinho_abandonado').required(),
    timestamp: Joi.date().iso().required(),
    data: Joi.object({
      customer: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10,15}$/).required(),
        email: Joi.string().email().required()
      }).required(),
      cart: Joi.object({
        id: Joi.string().required(),
        total: Joi.number().positive().required(),
        items: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            quantity: Joi.number().integer().positive().required(),
            price: Joi.number().positive().required()
          })
        ).min(1).required(),
        recovery_url: Joi.string().uri().required()
      }).required()
    }).required()
  }),

  venda_expirada: Joi.object({
    event: Joi.string().valid('venda_expirada').required(),
    timestamp: Joi.date().iso().required(),
    data: Joi.object({
      customer: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10,15}$/).required(),
        email: Joi.string().email().required()
      }).required(),
      order: Joi.object({
        id: Joi.string().required(),
        total: Joi.number().positive().required(),
        expiration_date: Joi.date().iso().required(),
        payment_url: Joi.string().uri().required()
      }).required()
    }).required()
  }),

  venda_aprovada: Joi.object({
    event: Joi.string().valid('venda_aprovada').required(),
    timestamp: Joi.date().iso().required(),
    data: Joi.object({
      customer: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10,15}$/).required(),
        email: Joi.string().email().required()
      }).required(),
      order: Joi.object({
        id: Joi.string().required(),
        total: Joi.number().positive().required(),
        items: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            quantity: Joi.number().integer().positive().required(),
            price: Joi.number().positive().required()
          })
        ).min(1).required(),
        tracking_code: Joi.string().optional(),
        estimated_delivery: Joi.date().iso().optional()
      }).required()
    }).required()
  })
};

export const validateWebhookData = (type) => {
  return (req, res, next) => {
    const schema = webhookSchemas[type];
    
    if (!schema) {
      return res.status(500).json({ error: 'Invalid webhook type' });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.validatedData = value;
    next();
  };
};