/**
 * Variações de Templates - Império Order Expired
 * Sistema de variações para evitar detecção de spam
 */

export const IMPERIO_ORDER_EXPIRED_VARIATIONS = [
  {
    id: 'formal',
    weight: 30,
    template: `🎰 Olá {{customerName}}! 

⏰ *ATENÇÃO: Suas cotas estão prestes a expirar!*

📊 *Detalhes da sua reserva:*
🎫 *Sorteio:* {{productName}}
🔢 *Quantidade:* {{quantity}} cota(s)
💰 *Valor Total:* R$ {{totalValue}}
📅 *Expira em:* {{expirationDate}}

🏆 *PREMIAÇÃO TOTAL: R$ 100.000,00*
🎯 Sorteio pela Loteria Federal

⚠️ *Não perca sua chance de concorrer!*

⏳ Após o vencimento, suas cotas serão liberadas para outros participantes.

🌐 *Para garantir suas cotas, acesse nosso site:*
https://imperiopremios.com/campanha/rapidinha-r-20000000-em-premiacoes?afiliado=A0RJJ5L1QK

🍀 Boa sorte!
📞 Dúvidas? Responda esta mensagem.

*Império Prêmios* 🏆`
  },
  {
    id: 'urgent',
    weight: 40,
    template: `⏱️ *{{customerName}}, ÚLTIMAS HORAS!*

🚨 *URGENTE: Suas cotas expirando!*

📋 *Informações:*
• Sorteio: {{productName}}
• Valor: R$ {{totalValue}}
• Vence: {{expirationDate}}

💰 *Prêmio de R$ 100.000,00 te esperando!*

⚡ *Finalize agora:*
https://imperiopremios.com/campanha/rapidinha-r-20000000-em-premiacoes?afiliado=A0RJJ5L1QK

⏰ *TEMPO ESGOTANDO!* Não deixe R$ 100.000,00 passar!

*Império Prêmios* 🎲`
  },
  {
    id: 'casual',
    weight: 30,
    template: `🔔 *Oi {{customerName}}!*

⚠️ *Última chance para suas cotas!*

🎟️ Suas cotas - R$ {{totalValue}}
📅 Expira: {{expirationDate}}

🏆 *Concorra a R$ 100.000,00!*

🔗 *Garanta agora:*
https://imperiopremios.com/campanha/rapidinha-r-20000000-em-premiacoes?afiliado=A0RJJ5L1QK

⏰ O tempo está acabando...

*Império Prêmios* 🍀`
  }
];

/**
 * Seleciona variação baseada em peso
 */
export function selectVariation() {
  const totalWeight = IMPERIO_ORDER_EXPIRED_VARIATIONS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const variation of IMPERIO_ORDER_EXPIRED_VARIATIONS) {
    random -= variation.weight;
    if (random < 0) {
      return variation;
    }
  }
  
  return IMPERIO_ORDER_EXPIRED_VARIATIONS[0]; // fallback
}

/**
 * Obter variação específica por ID
 */
export function getVariationById(id) {
  return IMPERIO_ORDER_EXPIRED_VARIATIONS.find(v => v.id === id) || IMPERIO_ORDER_EXPIRED_VARIATIONS[0];
}

/**
 * Obter variação aleatória simples
 */
export function getRandomVariation() {
  const index = Math.floor(Math.random() * IMPERIO_ORDER_EXPIRED_VARIATIONS.length);
  return IMPERIO_ORDER_EXPIRED_VARIATIONS[index];
}

export default {
  variations: IMPERIO_ORDER_EXPIRED_VARIATIONS,
  selectVariation,
  getVariationById,
  getRandomVariation
};