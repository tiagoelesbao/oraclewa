/**
 * Template para pedidos expirados - Template para novos clientes
 */
export function generateOrderExpiredMessage(customerName, productName, total) {
  return `⏰ *PEDIDO EXPIRADO*

Oi *${customerName}*! 

Seu pedido do produto *${productName}* no valor de *R$ ${total}* expirou.

🔄 *Não perca a oportunidade!*

⚡ Finalize sua compra agora:
👉 [LINK DA SUA LOJA]

*Sua Empresa* 🏪
_Estamos aqui para ajudar!_`;
}

export const ORDER_EXPIRED_CONFIG = {
  templateType: 'order_expired',
  client: 'template', 
  features: {
    antibanEnabled: true,
    typingSimulation: true,
    randomDelays: true,
    urgencyBoost: true
  }
};