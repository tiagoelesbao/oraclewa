/**
 * Variações de mensagens para pedidos expirados - Império Prêmios
 * Sistema anti-ban com múltiplas variações de texto
 */

const ORDER_EXPIRED_VARIATIONS = [
  // Variação 1 - Urgente
  `⏰ *SUA RESERVA ESTÁ EXPIRANDO!*

Oi *{{user.name}}*,

Suas *{{quantity}} cotas* no valor de *R$ {{total}}* estão prestes a expirar!

🚨 *Última chance de garantir sua participação!*

*Finalize agora:*
💳 Pagamento rápido via PIX
⚡ Confirmação instantânea
🏆 Concorra aos R$ 100.000,00

⏰ *Tempo limitado!*

*Império Prêmios* 🍀
_Não deixe sua sorte escapar!_`,

  // Variação 2 - Amigável
  `😊 *OLÁ {{user.name}}!*

Notamos que você separou *{{quantity}} cotas* por *R$ {{total}}*, mas ainda não finalizou o pagamento.

⚠️ *Sua reserva expira em breve!*

*Para garantir suas cotas:*
📱 Efetue o pagamento via PIX
✅ Receba confirmação imediata
🎯 Participe do sorteio de R$ 100.000,00

*Não perca esta oportunidade!*

*Império Prêmios* 🌟`,

  // Variação 3 - Profissional
  `📋 *LEMBRETE DE PAGAMENTO*

Caro(a) *{{user.name}}*,

Identificamos uma reserva pendente:
• Produto: {{quantity}} cotas
• Valor: R$ {{total}}
• Status: Aguardando pagamento

⏳ *Prazo de vencimento se aproxima*

*Procedimentos para finalizar:*
1. Realize o pagamento via PIX
2. Aguarde confirmação automática  
3. Participe do sorteio

*Império Prêmios*
_Atendimento especializado_ 📞`,

  // Variação 4 - Motivacional
  `🎲 *NÃO DESISTA DA SUA SORTE!*

*{{user.name}}*, você está a um passo de concorrer aos *R$ 100.000,00*!

💰 Suas {{quantity}} cotas (R$ {{total}}) estão reservadas, mas o tempo está passando...

⚡ *Finalize AGORA:*
🔥 Pagamento instantâneo via PIX
✨ Entre na disputa pelos 100 mil
🏆 Sorteio pela Loteria Federal

*Sua chance de ganhar está esperando!*

*Império Prêmios* 💎
_Transforme sua vida hoje!_`,

  // Variação 5 - Informal
  `👋 *E AÍ {{user.name}}?*

Suas *{{quantity}} cotas* de *R$ {{total}}* ainda estão te esperando! 😉

⏰ *Mas corre que o prazo tá acabando!*

*Bora finalizar:*
💚 PIX na hora
🎯 Já concorre hoje mesmo
🍀 R$ 100.000,00 podem ser seus!

*Não deixa passar!*

*Império Prêmios* 🚀`,

  // Variação 6 - Direta
  `⚠️ *RESERVATION EXPIRING*

*{{user.name}}*, your *{{quantity}} tickets* worth *R$ {{total}}* are about to expire!

🕐 *Final hours to secure your spot*

Quick payment via PIX → Instant confirmation → R$ 100,000.00 prize

*Don't miss out!*

*Império Prêmios* ⭐`
];

/**
 * Retorna uma variação aleatória de mensagem
 */
export function getRandomVariation() {
  const randomIndex = Math.floor(Math.random() * ORDER_EXPIRED_VARIATIONS.length);
  return ORDER_EXPIRED_VARIATIONS[randomIndex];
}

/**
 * Retorna todas as variações disponíveis
 */
export function getAllVariations() {
  return [...ORDER_EXPIRED_VARIATIONS];
}

/**
 * Retorna o número total de variações
 */
export function getVariationCount() {
  return ORDER_EXPIRED_VARIATIONS.length;
}