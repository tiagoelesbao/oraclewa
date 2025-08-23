/**
 * Template para pedidos expirados - Cliente Império
 */
export function generateOrderExpiredMessage(customerName, productName, total, customParams) {
  // Se há texto customizado (para testes), usar ele
  if (customParams?.customText) {
    return customParams.customText;
  }
  
  // TEMPLATE OTIMIZADO FINAL - Máxima conversão para conta pessoal
  return `🚨 ${customerName}, seu pedido EXPIROU!

⏰ ÚLTIMAS HORAS para resgatar!

📱 COMO ACESSAR:
🔸 Abra qualquer navegador
🔸 Digite: imperiopremioss.com  
🔸 Clique em "RAPIDINHA"

🔍 OU simplesmente busque:
"Imperio Premios" no Google

💰 Não perca sua chance!
⚡ Expire em breve!`;
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