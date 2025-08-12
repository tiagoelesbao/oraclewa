/**
 * Base Webhook Adapter
 * Interface padrão que todos os adapters de cliente devem implementar
 */

import logger from '../../../utils/logger.js';

export class BaseWebhookAdapter {
  constructor(clientId) {
    this.clientId = clientId;
    this.supportedEvents = [];
  }

  /**
   * Valida se o evento é suportado por este adapter
   */
  supportsEvent(eventType) {
    return this.supportedEvents.includes(eventType);
  }

  /**
   * Processa payload do webhook e retorna dados normalizados
   * DEVE ser implementado por cada adapter específico
   */
  async processWebhook(eventType, rawPayload) {
    throw new Error(`processWebhook must be implemented by ${this.constructor.name}`);
  }

  /**
   * Valida payload do webhook
   * Pode ser sobrescrito por adapters específicos
   */
  async validatePayload(rawPayload) {
    if (!rawPayload) {
      throw new Error('Payload is required');
    }
    return true;
  }

  /**
   * Extrai dados básicos do usuário (formato normalizado)
   * Deve retornar: { name, phone, email?, cpf?, id? }
   */
  extractUser(payload) {
    throw new Error(`extractUser must be implemented by ${this.constructor.name}`);
  }

  /**
   * Extrai dados do produto (formato normalizado)  
   * Deve retornar: { id, title, price? }
   */
  extractProduct(payload) {
    throw new Error(`extractProduct must be implemented by ${this.constructor.name}`);
  }

  /**
   * Extrai dados do pedido (formato normalizado)
   * Deve retornar: { id, status, total, expirationAt?, createdAt? }
   */
  extractOrder(payload) {
    throw new Error(`extractOrder must be implemented by ${this.constructor.name}`);
  }

  /**
   * Prepara dados para template de mensagem
   */
  prepareTemplateData(user, product, order, customData = {}) {
    return {
      // Dados básicos para compatibilidade
      name: user.name || 'Cliente',
      orderId: order.id,
      productName: product.title,
      value: this.formatCurrency(order.total),
      total: this.formatCurrency(order.total),
      
      // Objetos completos para templates avançados
      user,
      product, 
      order,
      
      // Dados customizados por cliente
      ...customData
    };
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value) {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'string' && value) {
      const numericValue = parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numericValue)) {
        return numericValue.toFixed(2);
      }
    }
    return '0.00';
  }

  /**
   * Log específico do adapter
   */
  log(level, message, data = {}) {
    logger[level](`[${this.clientId.toUpperCase()} ADAPTER] ${message}`, {
      clientId: this.clientId,
      adapter: this.constructor.name,
      ...data
    });
  }

  /**
   * Obter informações do adapter
   */
  getInfo() {
    return {
      clientId: this.clientId,
      name: this.constructor.name,
      supportedEvents: this.supportedEvents,
      version: '1.0.0'
    };
  }
}

export default BaseWebhookAdapter;