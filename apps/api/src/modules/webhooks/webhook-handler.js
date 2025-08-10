/**
 * Webhook Handler com Provider Dinâmico
 * Processa webhooks usando o provider apropriado para cada cliente
 */

import providerManager from '../../providers/manager/provider-manager.js';
import multiTenantConfig from '../../config/multi-tenant-config.js';
import logger from '../../utils/logger.js';
import { renderTemplate } from '../../services/templates/renderer.js';
import { getButtonOptions } from '../../services/templates/button-options.js';
import payloadTransformer from '../../services/webhooks/payload-transformer.js';

class WebhookHandler {
  constructor() {
    this.processing = new Map();
    this.stats = {
      received: 0,
      processed: 0,
      failed: 0,
      byType: {}
    };
  }

  async initialize() {
    logger.info('Webhook Handler initialized');
    return true;
  }

  /**
   * Processa webhook recebido
   */
  async processWebhook(clientId, webhookType, data) {
    try {
      this.stats.received++;
      const processingId = `${clientId}_${webhookType}_${Date.now()}`;
      
      // Evitar processamento duplicado
      if (this.processing.has(processingId)) {
        logger.warn(`Webhook ${processingId} already being processed`);
        return { status: 'duplicate', message: 'Already processing' };
      }

      this.processing.set(processingId, true);

      // Obter configuração do cliente
      const clientConfig = multiTenantConfig.getClient(clientId);
      if (!clientConfig) {
        throw new Error(`Client ${clientId} not found`);
      }

      // Verificar se o tipo de webhook está habilitado
      if (!this.isWebhookEnabled(clientConfig, webhookType)) {
        logger.info(`Webhook ${webhookType} disabled for client ${clientId}`);
        return { status: 'disabled', message: 'Webhook type disabled' };
      }

      // Processar baseado no tipo
      let result;
      switch (webhookType) {
        case 'order_expired':
          result = await this.handleOrderExpired(clientId, clientConfig, data);
          break;
        case 'order_paid':
          result = await this.handleOrderPaid(clientId, clientConfig, data);
          break;
        case 'cart_abandoned':
          result = await this.handleCartAbandoned(clientId, clientConfig, data);
          break;
        case 'custom':
          result = await this.handleCustomWebhook(clientId, clientConfig, data);
          break;
        default:
          throw new Error(`Unknown webhook type: ${webhookType}`);
      }

      // Atualizar estatísticas
      this.stats.processed++;
      this.stats.byType[webhookType] = (this.stats.byType[webhookType] || 0) + 1;

      this.processing.delete(processingId);
      
      logger.info(`Webhook ${webhookType} processed successfully for client ${clientId}`);
      return result;

    } catch (error) {
      this.stats.failed++;
      logger.error(`Failed to process webhook ${webhookType} for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook de pedido expirado
   */
  async handleOrderExpired(clientId, clientConfig, data) {
    try {
      logger.info(`=== ORDER EXPIRED WEBHOOK START [${clientId.toUpperCase()}] ===`);
      logger.info('Full payload received:', JSON.stringify(data, null, 2));

      // USAR PAYLOAD TRANSFORMER CONFIGURÁVEL
      const transformedData = payloadTransformer.transform(clientConfig, 'order_expired', data);
      logger.info('Transformed data:', transformedData);

      // Validar dados transformados
      if (!transformedData.userPhone) {
        throw new Error('User phone is required after transformation');
      }

      // Preparar dados para template usando configuração
      const templateData = payloadTransformer.prepareForTemplate(transformedData, clientConfig, 'order_expired');
      logger.info('Template data prepared:', Object.keys(templateData));

      // Obter nome do template baseado na configuração
      const templateName = payloadTransformer.getTemplateName(clientConfig, 'order_expired');
      logger.info(`Using template: ${templateName}`);

      // Renderizar mensagem
      const message = await renderTemplate(templateName, templateData);

      // Obter opções de botões se configurado
      let messageParams = {
        to: transformedData.userPhone,
        text: message
      };

      // Verificar se cliente suporta botões
      const provider = providerManager.selectProvider({
        clientId,
        requireButtons: clientConfig.features.buttons
      });

      if (provider.isCapable('buttons') && clientConfig.features.buttons) {
        const buttonOptions = getButtonOptions('ORDER_EXPIRED');
        messageParams = {
          to: transformedData.userPhone,
          content: {
            text: message,
            title: buttonOptions.title,
            footer: buttonOptions.footer
          },
          buttons: buttonOptions.buttons
        };

        // Enviar mensagem com botões
        return await this.sendMessage(clientId, clientConfig, 'button', messageParams);
      } else {
        // Enviar como texto simples (Evolution Baileys)
        const buttonOptions = getButtonOptions('ORDER_EXPIRED');
        const enhancedMessage = `${buttonOptions.title}\n\n${message}\n\n` +
          `*Opções:*\n` +
          `1️⃣ Renovar Participação\n` +
          `2️⃣ Entrar na Comunidade VIP\n\n` +
          `_Digite o número da opção ou clique no link:_\n` +
          `👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n` +
          `${buttonOptions.footer}`;

        messageParams.text = enhancedMessage;
        return await this.sendMessage(clientId, clientConfig, 'text', messageParams);
      }

    } catch (error) {
      logger.error(`Failed to handle order_expired for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook de pedido pago
   */
  async handleOrderPaid(clientId, clientConfig, data) {
    try {
      logger.info(`=== ORDER PAID WEBHOOK START [${clientId.toUpperCase()}] ===`);
      logger.info('Full payload received:', JSON.stringify(data, null, 2));

      // USAR PAYLOAD TRANSFORMER CONFIGURÁVEL
      const transformedData = payloadTransformer.transform(clientConfig, 'order_paid', data);
      logger.info('Transformed data:', transformedData);

      // Validar dados transformados
      if (!transformedData.userPhone) {
        throw new Error('User phone is required after transformation');
      }

      // Preparar dados para template usando configuração
      const templateData = payloadTransformer.prepareForTemplate(transformedData, clientConfig, 'order_paid');
      logger.info('Template data prepared:', Object.keys(templateData));

      // Obter nome do template baseado na configuração
      const templateName = payloadTransformer.getTemplateName(clientConfig, 'order_paid');
      logger.info(`Using template: ${templateName}`);

      // Renderizar mensagem
      const message = await renderTemplate(templateName, templateData);

      // Obter opções de botões se configurado
      let messageParams = {
        to: transformedData.userPhone,
        text: message
      };

      // Verificar se cliente suporta botões
      const provider = providerManager.selectProvider({
        clientId,
        requireButtons: clientConfig.features.buttons
      });

      if (provider.isCapable('buttons') && clientConfig.features.buttons) {
        const buttonOptions = getButtonOptions('ORDER_PAID');
        messageParams = {
          to: transformedData.userPhone,
          content: {
            text: message,
            title: buttonOptions.title,
            footer: buttonOptions.footer
          },
          buttons: buttonOptions.buttons
        };

        // Enviar mensagem com botões
        return await this.sendMessage(clientId, clientConfig, 'button', messageParams);
      } else {
        // Enviar como texto simples (Evolution Baileys)
        const buttonOptions = getButtonOptions('ORDER_PAID');
        const enhancedMessage = `${buttonOptions.title}\n\n${message}\n\n` +
          `*Próximos passos:*\n` +
          `✅ Entre na nossa comunidade VIP\n` +
          `📱 Acompanhe os sorteios\n` +
          `🎯 Boa sorte!\n\n` +
          `👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF\n\n` +
          `${buttonOptions.footer}`;

        messageParams.text = enhancedMessage;
        return await this.sendMessage(clientId, clientConfig, 'text', messageParams);
      }

    } catch (error) {
      logger.error(`Failed to handle order_paid for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook de carrinho abandonado
   */
  async handleCartAbandoned(clientId, clientConfig, data) {
    try {
      const { customer_name, customer_phone, cart_items, cart_value } = data;

      if (!customer_phone) {
        throw new Error('Customer phone is required');
      }

      const message = `Olá ${customer_name || 'Cliente'}! 🛒\n\n` +
        `Notamos que você deixou alguns itens no seu carrinho.\n` +
        `Valor total: R$ ${cart_value || '0,00'}\n\n` +
        `Que tal finalizar sua compra? 🎯\n\n` +
        `Acesse: https://imperio.premios.com/carrinho`;

      const messageParams = {
        to: customer_phone,
        text: message
      };

      return await this.sendMessage(clientId, clientConfig, 'text', messageParams);

    } catch (error) {
      logger.error(`Failed to handle cart_abandoned for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook customizado
   */
  async handleCustomWebhook(clientId, clientConfig, data) {
    try {
      const { phone, message, type = 'text', media, buttons } = data;

      if (!phone || !message) {
        throw new Error('Phone and message are required');
      }

      let messageParams = {
        to: phone,
        text: message
      };

      if (type === 'media' && media) {
        messageParams.mediaUrl = media.url;
        messageParams.caption = message;
        messageParams.mediaType = media.type || 'image';
        return await this.sendMessage(clientId, clientConfig, 'media', messageParams);
      }

      if (type === 'button' && buttons && clientConfig.features.buttons) {
        messageParams = {
          to: phone,
          content: { text: message },
          buttons
        };
        return await this.sendMessage(clientId, clientConfig, 'button', messageParams);
      }

      return await this.sendMessage(clientId, clientConfig, 'text', messageParams);

    } catch (error) {
      logger.error(`Failed to handle custom webhook for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Envia mensagem usando o provider apropriado
   */
  async sendMessage(clientId, clientConfig, type, params) {
    try {
      // Obter instância apropriada para o cliente
      const instanceName = this.selectInstance(clientConfig, type);
      
      if (!instanceName) {
        throw new Error(`No instance available for client ${clientId}`);
      }

      // Adicionar delay para simular digitação humana
      if (clientConfig.features.typing) {
        await providerManager.sendMessage(instanceName, 'typing', {
          to: params.to,
          duration: 3000
        });
        await this.delay(3000);
      }

      // Enviar mensagem
      const result = await providerManager.sendMessage(instanceName, type, params);

      // Log de sucesso
      logger.info(`Message sent successfully to ${params.to} via instance ${instanceName}`);

      return {
        success: true,
        messageId: result.messageId,
        instance: instanceName,
        provider: result.provider,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to send message for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Seleciona instância apropriada para o cliente
   */
  selectInstance(clientConfig, messageType) {
    // Para webhooks, usar instâncias de recovery
    const instances = Object.keys(clientConfig.instances || {})
      .filter(name => {
        const instance = clientConfig.instances[name];
        return instance.type === 'recovery' && instance.status === 'active';
      });

    if (instances.length === 0) {
      return null;
    }

    // Rotação simples entre instâncias
    return instances[Math.floor(Math.random() * instances.length)];
  }

  /**
   * Verifica se webhook está habilitado para o cliente
   */
  isWebhookEnabled(clientConfig, webhookType) {
    if (!clientConfig.services.includes('webhooks')) {
      return false;
    }

    if (clientConfig.webhooks && clientConfig.webhooks[webhookType]) {
      return clientConfig.webhooks[webhookType].enabled !== false;
    }

    return true;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.processed > 0 
        ? ((this.stats.processed / this.stats.received) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    this.stats = {
      received: 0,
      processed: 0,
      failed: 0,
      byType: {}
    };
    logger.info('Webhook statistics reset');
  }
}

// Singleton
const webhookHandler = new WebhookHandler();

export default webhookHandler;