// Broadcast templates with interactive buttons for ZAPI

export const BROADCAST_TEMPLATES = {
  // Promotional campaign
  promotional: {
    name: 'Campanha Promocional',
    message: `🎉 *{{userName}}, PROMOÇÃO EXCLUSIVA!*

🏆 *SORTEIO ESPECIAL IMPÉRIO PREMIAÇÕES*

💰 *PRÊMIO PRINCIPAL:*
💵 R$ 170.000,00 em dinheiro

🎯 *SORTEIO PELA LOTERIA FEDERAL*

⏰ *ÚLTIMAS VAGAS DISPONÍVEIS*
🎟️ Apenas {{availableQuotas}} cotas restantes

💥 *OFERTA ESPECIAL:*
{{promotionDetails}}

🍀 *Não perca esta oportunidade única!*`,
    
    buttons: [
      {
        id: 'buy_now',
        title: '🛒 Comprar Agora',
        type: 'reply'
      },
      {
        id: 'more_info',
        title: '📋 Mais Informações', 
        type: 'reply'
      },
      {
        id: 'join_community',
        title: '👥 Entrar no Grupo',
        type: 'reply'
      }
    ]
  },

  // Winner announcement
  winner_announcement: {
    name: 'Anúncio de Ganhador',
    message: `🏆 *TEMOS UM GANHADOR!*

🎊 *PARABÉNS {{winnerName}}!*

💰 *PRÊMIO CONQUISTADO:*
💵 R$ {{prizeAmount}}

🎯 *SORTEIO:* {{contestName}}
📅 *DATA:* {{drawDate}}

🎉 *O sonho virou realidade!*

👥 *Próximo sorteio já disponível:*
🎟️ {{nextContestName}}
💰 R$ {{nextPrizeAmount}}`,
    
    buttons: [
      {
        id: 'participate_next',
        title: '🎯 Participar do Próximo',
        type: 'reply'
      },
      {
        id: 'see_proof',
        title: '📸 Ver Comprovante',
        type: 'reply'
      },
      {
        id: 'congratulate',
        title: '🎉 Parabenizar',
        type: 'reply'
      }
    ]
  },

  // New contest launch
  new_contest: {
    name: 'Novo Sorteio Disponível',
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

🔥 *SEJA UM DOS PRIMEIROS!*`,
    
    buttons: [
      {
        id: 'reserve_quota',
        title: '🎟️ Reservar Cota',
        type: 'reply'
      },
      {
        id: 'view_rules',
        title: '📋 Ver Regulamento',
        type: 'reply'
      },
      {
        id: 'set_reminder',
        title: '⏰ Lembrete de Início',
        type: 'reply'
      }
    ]
  },

  // Abandoned cart recovery
  abandoned_cart: {
    name: 'Recuperação de Carrinho',
    message: `🛒 *{{userName}}, suas cotas estão esperando!*

⏰ *VOCÊ ESQUECEU DE FINALIZAR SUA COMPRA*

🎟️ *ITENS NO SEU CARRINHO:*
{{cartItems}}

💰 *VALOR TOTAL:* R$ {{cartTotal}}

🏆 *VOCÊ AINDA PODE CONCORRER A:*
💵 R$ 170.000,00

⚡ *FINALIZE AGORA E GARANTE SUA PARTICIPAÇÃO!*

🎯 Suas cotas serão liberadas em {{expirationTime}}`,
    
    buttons: [
      {
        id: 'complete_purchase',
        title: '✅ Finalizar Compra',
        type: 'reply'
      },
      {
        id: 'modify_cart',
        title: '✏️ Modificar Carrinho',
        type: 'reply'
      },
      {
        id: 'clear_cart',
        title: '🗑️ Limpar Carrinho',
        type: 'reply'
      }
    ]
  },

  // VIP invite
  vip_invite: {
    name: 'Convite VIP',
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

🔥 *Aceite o convite agora!*`,
    
    buttons: [
      {
        id: 'accept_vip',
        title: '👑 Aceitar Convite VIP',
        type: 'reply'
      },
      {
        id: 'vip_benefits',
        title: '📋 Ver Todos Benefícios',
        type: 'reply'
      },
      {
        id: 'maybe_later',
        title: '⏰ Talvez Mais Tarde',
        type: 'reply'
      }
    ]
  },

  // Contest reminder
  contest_reminder: {
    name: 'Lembrete de Sorteio',
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

🍀 *BOA SORTE!*
Em breve você pode ser nosso próximo milionário!`,
    
    buttons: [
      {
        id: 'add_more_quotas',
        title: '➕ Comprar Mais Cotas',
        type: 'reply'
      },
      {
        id: 'watch_live',
        title: '📺 Assistir ao Vivo',
        type: 'reply'
      },
      {
        id: 'share_luck',
        title: '🍀 Compartilhar Sorte',
        type: 'reply'
      }
    ]
  }
};

// Template helper function
export const getBroadcastTemplate = (templateName) => {
  const template = BROADCAST_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Broadcast template '${templateName}' not found`);
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

// Get template with buttons
export const getBroadcastTemplateWithButtons = (templateName) => {
  const template = BROADCAST_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Broadcast template '${templateName}' not found`);
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
    buttons: template.buttons,
    name: template.name
  };
};

// List all available templates
export const listBroadcastTemplates = () => {
  return Object.entries(BROADCAST_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    hasButtons: template.buttons && template.buttons.length > 0,
    buttonCount: template.buttons?.length || 0
  }));
};

// Template validation
export const validateTemplateData = (templateName, data) => {
  const template = BROADCAST_TEMPLATES[templateName];
  
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
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
    throw new Error(`Missing required variables for template '${templateName}': ${requiredVars.join(', ')}`);
  }

  return true;
};

export default {
  BROADCAST_TEMPLATES,
  getBroadcastTemplate,
  getBroadcastTemplateWithButtons,
  listBroadcastTemplates,
  validateTemplateData
};