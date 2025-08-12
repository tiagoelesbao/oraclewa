/**
 * Template para pedidos pagos - Template para novos clientes
 */
export function generateOrderPaidMessage(customerName, productName, total) {
  return `🎉 *PAGAMENTO CONFIRMADO*

Parabéns *${customerName}*! ✅

Seu pedido de *${productName}* no valor de *R$ ${total}* foi confirmado com sucesso!

🏆 Agradecemos pela sua compra!

*Próximos passos:*
✅ Acompanhe seu pedido
📱 Entre em contato para dúvidas
🎯 Obrigado pela preferência!

*Sua Empresa* 🚀
_Sempre à disposição!_`;
}

export const ORDER_PAID_CONFIG = {
  templateType: 'order_paid',
  client: 'template',
  features: {
    antibanEnabled: true,
    typingSimulation: true,
    randomDelays: true
  }
};