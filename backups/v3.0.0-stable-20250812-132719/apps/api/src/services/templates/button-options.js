// Configurações de botões para mensagens interativas (Evolution API v1.7.1)
export const BUTTON_OPTIONS = {
  ORDER_PAID: {
    title: "🎉 PAGAMENTO CONFIRMADO!",
    description: "Sua compra foi aprovada com sucesso!",
    footer: "Império Premiações 🏆",
    buttons: [
      {
        title: "🔗 Entrar na Comunidade",
        displayText: "🔗 Entrar na Comunidade",
        id: "join_community"
      },
      {
        title: "✅ Confirmar Recebimento",
        displayText: "✅ Confirmar Recebimento",
        id: "confirm_receipt"
      }
    ]
  },
  
  ORDER_EXPIRED: {
    title: "⏰ PEDIDO EXPIRADO",
    description: "Seu pedido expirou, mas você ainda pode participar!",
    footer: "Império Premiações 🏆",
    buttons: [
      {
        title: "🔄 Renovar Participação",
        displayText: "Quero renovar minha participação",
        id: "renew_order"
      },
      {
        title: "🔗 Entrar na Comunidade",
        displayText: "https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ac_t",
        id: "join_community"
      }
    ]
  }
};

// Função para obter opções de botão por tipo
export const getButtonOptions = (messageType) => {
  return BUTTON_OPTIONS[messageType] || null;
};

// Função para processar clique de botão
export const handleButtonClick = async (buttonId, phoneNumber, messageType) => {
  switch (buttonId) {
    case 'join_community':
      // Log do redirecionamento para comunidade
      console.log(`User ${phoneNumber} clicked to join community from ${messageType}`);
      return {
        action: 'redirect',
        message: '🎯 Acesse nossa comunidade VIP: https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ac_t'
      };
      
    case 'confirm_receipt':
      // Log da confirmação de recebimento
      console.log(`User ${phoneNumber} confirmed receipt of ${messageType}`);
      return {
        action: 'confirm',
        message: '✅ Recebimento confirmado! Muito obrigado!'
      };
      
    case 'renew_order':
      // Log da renovação
      console.log(`User ${phoneNumber} wants to renew order`);
      return {
        action: 'renew',
        message: '🔄 Vamos renovar sua participação! Em instantes você receberá as instruções.'
      };
      
    default:
      console.log(`Unknown button clicked: ${buttonId} by ${phoneNumber}`);
      return {
        action: 'unknown',
        message: '❓ Opção não reconhecida. Por favor, tente novamente.'
      };
  }
};

export default {
  BUTTON_OPTIONS,
  getButtonOptions,
  handleButtonClick
};