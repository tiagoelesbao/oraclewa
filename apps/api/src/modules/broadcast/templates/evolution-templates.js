// Templates optimized for Evolution API (no buttons, enhanced CTAs)

export const EVOLUTION_TEMPLATES = {
  // Promotional campaign optimized for Evolution
  promotional_evolution: {
    name: 'Campanha Promocional (Evolution)',
    message: `🎉 *{{userName}}, PROMOÇÃO EXCLUSIVA!*

🏆 *SORTEIO ESPECIAL IMPÉRIO PREMIAÇÕES*

💰 *PRÊMIO PRINCIPAL:*
💵 R$ 170.000,00 em dinheiro

🎯 *SORTEIO PELA LOTERIA FEDERAL*

⏰ *ÚLTIMAS VAGAS DISPONÍVEIS*
🎟️ Apenas {{availableQuotas}} cotas restantes

💥 *OFERTA ESPECIAL:*
{{promotionDetails}}

🎯 *ESCOLHA UMA OPÇÃO:*

🛒 *COMPRAR AGORA*
📱 Responda: *"1"* ou *"COMPRAR"*
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=A0RJJ5L1QK

📋 *MAIS INFORMAÇÕES* 
📱 Responda: *"2"* ou *"INFO"*

👥 *ENTRAR NO GRUPO VIP*
📱 Responda: *"3"* ou *"GRUPO"*
👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

💬 *Ou responda com sua dúvida!*
🤖 _Resposta automática ativa_

🍀 *Não perca esta oportunidade única!*
_Império Premiações - Realizando sonhos_ 🏆`,
    
    ctas: [
      { id: 'buy_now', text: 'COMPRAR', number: '1' },
      { id: 'more_info', text: 'INFO', number: '2' },
      { id: 'join_community', text: 'GRUPO', number: '3' }
    ]
  },

  // Winner announcement for Evolution
  winner_announcement_evolution: {
    name: 'Anúncio de Ganhador (Evolution)',
    message: `🏆 *TEMOS UM GANHADOR!*

🎊 *PARABÉNS {{winnerName}}!*

💰 *PRÊMIO CONQUISTADO:*
💵 R$ {{prizeAmount}}

🎯 *SORTEIO:* {{contestName}}
📅 *DATA:* {{drawDate}}

🎉 *O sonho virou realidade!*

👥 *PRÓXIMO SORTEIO DISPONÍVEL:*
🎟️ {{nextContestName}}
💰 R$ {{nextPrizeAmount}}

🎯 *SUAS OPÇÕES:*

🎯 *PARTICIPAR DO PRÓXIMO*
📱 Responda: *"1"* ou *"PARTICIPAR"*

📸 *VER COMPROVANTE*
📱 Responda: *"2"* ou *"COMPROVANTE"*

🎉 *PARABENIZAR O GANHADOR*
📱 Responda: *"3"* ou *"PARABENS"*

💬 *Ou responda com sua mensagem!*
🤖 _Sistema automático ativo_

🍀 *Você pode ser o próximo!*
_Império Premiações_ 🏆`,
    
    ctas: [
      { id: 'participate_next', text: 'PARTICIPAR', number: '1' },
      { id: 'see_proof', text: 'COMPROVANTE', number: '2' },
      { id: 'congratulate', text: 'PARABENS', number: '3' }
    ]
  },

  // New contest launch for Evolution
  new_contest_evolution: {
    name: 'Novo Sorteio Disponível (Evolution)',
    message: `🚀 *NOVO SORTEIO DISPONÍVEL!*

🏆 *{{contestName}}*

💰 *PRÊMIO PRINCIPAL:*
💵 R$ {{prizeAmount}}

🎯 *DETALHES:*
📅 Data do Sorteio: {{drawDate}}
🎟️ Total de Cotas: {{totalQuotas}}
💳 Valor por Cota: R$ {{quotaPrice}}

⏰ *INÍCIO DAS VENDAS:*
{{saleStartDate}} às {{saleStartTime}}

🎯 *AÇÕES RÁPIDAS:*

🎟️ *RESERVAR COTA*
📱 Responda: *"1"* ou *"RESERVAR"*

📋 *VER REGULAMENTO*
📱 Responda: *"2"* ou *"REGULAMENTO"*

⏰ *LEMBRETE DE INÍCIO*
📱 Responda: *"3"* ou *"LEMBRETE"*

🔥 *LINK DIRETO:*
👉 https://imperiopremioss.com/sorteios/{{contestSlug}}

💬 *Dúvidas? Responda esta mensagem!*
🤖 _Atendimento automático_

🔥 *SEJA UM DOS PRIMEIROS!*
_Império Premiações_ 🏆`,
    
    ctas: [
      { id: 'reserve_quota', text: 'RESERVAR', number: '1' },
      { id: 'view_rules', text: 'REGULAMENTO', number: '2' },
      { id: 'set_reminder', text: 'LEMBRETE', number: '3' }
    ]
  },

  // Abandoned cart recovery for Evolution
  abandoned_cart_evolution: {
    name: 'Recuperação de Carrinho (Evolution)',
    message: `🛒 *{{userName}}, suas cotas estão esperando!*

⏰ *VOCÊ ESQUECEU DE FINALIZAR SUA COMPRA*

🎟️ *ITENS NO SEU CARRINHO:*
{{cartItems}}

💰 *VALOR TOTAL:* R$ {{cartTotal}}

🏆 *VOCÊ AINDA PODE CONCORRER A:*
💵 R$ 170.000,00

⚡ *SUAS OPÇÕES RÁPIDAS:*

✅ *FINALIZAR COMPRA*
📱 Responda: *"1"* ou *"FINALIZAR"*
👉 https://imperiopremioss.com/checkout

✏️ *MODIFICAR CARRINHO*
📱 Responda: *"2"* ou *"MODIFICAR"*

🗑️ *LIMPAR CARRINHO*
📱 Responda: *"3"* ou *"LIMPAR"*

⏰ *ATENÇÃO:*
🎯 Suas cotas serão liberadas em {{expirationTime}}

💬 *Precisa de ajuda? Responda!*
🤖 _Suporte automático disponível_

⚡ *FINALIZE AGORA E GARANTA SUA PARTICIPAÇÃO!*
_Império Premiações_ 🏆`,
    
    ctas: [
      { id: 'complete_purchase', text: 'FINALIZAR', number: '1' },
      { id: 'modify_cart', text: 'MODIFICAR', number: '2' },
      { id: 'clear_cart', text: 'LIMPAR', number: '3' }
    ]
  },

  // VIP invite for Evolution
  vip_invite_evolution: {
    name: 'Convite VIP (Evolution)',
    message: `👑 *CONVITE EXCLUSIVO VIP*

🎊 *Olá {{userName}}!*

Você foi selecionado(a) para fazer parte do nosso *GRUPO VIP IMPÉRIO PREMIAÇÕES*

🏆 *BENEFÍCIOS EXCLUSIVOS:*
🎯 Sorteios exclusivos para VIPs
💰 Descontos especiais
📢 Novidades em primeira mão
🎁 Brindes e promoções
👥 Comunidade seleta

💎 *ENTRADA LIMITADA*
Apenas {{vipSlots}} vagas disponíveis

🎯 *SUAS OPÇÕES:*

👑 *ACEITAR CONVITE VIP*
📱 Responda: *"1"* ou *"ACEITAR"*
👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF

📋 *VER TODOS BENEFÍCIOS*
📱 Responda: *"2"* ou *"BENEFICIOS"*

⏰ *TALVEZ MAIS TARDE*
📱 Responda: *"3"* ou *"DEPOIS"*

💬 *Dúvidas sobre o VIP? Pergunte!*
🤖 _Consultoria automática_

🔥 *ACEITE O CONVITE AGORA!*
_Império Premiações VIP_ 👑`,
    
    ctas: [
      { id: 'accept_vip', text: 'ACEITAR', number: '1' },
      { id: 'vip_benefits', text: 'BENEFICIOS', number: '2' },
      { id: 'maybe_later', text: 'DEPOIS', number: '3' }
    ]
  },

  // Contest reminder for Evolution
  contest_reminder_evolution: {
    name: 'Lembrete de Sorteio (Evolution)',
    message: `⏰ *LEMBRETE IMPORTANTE!*

🏆 *{{contestName}}*

🎯 *SORTEIO ACONTECE:*
📅 {{drawDate}}
🕐 {{drawTime}}

💰 *PRÊMIO EM JOGO:*
💵 R$ {{prizeAmount}}

🎟️ *SUAS COTAS:*
Você tem {{userQuotas}} cota(s) participando

📺 *ACOMPANHE AO VIVO:*
{{liveStreamLink}}

🎯 *ÚLTIMAS AÇÕES:*

➕ *COMPRAR MAIS COTAS*
📱 Responda: *"1"* ou *"MAIS"*

📺 *ASSISTIR AO VIVO*
📱 Responda: *"2"* ou *"VIVO"*
👉 {{liveStreamLink}}

🍀 *COMPARTILHAR SORTE*
📱 Responda: *"3"* ou *"COMPARTILHAR"*

💬 *Mensagem de apoio? Responda!*
🤖 _Sistema de sorte automático_

🍀 *BOA SORTE!*
Em breve você pode ser nosso próximo milionário!

_Império Premiações - Realizando sonhos_ 🏆`,
    
    ctas: [
      { id: 'add_more_quotas', text: 'MAIS', number: '1' },
      { id: 'watch_live', text: 'VIVO', number: '2' },
      { id: 'share_luck', text: 'COMPARTILHAR', number: '3' }
    ]
  }
};

// Template helper function for Evolution
export const getEvolutionTemplate = (templateName) => {
  const template = EVOLUTION_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Evolution template '${templateName}' not found`);
  }

  return (data = {}) => {
    let message = template.message;
    
    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return message;
  };
};

// Get template with CTAs for Evolution
export const getEvolutionTemplateWithCTAs = (templateName) => {
  const template = EVOLUTION_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Evolution template '${templateName}' not found`);
  }

  return {
    compile: (data = {}) => {
      let message = template.message;
      
      // Replace template variables
      Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value || '');
      });

      return message;
    },
    ctas: template.ctas,
    name: template.name,
    provider: 'evolution'
  };
};

// List all available Evolution templates
export const listEvolutionTemplates = () => {
  return Object.entries(EVOLUTION_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    provider: 'evolution',
    hasCTAs: template.ctas && template.ctas.length > 0,
    ctaCount: template.ctas?.length || 0
  }));
};

// Template validation for Evolution
export const validateEvolutionTemplateData = (templateName, data) => {
  const template = EVOLUTION_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Evolution template '${templateName}' not found`);
  }

  // Extract required variables from template
  const requiredVars = [];
  const templateVars = template.message.match(/\{\{(\w+)\}\}/g) || [];
  
  templateVars.forEach(variable => {
    const varName = variable.replace(/\{\{|\}\}/g, '');
    if (!data.hasOwnProperty(varName)) {
      requiredVars.push(varName);
    }
  });

  if (requiredVars.length > 0) {
    throw new Error(`Missing required variables for Evolution template '${templateName}': ${requiredVars.join(', ')}`);
  }

  return true;
};

// CTA response mapping for Evolution
export const getEvolutionCTAResponse = (templateName, ctaInput) => {
  const template = EVOLUTION_TEMPLATES[templateName];
  
  if (!template || !template.ctas) {
    return null;
  }

  const lowerInput = ctaInput.toLowerCase().trim();
  
  // Find matching CTA by number or text
  const matchingCTA = template.ctas.find(cta => 
    cta.number === lowerInput || 
    cta.text.toLowerCase() === lowerInput ||
    cta.id === lowerInput
  );

  return matchingCTA || null;
};

export default {
  EVOLUTION_TEMPLATES,
  getEvolutionTemplate,
  getEvolutionTemplateWithCTAs,
  listEvolutionTemplates,
  validateEvolutionTemplateData,
  getEvolutionCTAResponse
};