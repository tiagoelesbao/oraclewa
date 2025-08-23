/**
 * Template para pedidos expirados - Cliente Império
 */
export function generateOrderExpiredMessage(customerName, productName, total) {
  return `🚨 *PEDIDO EXPIRADO*

Oi *${customerName}*! ⏰

Seu pedido do produto *${productName}* no valor de *R$ ${total}* expirou.

🔥 *Última chance para suas cotas!*

⚠️ Concorra a *R$ 100.000,00 pela Federal!*

🔗 *GARANTA AGORA:*

https://imperiopremioss.com/campanha/rapidinha-valendo-1200000-mil-em-premiacoes?&afiliado=A0RJJ5L1QK

*Império Prêmios* 🏆
_O tempo está acabando..._`;
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