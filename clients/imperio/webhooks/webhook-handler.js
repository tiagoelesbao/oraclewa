/**
 * Handler de Webhooks - Cliente Império
 * Processa webhooks específicos do cliente Império com suas configurações
 */
import { generateOrderPaidMessage } from '../templates/order-paid.js';
import { generateOrderExpiredMessage } from '../templates/order-expired.js';
import logger from '../../../apps/api/src/utils/logger.js';

export class ImperioWebhookHandler {
  constructor(whatsappManager) {
    this.whatsappManager = whatsappManager;
    this.clientConfig = {
      name: 'imperio',
      whatsappInstance: 'imperio1',
      antibanEnabled: true,
      templateVariations: false // Usar templates fixos por enquanto
    };
  }

  /**
   * Processa webhook de pedido pago
   */
  async handleOrderPaid(payload) {
    try {
      logger.info('💰 [IMPÉRIO] Processando pedido pago');
      
      const userData = payload.data?.user || {};
      const userName = userData.name || 'Cliente';
      const phone = userData.phone || 'N/A';
      const total = payload.data?.total || 0;
      const productName = payload.data?.product?.title || 'Produto';
      
      logger.info(`✅ [IMPÉRIO] Cliente: ${userName}, Telefone: ${phone}, Valor: R$ ${total}`);
      
      // Validar dados obrigatórios
      if (!phone || phone === 'N/A') {
        throw new Error('Telefone não fornecido no payload');
      }
      
      // Gerar mensagem usando template do cliente
      const message = generateOrderPaidMessage(userName, productName, total);
      
      // Enviar via WhatsApp com anti-ban
      const result = await this.whatsappManager.sendMessage(phone, message);
      
      logger.info('✅ [IMPÉRIO] Mensagem de pedido pago enviada com sucesso!');
      
      return {
        success: true,
        client: 'imperio',
        type: 'order_paid',
        customer: userName,
        phone: phone,
        total: total,
        messageResult: result
      };
      
    } catch (error) {
      logger.error('❌ [IMPÉRIO] Erro no processamento de pedido pago:', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook de pedido expirado
   */
  async handleOrderExpired(payload) {
    try {
      logger.info('⏰ [IMPÉRIO] Processando pedido expirado');
      
      const userData = payload.data?.user || {};
      const userName = userData.name || 'Cliente';
      const phone = userData.phone || 'N/A';
      const total = payload.data?.total || 0;
      const productName = payload.data?.product?.title || 'Produto';
      
      logger.info(`✅ [IMPÉRIO] Cliente: ${userName}, Telefone: ${phone}, Valor: R$ ${total}`);
      
      // Validar dados obrigatórios
      if (!phone || phone === 'N/A') {
        throw new Error('Telefone não fornecido no payload');
      }
      
      // Gerar mensagem usando template do cliente
      const message = generateOrderExpiredMessage(userName, productName, total);
      
      // Enviar via WhatsApp com anti-ban
      const result = await this.whatsappManager.sendMessage(phone, message);
      
      logger.info('✅ [IMPÉRIO] Mensagem de pedido expirado enviada com sucesso!');
      
      return {
        success: true,
        client: 'imperio',
        type: 'order_expired',
        customer: userName,
        phone: phone,
        total: total,
        messageResult: result
      };
      
    } catch (error) {
      logger.error('❌ [IMPÉRIO] Erro no processamento de pedido expirado:', error.message);
      throw error;
    }
  }

  /**
   * Roteador principal de webhooks
   */
  async processWebhook(type, payload) {
    switch (type) {
      case 'order_paid':
      case 'temp-order-paid':
        return await this.handleOrderPaid(payload);
        
      case 'order_expired':
      case 'temp-order-expired':
        return await this.handleOrderExpired(payload);
        
      default:
        throw new Error(`Tipo de webhook não suportado para cliente Império: ${type}`);
    }
  }
}

export default ImperioWebhookHandler;