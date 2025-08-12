// Variações de mensagens para pedido expirado com sistema de pesos
export const ORDER_EXPIRED_VARIATIONS = [
  {
    id: 'formal',
    weight: 30,
    template: `🎰 Olá {{customerName}}! 

⏰ *ATENÇÃO: Suas cotas estão prestes a expirar!*

📊 *Detalhes da sua reserva:*
🎫 *Sorteio:* {{productName}}
💰 *Valor Total:* R$ {{total}}

🏆 *PREMIAÇÃO TOTAL: R$ 170.000,00*
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
• Valor: R$ {{total}}

💰 *Prêmio de R$ 170.000,00 te esperando!*

⚡ *Finalize agora:*
https://imperiopremios.com/campanha/rapidinha-r-20000000-em-premiacoes?afiliado=A0RJJ5L1QK

⏰ *TEMPO ESGOTANDO!* Não deixe R$ 170.000,00 passar!

*Império Prêmios* 🎲`
  },
  {
    id: 'casual',
    weight: 30,
    template: `🔔 *Oi {{customerName}}!*

⚠️ *Última chance para suas cotas!*

🎟️ Sorteio: {{productName}}
💰 Valor: R$ {{total}}

🏆 *Concorra a R$ 170.000,00!*

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
  const totalWeight = ORDER_EXPIRED_VARIATIONS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const variation of ORDER_EXPIRED_VARIATIONS) {
    random -= variation.weight;
    if (random < 0) {
      return variation;
    }
  }
  
  return ORDER_EXPIRED_VARIATIONS[0]; // fallback
}

/**
 * Obter variação específica por ID
 */
export function getVariationById(id) {
  return ORDER_EXPIRED_VARIATIONS.find(v => v.id === id) || ORDER_EXPIRED_VARIATIONS[0];
}

/**
 * Função para selecionar variação aleatória (compatibilidade)
 */
export const getRandomVariation = () => {
  const variation = selectVariation();
  return variation.template;
};

export default {
  variations: ORDER_EXPIRED_VARIATIONS,
  selectVariation,
  getVariationById,
  getRandomVariation
};