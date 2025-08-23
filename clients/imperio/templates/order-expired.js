/**
 * Template para pedidos expirados - Cliente Império
 */
export function generateOrderExpiredMessage(customerName, productName, total) {
  return `${customerName} seu pedido expirou. Acesse imperiopremioss.com`;
}

export const ORDER_EXPIRED_CONFIG = {
  templateType: 'order_expired', 
  client: 'imperio',
  features: {
    antibanEnabled: true,
    typingSimulation: true,
    randomDelays: true,
    urgencyBoost: true
  }
};