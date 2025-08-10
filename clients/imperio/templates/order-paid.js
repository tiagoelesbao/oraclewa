/**
 * Template para pedidos pagos - Cliente Império
 */
export function generateOrderPaidMessage(customerName, productName, total) {
  return `🎉 *PAGAMENTO CONFIRMADO*

Parabéns *${customerName}*! ✅

Seu pedido de *${productName}* no valor de *R$ ${total}* foi confirmado com sucesso!

🏆 *Você está concorrendo a R$ 100.000,00 pela Federal!*

*Próximos passos:*
✅ Entre na nossa comunidade VIP
📱 Acompanhe os sorteios ao vivo
🎯 Boa sorte na sua sorte!

👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 🍀
_Sua sorte começa agora!_`;
}

export const ORDER_PAID_CONFIG = {
  templateType: 'order_paid',
  client: 'imperio',
  features: {
    antibanEnabled: true,
    typingSimulation: true,
    randomDelays: true
  }
};