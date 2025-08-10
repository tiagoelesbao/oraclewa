/**
 * Variações de Templates - Império Order Paid
 * Sistema de variações para evitar detecção de spam
 */

export const IMPERIO_ORDER_PAID_VARIATIONS = [
  {
    id: 'congratulations',
    weight: 35,
    template: `🎉 *PARABÉNS, {{customerName}}!*

✅ *Pagamento Confirmado!*

━━━━━━━━━━━━━━━
📊 *SEUS NÚMEROS*
━━━━━━━━━━━━━━━

🎫 {{productName}}
💰 *R$ {{totalValue}}*

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

💰 *Total: R$ {{totalValue}}*

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

🎫 *Suas cotas*
💵 *R$ {{totalValue}}*

━━━━━━━━━━━━━━━

💰 *Prêmio:*
*R$ 170.000,00*

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
  const totalWeight = IMPERIO_ORDER_PAID_VARIATIONS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const variation of IMPERIO_ORDER_PAID_VARIATIONS) {
    random -= variation.weight;
    if (random < 0) {
      return variation;
    }
  }
  
  return IMPERIO_ORDER_PAID_VARIATIONS[0]; // fallback
}

/**
 * Obter variação específica por ID
 */
export function getVariationById(id) {
  return IMPERIO_ORDER_PAID_VARIATIONS.find(v => v.id === id) || IMPERIO_ORDER_PAID_VARIATIONS[0];
}

/**
 * Obter variação aleatória simples
 */
export function getRandomVariation() {
  const index = Math.floor(Math.random() * IMPERIO_ORDER_PAID_VARIATIONS.length);
  return IMPERIO_ORDER_PAID_VARIATIONS[index];
}

export default {
  variations: IMPERIO_ORDER_PAID_VARIATIONS,
  selectVariation,
  getVariationById,
  getRandomVariation
};