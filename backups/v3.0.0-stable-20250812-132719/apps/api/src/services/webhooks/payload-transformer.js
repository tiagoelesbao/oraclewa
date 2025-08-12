/**
 * Payload Transformer
 * Sistema escalável para transformar payloads de webhook baseado em configuração
 */

import logger from '../../utils/logger.js';

class PayloadTransformer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Transforma payload usando configuração do cliente
   */
  transform(clientConfig, eventType, rawPayload) {
    try {
      logger.info(`Transforming payload for client ${clientConfig.id}, event: ${eventType}`);
      
      // Verificar se há configuração de transformers
      const webhookConfig = clientConfig.webhookConfig;
      if (!webhookConfig || !webhookConfig.payloadTransformers) {
        logger.info('No payload transformers configured, using legacy format');
        return this.legacyTransform(rawPayload);
      }

      const transformer = webhookConfig.payloadTransformers[eventType];
      if (!transformer) {
        logger.warn(`No transformer found for event ${eventType}, using legacy format`);
        return this.legacyTransform(rawPayload);
      }

      // Aplicar transformações
      const transformed = {};
      
      for (const [targetField, sourcePath] of Object.entries(transformer)) {
        const value = this.extractValue(rawPayload, sourcePath);
        transformed[targetField] = value;
      }

      // Aplicar validações se configuradas
      if (webhookConfig.validation) {
        this.validateTransformed(transformed, webhookConfig.validation, clientConfig.id);
      }

      logger.info(`Payload transformed successfully for ${clientConfig.id}:`, {
        originalKeys: Object.keys(rawPayload),
        transformedKeys: Object.keys(transformed)
      });

      return transformed;

    } catch (error) {
      logger.error(`Failed to transform payload for ${clientConfig.id}:`, error);
      // Fallback para formato legado em caso de erro
      return this.legacyTransform(rawPayload);
    }
  }

  /**
   * Extrai valor usando dot notation (ex: "data.user.phone")
   */
  extractValue(obj, path) {
    if (!path || !obj) return null;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Formato legado para compatibilidade
   */
  legacyTransform(payload) {
    return {
      userPhone: payload.customer_phone || payload.phone,
      userName: payload.customer_name || payload.name || 'Cliente',
      productTitle: payload.product_name || payload.product || 'Produto',
      orderTotal: payload.value || payload.total || 0,
      orderId: payload.order_id || payload.id,
      orderStatus: payload.status || 'unknown'
    };
  }

  /**
   * Valida dados transformados
   */
  validateTransformed(data, validation, clientId) {
    // Verificar campos obrigatórios
    if (validation.requiredFields) {
      for (const field of validation.requiredFields) {
        if (!data[field]) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
    }

    // Validar formato de telefone
    if (validation.phoneFormat === 'brazilian' && data.userPhone) {
      data.userPhone = this.formatBrazilianPhone(data.userPhone);
    }

    // Formatar valor monetário
    if (validation.currencyFormat === 'BRL' && data.orderTotal) {
      data.orderTotal = this.formatBRLCurrency(data.orderTotal);
    }

    logger.info(`Validation passed for client ${clientId}`);
  }

  /**
   * Formata telefone brasileiro
   */
  formatBrazilianPhone(phone) {
    if (!phone) return null;

    // Remove tudo que não é número
    let cleaned = phone.toString().replace(/\D/g, '');

    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    // Validar se tem tamanho correto (55 + DDD + número)
    if (cleaned.length < 12 || cleaned.length > 13) {
      logger.warn(`Invalid Brazilian phone format: ${phone} -> ${cleaned}`);
    }

    return cleaned;
  }

  /**
   * Formata valor em reais
   */
  formatBRLCurrency(value) {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    if (typeof value === 'string' && value) {
      // Remove tudo exceto números, vírgula e ponto
      const cleaned = value.replace(/[^\d.,]/g, '');
      const numeric = parseFloat(cleaned.replace(',', '.'));
      
      if (!isNaN(numeric)) {
        return numeric.toFixed(2);
      }
    }

    return '0.00';
  }

  /**
   * Prepara dados para template
   */
  prepareForTemplate(transformedData, clientConfig, eventType) {
    try {
      const webhookConfig = clientConfig.webhookConfig;
      
      if (!webhookConfig || !webhookConfig.templateMappings) {
        // Usar mapeamento padrão
        return this.getDefaultTemplateData(transformedData);
      }

      const mapping = webhookConfig.templateMappings[eventType];
      if (!mapping) {
        return this.getDefaultTemplateData(transformedData);
      }

      // Aplicar mapeamento customizado
      const templateData = {};
      
      for (const [templateVar, dataField] of Object.entries(mapping.variables)) {
        templateData[templateVar] = transformedData[dataField] || '';
      }

      // Adicionar dados extras para compatibilidade
      templateData.user = {
        name: transformedData.userName,
        phone: transformedData.userPhone,
        email: transformedData.userEmail
      };

      templateData.product = {
        title: transformedData.productTitle,
        id: transformedData.productId
      };

      templateData.order = {
        id: transformedData.orderId,
        total: transformedData.orderTotal,
        status: transformedData.orderStatus
      };

      logger.info(`Template data prepared for ${clientConfig.id}:`, Object.keys(templateData));
      
      return templateData;

    } catch (error) {
      logger.error(`Failed to prepare template data:`, error);
      return this.getDefaultTemplateData(transformedData);
    }
  }

  /**
   * Dados padrão para template
   */
  getDefaultTemplateData(data) {
    return {
      name: data.userName || 'Cliente',
      customerName: data.userName || 'Cliente',
      productName: data.productTitle || 'Produto',
      totalValue: data.orderTotal || '0.00',
      value: data.orderTotal || '0.00',
      orderId: data.orderId || '',
      user: {
        name: data.userName,
        phone: data.userPhone,
        email: data.userEmail
      },
      product: {
        title: data.productTitle,
        id: data.productId
      },
      order: {
        id: data.orderId,
        total: data.orderTotal,
        status: data.orderStatus
      }
    };
  }

  /**
   * Obter template name baseado na configuração
   */
  getTemplateName(clientConfig, eventType) {
    const webhookConfig = clientConfig.webhookConfig;
    
    if (!webhookConfig || !webhookConfig.templateMappings) {
      return eventType; // Usar nome padrão
    }

    const mapping = webhookConfig.templateMappings[eventType];
    if (!mapping) {
      return eventType;
    }

    return mapping.template || mapping.fallback || eventType;
  }

  /**
   * Debug info
   */
  getTransformInfo(clientId, eventType) {
    return {
      clientId,
      eventType,
      cacheSize: this.cache.size,
      supportedTransforms: ['legacy', 'imperio_format', 'custom_config']
    };
  }
}

// Singleton instance
const payloadTransformer = new PayloadTransformer();

export default payloadTransformer;