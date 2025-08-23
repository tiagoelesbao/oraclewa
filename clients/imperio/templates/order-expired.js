/**
 * Template para pedidos expirados - Cliente Império
 */
export function generateOrderExpiredMessage(customerName, productName, total) {
  return `${customerName}, seu pedido de ${productName} (R$ ${total}) expirou. Para finalizar o pagamento, acesse https://imperiopremioss.com/campanha/rapidinha-valendo-1200000-mil-em-premiacoes?afiliado=A0RJJ5L1QK - Imperio Premios`;
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