/**
 * 📝 SCRIPTS DE CONVERSAÇÃO PARA MATURAÇÃO DE CHIPS
 * 
 * Coleção de scripts naturais em português brasileiro para
 * conversas automáticas entre chips em maturação.
 * 
 * Cada script contém:
 * - Mensagens naturais e variadas
 * - Contexto brasileiro autêntico
 * - Diferentes níveis de formalidade
 * - Emojis e expressões típicas
 */

const conversationScripts = {
  
  // ========== CONVERSA CASUAL ==========
  casual_chat: {
    name: 'Conversa Casual',
    description: 'Conversa descontraída entre amigos',
    allowVoiceNotes: true,
    messages: [
      'Oi! Como você está?',
      'Oi! Tudo bem, e você?',
      'Tudo ótimo! O que anda fazendo?',
      'Trabalhando bastante... e você?',
      'Também, mas tá tranquilo',
      'Que bom! Tem planos pro final de semana?',
      'Ainda não decidi... talvez sair um pouco',
      'Legal! Se quiser companhia, me chama',
      'Vou lembrar sim! Obrigado',
      'Por nada! Falamos depois',
      'Beleza, até mais!',
      'Tchau! 😊',
      'E aí, como foi seu dia?',
      'Foi corrido, mas tranquilo... seu?',
      'Também foi bem agitado',
      'Pelo menos já é final de semana né',
      'Verdade! Hora de relaxar um pouco',
      'Exato! Vou assistir Netflix hoje',
      'Boa! Tô pensando em fazer a mesma coisa',
      'Hahaha ótima ideia',
      'Né? Merecemos 😄'
    ]
  },

  // ========== CONSULTA COMERCIAL ==========
  business_inquiry: {
    name: 'Consulta Comercial',
    description: 'Conversa de negócios formal',
    allowVoiceNotes: false,
    messages: [
      'Bom dia! Gostaria de saber mais sobre seus serviços',
      'Bom dia! Claro, posso ajudar. O que gostaria de saber?',
      'Quais são as opções disponíveis?',
      'Temos diferentes pacotes. Qual seria sua necessidade?',
      'Preciso de algo para uma pequena empresa',
      'Perfeito! Temos soluções ideais para esse perfil',
      'Ótimo! Poderia me enviar mais detalhes?',
      'Claro! Vou preparar um material completo',
      'Muito obrigado! Aguardo o contato',
      'Por nada! Enviarei ainda hoje',
      'Excelente! Tenha um bom dia',
      'Igualmente! Qualquer dúvida, estou à disposição',
      'Perfeito, muito obrigado!',
      'De nada! Até logo',
      'Olá, recebi o material que enviou',
      'Que bom! O que achou?',
      'Muito interessante! Gostaria de agendar uma reunião',
      'Claro! Quando seria melhor para você?',
      'Na próxima semana, se possível',
      'Vou verificar a agenda e retorno em breve',
      'Perfeito! Aguardo seu contato'
    ]
  },

  // ========== SUPORTE TÉCNICO ==========
  support_request: {
    name: 'Solicitação de Suporte',
    description: 'Conversa de suporte técnico',
    allowVoiceNotes: true,
    messages: [
      'Olá! Preciso de ajuda com um problema',
      'Olá! Claro, estou aqui para ajudar. Qual o problema?',
      'O sistema não está funcionando corretamente',
      'Entendo. Pode me dar mais detalhes do que está acontecendo?',
      'Não consigo fazer login na minha conta',
      'Vou verificar isso para você. Qual seu usuário?',
      'É usuario@exemplo.com',
      'Deixe-me verificar... encontrei o problema!',
      'Ótimo! O que era?',
      'Estava com bloqueio temporário. Já liberei',
      'Perfeito! Vou tentar agora',
      'Certo! Me avise se conseguir acessar',
      'Funcionou perfeitamente! Muito obrigado',
      'Que ótimo! Fico feliz em ajudar',
      'Vocês têm um suporte excelente',
      'Obrigado pelo feedback! Qualquer coisa, estamos aqui',
      'Com certeza! Até mais',
      'Até mais! Tenha um ótimo dia',
      'Olá novamente! Tudo funcionando bem?',
      'Sim! Está perfeito, obrigado',
      'Que bom! Qualquer problema, me chama'
    ]
  },

  // ========== INTERAÇÃO SOCIAL ==========
  social_interaction: {
    name: 'Interação Social',
    description: 'Conversa social animada',
    allowVoiceNotes: true,
    messages: [
      'Oi pessoal! 😊',
      'Oi! Como está?',
      'Tudo bem! Animado para o jogo hoje?',
      'Muito! Vai ser épico',
      'Verdade! Quem você acha que ganha?',
      'Difícil dizer... mas estou torcendo pelo Brasil',
      'Eu também! Vamos assistir juntos?',
      'Boa ideia! Onde?',
      'Que tal no bar da esquina?',
      'Perfeito! Que horas?',
      'Às 8h? O jogo começa às 9h',
      'Fechado! Nos vemos lá',
      'Show! Até mais tarde então',
      '🍻 Será uma noite boa!',
      'Com certeza! Mal posso esperar',
      'Hahaha vai ser demais!',
      'E aí, chegou bem em casa ontem?',
      'Cheguei sim! Foi uma noite incrível',
      'Verdade! O jogo foi emocionante até o final',
      'Demais! Aquele gol no final... que tensão!',
      'Meu coração quase parou! 😅'
    ]
  },

  // ========== DISCUSSÃO EM GRUPO ==========
  group_discussion: {
    name: 'Discussão em Grupo',
    description: 'Conversa típica de grupo',
    allowVoiceNotes: true,
    messages: [
      'Pessoal, vamos organizar o churrasco?',
      'Boa ideia! Quando seria?',
      'Que tal sábado que vem?',
      'Por mim está ótimo!',
      'Também concordo! Onde fazemos?',
      'Posso ceder minha casa',
      'Perfeito! Quanto cada um leva?',
      'Acho que R$ 30 está bom',
      'Fechado! Vou levar refrigerante',
      'Eu levo a cerveja! 🍺',
      'Ótimo! Eu cuido da carne',
      'E eu faço a farofa especial',
      'Vai ficar top! Que horas começamos?',
      'Meio-dia está bom?',
      'Perfeito para mim!',
      'Confirmado então! Alguém tem som?',
      'Tenho uma JBL boa aqui',
      'Show! Vai ser épico',
      'Mal posso esperar! 😄',
      'Vai ser o churrasco do ano!',
      'Com certeza! Até sábado pessoal!'
    ]
  },

  // ========== BOM DIA ==========
  morning_greeting: {
    name: 'Cumprimento Matinal',
    description: 'Conversas de bom dia',
    allowVoiceNotes: true,
    messages: [
      'Bom dia! ☀️',
      'Bom dia! Como dormiu?',
      'Dormi bem! E você?',
      'Também! Pronto para mais um dia?',
      'Sempre! Hoje vai ser produtivo',
      'Que ótimo! Tenho certeza que sim',
      'E você, tem algo especial hoje?',
      'Tenho uma reunião importante pela manhã',
      'Que legal! Vai dar tudo certo',
      'Obrigado! Torcendo aqui',
      'Sempre! Qualquer coisa me chama',
      'Com certeza! Tenha um dia incrível',
      'Você também! Até mais tarde',
      '😊👍',
      'Oi! Já tomou café?',
      'Acabei de tomar! E você?',
      'Também! Não vivo sem meu cafezinho',
      'Hahaha eu também não! ☕',
      'É combustível para o dia né',
      'Exatamente! Vamos que vamos!',
      'Isso aí! Bom trabalho!'
    ]
  },

  // ========== BOA NOITE ==========
  night_goodbye: {
    name: 'Despedida Noturna',
    description: 'Conversas de boa noite',
    allowVoiceNotes: true,
    messages: [
      'Boa noite pessoal! 🌙',
      'Boa noite! Descanse bem',
      'Obrigado! Você também',
      'Como foi seu dia hoje?',
      'Foi bem corrido, mas produtivo',
      'Que bom! O meu também foi assim',
      'Pelo menos já acabou né 😅',
      'Verdade! Hora de relaxar',
      'Exato! Vou assistir algo na Netflix',
      'Boa pedida! Eu vou ler um pouco',
      'Legal! Que livro está lendo?',
      'Um de ficção científica muito bom',
      'Adoro esse gênero! Recomenda?',
      'Com certeza! Te mando o nome amanhã',
      'Perfeito! Bem, vou dormir então',
      'Eu também! Até amanhã',
      'Até! Sonhos bons! ✨',
      'Para você também! 😴',
      'Boa noite mesmo! 🌟',
      'Noite! Descanse',
      '💤'
    ]
  },

  // ========== FINAL DE SEMANA ==========
  weekend_chat: {
    name: 'Conversa de Final de Semana',
    description: 'Papo sobre o fim de semana',
    allowVoiceNotes: true,
    messages: [
      'Finalmente sexta! 🎉',
      'Verdade! Que alívio!',
      'Tem planos para o fim de semana?',
      'Ainda pensando... e você?',
      'Vou viajar para a praia',
      'Que inveja! Qual praia?',
      'Guarujá! Sempre quis conhecer',
      'É linda lá! Vai amar',
      'Espero que sim! Preciso relaxar',
      'Com certeza vai! Merecido',
      'E você vai fazer o que?',
      'Vou ficar em casa mesmo, descansar',
      'Às vezes é a melhor opção',
      'Verdade! Semana foi bem puxada',
      'A minha também! Que bom que acabou',
      'Agora é só curtir! 😎',
      'Exato! Aproveite sua viagem',
      'Obrigado! Você também descanse',
      'Vou sim! Até segunda então',
      'Até! Bom fim de semana!',
      'Para você também! 🌴'
    ]
  },

  // ========== PIADAS ==========
  joke_sharing: {
    name: 'Compartilhamento de Piadas',
    description: 'Conversa com humor',
    allowVoiceNotes: true,
    messages: [
      'Cara, escutei uma piada muito boa hoje',
      'Conta aí! Adoro uma boa piada',
      'Por que o pássaro foi ao psicólogo?',
      'Não sei... por que?',
      'Porque ele estava com síndrome do pânico! 😂',
      'Hahaha muito boa! Essa foi criativa',
      'Né? Eu ri muito quando ouvi',
      'Tenho uma também! Quer ouvir?',
      'Claro! Manda ver',
      'O que o Batman falou para o Robin antes de entrar no carro?',
      'Não faço ideia...',
      'Robin, cadê o batmóvel? 🤣',
      'Hahahaha essa é clássica mas sempre funciona!',
      'Verdade! As piadas simples são as melhores',
      'Concordo! Fazem o dia ficar mais leve',
      'Exato! Rir faz bem demais',
      'Com certeza! Obrigado pela risada',
      'Por nada! Sempre que tiver uma nova, te conto',
      'Fechado! Eu também faço o mesmo',
      'Perfeito! Parceria da comédia! 😄',
      'Hahaha isso mesmo! Até mais!'
    ]
  },

  // ========== NOTÍCIAS ==========
  news_discussion: {
    name: 'Discussão de Notícias',
    description: 'Conversa sobre atualidades',
    allowVoiceNotes: false,
    messages: [
      'Viu as notícias hoje?',
      'Vi algumas... o que chamou sua atenção?',
      'Aquela sobre tecnologia, muito interessante',
      'Ah sim! A da inteligência artificial?',
      'Exato! Está evoluindo muito rápido',
      'Verdade! Impressionante como avança',
      'Me pergunto como será o futuro',
      'Eu também! Vai mudar tudo',
      'Certamente! Algumas profissões vão se transformar',
      'Já estão se transformando na verdade',
      'Bom ponto! Temos que nos adaptar',
      'Exato! Aprendizado constante é chave',
      'Concordo totalmente! Você estuda algo novo?',
      'Sempre! Faço cursos online regularmente',
      'Que legal! Também deveria fazer mais',
      'Vale muito a pena! Te mando algumas dicas',
      'Obrigado! Vou aproveitar as sugestões',
      'Por nada! Conhecimento nunca é demais',
      'Verdade! Obrigado pela conversa',
      'Foi um prazer! Sempre bom trocar ideias',
      'Com certeza! Até mais!'
    ]
  }
};

export default conversationScripts;