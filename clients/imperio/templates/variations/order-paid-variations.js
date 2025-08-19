// Variações de mensagens para pagamento aprovado com sistema de pesos
export const ORDER_PAID_VARIATIONS = [
  {
    id: 'congratulations',
    weight: 35,
    template: `🎉 *PARABÉNS, {{customerName}}!*

✅ *Pagamento Confirmado!*

━━━━━━━━━━━━━━━
📊 *SEUS NÚMEROS*
━━━━━━━━━━━━━━━

🎫 {{productName}}
💰 *R$ {{total}}*

━━━━━━━━━━━━━━━
🏆 *PREMIAÇÃO*
━━━━━━━━━━━━━━━

💵 *R$ 100.000,00*
🎯 Loteria Federal

━━━━━━━━━━━━━━━

🍀 *Boa sorte!*

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 🏆`
  },
  {
    id: 'confirmation',
    weight: 35,
    template: `🏆 *{{customerName}}, tudo certo!*

✅ *Pagamento Aprovado*

━━━━━━━━━━━━━━━

🎟️ *Suas cotas*
{{productName}}

💰 *Total: R$ {{total}}*

━━━━━━━━━━━━━━━

🎯 *Concorrendo a:*
💵 *R$ 100.000,00*

━━━━━━━━━━━━━━━

🤞 Boa sorte!

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* ✨`
  },
  {
    id: 'celebration',
    weight: 30,
    template: `✨ *Olá {{customerName}}!*

🎊 *Compra Aprovada!*

━━━━━━━━━━━━━━━

🎫 {{productName}}
💵 *R$ {{total}}*

━━━━━━━━━━━━━━━

💰 *Prêmio:*
*R$ 100.000,00*

📊 Loteria Federal

━━━━━━━━━━━━━━━

🌟 Boa sorte!

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Equipe Império* 🎰`
  }
];

/**
 * Seleciona variação baseada em peso
 */
export function selectVariation() {
  const totalWeight = ORDER_PAID_VARIATIONS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const variation of ORDER_PAID_VARIATIONS) {
    random -= variation.weight;
    if (random < 0) {
      return variation;
    }
  }
  
  return ORDER_PAID_VARIATIONS[0]; // fallback
}

/**
 * Obter variação específica por ID
 */
export function getVariationById(id) {
  return ORDER_PAID_VARIATIONS.find(v => v.id === id) || ORDER_PAID_VARIATIONS[0];
}

/**
 * Função para selecionar variação aleatória (compatibilidade)
 */
export const getRandomVariation = () => {
  const variation = selectVariation();
  return variation.template;
};

export default {
  variations: ORDER_PAID_VARIATIONS,
  selectVariation,
  getVariationById,
  getRandomVariation
};