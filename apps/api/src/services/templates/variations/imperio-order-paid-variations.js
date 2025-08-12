/**
 * Variações de mensagens para pedidos pagos - Império Prêmios
 * Sistema anti-ban com múltiplas variações de texto
 */

const ORDER_PAID_VARIATIONS = [
  // Variação 1 - Entusiástica
  `🎉 *PAGAMENTO CONFIRMADO!*

Que alegria *{{user.name}}*! ✅

Seu pedido de *{{quantity}} cotas* no valor de *R$ {{total}}* foi aprovado!

🏆 *Agora você concorre a R$ 100.000,00!*

*Próximos passos:*
✅ Entre no nosso grupo VIP
🎯 Acompanhe os sorteios
📱 Boa sorte na sua jornada!

👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 🍀`,

  // Variação 2 - Profissional
  `✅ *COMPRA APROVADA COM SUCESSO*

Olá *{{user.name}}*,

Confirmamos o pagamento de *R$ {{total}}* referente às suas *{{quantity}} cotas*.

🎲 *Você está participando do sorteio de R$ 100.000,00!*

*Para acompanhar tudo:*
📱 Acesse nossa comunidade exclusiva
🔴 Acompanhe transmissões ao vivo
🏆 Boa sorte no sorteio!

🔗 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios*
_Realizando sonhos desde 2020_ 🌟`,

  // Variação 3 - Amigável
  `🚀 *TUDO CERTO POR AQUI!*

E aí *{{user.name}}*! 😊

Seu pagamento de *R$ {{total}}* pelas *{{quantity}} cotas* foi processado!

💰 *Você já está concorrendo aos R$ 100.000,00!*

*Bora para o grupo:*
👥 Comunidade exclusiva dos participantes
📺 Lives dos sorteios
🎊 Muita diversão te esperando!

👇 Clique aqui:
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 
_Sua sorte começa agora!_ 🎲`,

  // Variação 4 - Motivacional
  `⭐ *PARABÉNS PELA COMPRA!*

*{{user.name}}*, você deu o primeiro passo! 👏

✅ Pagamento confirmado: *R$ {{total}}*
🎯 Cotas adquiridas: *{{quantity}}*
🏆 Prêmio em disputa: *R$ 100.000,00*

*Agora é só aguardar:*
📅 Sorteio pela Loteria Federal
🎥 Transmissão ao vivo no grupo
💪 Você tem chances reais de ganhar!

🔥 Entre no nosso grupo VIP:
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 💎`,

  // Variação 5 - Simples e direta
  `🎯 *PAYMENT APPROVED*

Hi *{{user.name}}*! 

Your *{{quantity}} entries* worth *R$ {{total}}* are confirmed!

🏅 *Now competing for R$ 100,000.00*

Join our VIP community:
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

*Império Prêmios* 🍀
_Good luck!_ ✨`
];

/**
 * Retorna uma variação aleatória de mensagem
 */
export function getRandomVariation() {
  const randomIndex = Math.floor(Math.random() * ORDER_PAID_VARIATIONS.length);
  return ORDER_PAID_VARIATIONS[randomIndex];
}

/**
 * Retorna todas as variações disponíveis
 */
export function getAllVariations() {
  return [...ORDER_PAID_VARIATIONS];
}

/**
 * Retorna o número total de variações
 */
export function getVariationCount() {
  return ORDER_PAID_VARIATIONS.length;
}