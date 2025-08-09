// Variações de mensagens para pedido expirado
export const ORDER_EXPIRED_VARIATIONS = [
  {
    template: `🎰 Olá {{user.name}}! 

⏰ *ATENÇÃO: Suas cotas estão prestes a expirar!*

📊 *Detalhes da sua reserva:*
🎫 *Sorteio:* {{product.title}}
🔢 *Quantidade:* {{quantity}} cota(s)
💰 *Valor Total:* R$ {{total}}
📅 *Expira em:* {{expirationAt}}

🏆 *PREMIAÇÃO TOTAL: R$ 170.000,00*
🎯 Sorteio pela Loteria Federal

⚠️ *Não perca sua chance de concorrer!*

⏳ Após o vencimento, suas cotas serão liberadas para outros participantes.

🌐 *Para garantir suas cotas, acesse nosso site:*
https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK

🍀 Boa sorte!
📞 Dúvidas? Responda esta mensagem.

*Império Premiações* 🏆`
  },
  {
    template: `⏱️ *{{user.name}}, ÚLTIMAS HORAS!*

🚨 *URGENTE: {{quantity}} cotas expirando!*

📋 *Informações:*
• Sorteio: {{product.title}}
• Valor: R$ {{total}}
• Vence: {{expirationAt}}

💰 *Prêmio de R$ 170.000,00 te esperando!*

⚡ *Finalize agora:*
https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK

⏰ *TEMPO ESGOTANDO!* Não deixe R$ 170.000,00 passar!

*Império Premiações* 🎲`
  },
  {
    template: `🔔 *Oi {{user.name}}!*

⚠️ *Última chance para suas cotas!*

🎟️ {{quantity}} cotas - R$ {{total}}
📅 Expira: {{expirationAt}}

🏆 *Concorra a R$ 170.000,00!*

🔗 *Garanta agora:*
https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK

⏰ O tempo está acabando...

*Império* 🍀`
  }
];

// Função para selecionar variação aleatória
export const getRandomVariation = () => {
  const index = Math.floor(Math.random() * ORDER_EXPIRED_VARIATIONS.length);
  return ORDER_EXPIRED_VARIATIONS[index].template;
};