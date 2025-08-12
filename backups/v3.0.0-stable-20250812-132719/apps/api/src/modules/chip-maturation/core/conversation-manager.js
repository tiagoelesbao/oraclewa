/**
 * 💬 CONVERSATION MANAGER
 * Gerencia conversas automáticas entre chips para maturação
 * CUSTO ZERO - Chips conversam entre si
 */

import logger from '../../../utils/logger.js';
import { EventEmitter } from 'events';
import conversationScripts from '../scripts/conversation-scripts.js';

class ConversationManager extends EventEmitter {
  constructor() {
    super();
    
    this.activeConversations = new Map();
    this.scheduledConversations = [];
    this.conversationHistory = new Map();
    
    // Configurações de conversa
    this.config = {
      typingSpeed: {
        min: 30,  // 30 caracteres por segundo (rápido)
        max: 10   // 10 caracteres por segundo (devagar)
      },
      reactionTime: {
        min: 3000,   // 3 segundos
        max: 15000   // 15 segundos
      },
      conversationLength: {
        min: 5,   // mínimo 5 mensagens
        max: 20   // máximo 20 mensagens
      },
      voiceNoteChance: 0.1,    // 10% chance de áudio
      emojiChance: 0.3,        // 30% chance de emoji
      typoChance: 0.05,        // 5% chance de erro de digitação
      mediaChance: 0.05        // 5% chance de mídia (foto/vídeo)
    };

    // Tipos de conversa disponíveis
    this.conversationTypes = {
      CASUAL_CHAT: 'casual_chat',
      BUSINESS_INQUIRY: 'business_inquiry',
      SUPPORT_REQUEST: 'support_request',
      SOCIAL_INTERACTION: 'social_interaction',
      GROUP_DISCUSSION: 'group_discussion',
      MORNING_GREETING: 'morning_greeting',
      NIGHT_GOODBYE: 'night_goodbye',
      WEEKEND_CHAT: 'weekend_chat',
      JOKE_SHARING: 'joke_sharing',
      NEWS_DISCUSSION: 'news_discussion'
    };

    this.scheduler = null;
  }

  /**
   * Inicializa o gerenciador de conversas
   */
  async initialize() {
    try {
      logger.info('💬 Inicializando Gerenciador de Conversas...');
      
      // Carregar histórico de conversas
      await this.loadConversationHistory();
      
      // Iniciar agendador
      this.startScheduler();
      
      logger.info('✅ Gerenciador de Conversas inicializado');
      return true;
    } catch (error) {
      logger.error('❌ Erro ao inicializar gerenciador de conversas:', error);
      throw error;
    }
  }

  /**
   * Agenda uma conversa entre dois chips
   */
  async scheduleConversation(params) {
    const {
      from,
      to,
      messageCount = 10,
      conversationType = this.conversationTypes.CASUAL_CHAT,
      startDelay = 0
    } = params;

    try {
      const conversationId = `conv_${Date.now()}_${from}_${to}`;
      
      const conversation = {
        id: conversationId,
        from,
        to,
        type: conversationType,
        targetMessages: messageCount,
        currentMessages: 0,
        scheduledAt: new Date(Date.now() + startDelay),
        status: 'scheduled',
        script: null,
        context: {}
      };

      this.scheduledConversations.push(conversation);
      
      logger.info(`📅 Conversa agendada: ${from} <-> ${to} (${messageCount} msgs, tipo: ${conversationType})`);
      
      return conversation;
    } catch (error) {
      logger.error('❌ Erro ao agendar conversa:', error);
      throw error;
    }
  }

  /**
   * Inicia uma conversa entre dois chips
   */
  async startConversation(conversation) {
    try {
      logger.info(`🎬 Iniciando conversa: ${conversation.from} <-> ${conversation.to}`);
      
      // Obter script de conversa
      const script = await this.getConversationScript(conversation.type);
      conversation.script = script;
      conversation.status = 'active';
      conversation.startedAt = new Date();
      
      // Adicionar à lista de conversas ativas
      this.activeConversations.set(conversation.id, conversation);
      
      // Iniciar troca de mensagens
      await this.executeConversation(conversation);
      
      return conversation;
    } catch (error) {
      logger.error('❌ Erro ao iniciar conversa:', error);
      throw error;
    }
  }

  /**
   * Executa a conversa seguindo o script
   */
  async executeConversation(conversation) {
    try {
      const { from, to, script, targetMessages } = conversation;
      let messageIndex = 0;
      let currentSender = from;
      let currentReceiver = to;

      while (conversation.currentMessages < targetMessages && messageIndex < script.messages.length) {
        // Obter próxima mensagem do script
        const messageTemplate = script.messages[messageIndex % script.messages.length];
        const message = this.personalizeMessage(messageTemplate, conversation.context);
        
        // Simular digitação
        await this.simulateTyping(currentSender, message);
        
        // Enviar mensagem
        await this.sendMessage(currentSender, currentReceiver, message);
        
        // Atualizar contexto da conversa
        conversation.context.lastMessage = message;
        conversation.context.lastSender = currentSender;
        conversation.currentMessages++;
        
        // Registrar no histórico
        this.addToHistory(currentSender, currentReceiver, message);
        
        // Aguardar antes da próxima mensagem
        await this.waitReactionTime();
        
        // Alternar remetente/destinatário
        [currentSender, currentReceiver] = [currentReceiver, currentSender];
        messageIndex++;
        
        // Chance de adicionar elementos especiais
        if (Math.random() < this.config.emojiChance) {
          await this.sendEmoji(currentSender, currentReceiver);
        }
        
        if (Math.random() < this.config.voiceNoteChance && script.allowVoiceNotes) {
          await this.sendVoiceNote(currentSender, currentReceiver);
        }
      }
      
      // Finalizar conversa
      await this.endConversation(conversation);
      
    } catch (error) {
      logger.error('❌ Erro ao executar conversa:', error);
      conversation.status = 'error';
      conversation.error = error.message;
    }
  }

  /**
   * Obtém script de conversa baseado no tipo
   */
  async getConversationScript(type) {
    // Obter script do arquivo de scripts
    const script = conversationScripts[type] || conversationScripts.casual_chat;
    
    // Adicionar variações para parecer mais natural
    const variedScript = {
      ...script,
      messages: this.shuffleArray([...script.messages])
    };
    
    return variedScript;
  }

  /**
   * Personaliza mensagem com contexto
   */
  personalizeMessage(template, context) {
    let message = template;
    
    // Substituir variáveis de contexto
    message = message.replace(/\{nome\}/g, context.senderName || 'amigo');
    message = message.replace(/\{hora\}/g, new Date().getHours());
    message = message.replace(/\{dia\}/g, this.getDayOfWeek());
    
    // Adicionar erros de digitação ocasionais
    if (Math.random() < this.config.typoChance) {
      message = this.addTypo(message);
    }
    
    return message;
  }

  /**
   * Simula digitação humana
   */
  async simulateTyping(sender, message) {
    const typingTime = this.calculateTypingTime(message);
    
    logger.debug(`⌨️ ${sender} digitando... (${typingTime}ms)`);
    
    // Aqui seria enviado o status "typing" para o WhatsApp
    this.emit('typing', { sender, duration: typingTime });
    
    await this.sleep(typingTime);
  }

  /**
   * Calcula tempo de digitação baseado no tamanho da mensagem
   */
  calculateTypingTime(message) {
    const charCount = message.length;
    const speed = this.randomBetween(this.config.typingSpeed.max, this.config.typingSpeed.min);
    const baseTime = (charCount / speed) * 1000;
    
    // Adicionar variação aleatória
    const variation = this.randomBetween(0.8, 1.2);
    
    return Math.floor(baseTime * variation);
  }

  /**
   * Envia mensagem entre chips
   */
  async sendMessage(from, to, message) {
    try {
      logger.info(`📤 ${from} -> ${to}: "${message.substring(0, 50)}..."`);
      
      // Aqui integraria com Evolution API para enviar mensagem real
      // Por enquanto, simular envio
      this.emit('message:sent', {
        from,
        to,
        message,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Envia emoji
   */
  async sendEmoji(from, to) {
    const emojis = ['😊', '👍', '😂', '❤️', '🙏', '😎', '🤔', '👏', '🎉', '💪'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    await this.sendMessage(from, to, emoji);
  }

  /**
   * Simula envio de áudio
   */
  async sendVoiceNote(from, to) {
    const duration = this.randomBetween(3, 15); // 3-15 segundos
    
    logger.info(`🎤 ${from} -> ${to}: [Áudio ${duration}s]`);
    
    this.emit('voice:sent', {
      from,
      to,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Aguarda tempo de reação
   */
  async waitReactionTime() {
    const reactionTime = this.randomBetween(
      this.config.reactionTime.min,
      this.config.reactionTime.max
    );
    
    await this.sleep(reactionTime);
  }

  /**
   * Finaliza conversa
   */
  async endConversation(conversation) {
    conversation.status = 'completed';
    conversation.endedAt = new Date();
    
    // Remover de conversas ativas
    this.activeConversations.delete(conversation.id);
    
    // Emitir evento
    this.emit('conversation:ended', conversation);
    
    logger.info(`✅ Conversa finalizada: ${conversation.from} <-> ${conversation.to} (${conversation.currentMessages} mensagens)`);
  }

  /**
   * Inicia o agendador de conversas
   */
  startScheduler() {
    this.scheduler = setInterval(async () => {
      const now = Date.now();
      
      // Verificar conversas agendadas
      for (let i = this.scheduledConversations.length - 1; i >= 0; i--) {
        const conversation = this.scheduledConversations[i];
        
        if (new Date(conversation.scheduledAt).getTime() <= now && conversation.status === 'scheduled') {
          // Remover da lista de agendadas
          this.scheduledConversations.splice(i, 1);
          
          // Iniciar conversa
          await this.startConversation(conversation);
        }
      }
    }, 10000); // Verificar a cada 10 segundos
    
    logger.info('⏰ Agendador de conversas iniciado');
  }

  /**
   * Obtém estatísticas do dia
   */
  async getTodayStats() {
    const today = new Date().toDateString();
    let stats = {
      totalConversations: 0,
      totalMessages: 0,
      activeConversations: this.activeConversations.size,
      scheduledConversations: this.scheduledConversations.length,
      conversationsByType: {}
    };
    
    // Contar conversas do dia
    for (const conversation of this.conversationHistory.values()) {
      if (new Date(conversation.startedAt).toDateString() === today) {
        stats.totalConversations++;
        stats.totalMessages += conversation.currentMessages || 0;
        
        const type = conversation.type || 'unknown';
        stats.conversationsByType[type] = (stats.conversationsByType[type] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * Adiciona ao histórico
   */
  addToHistory(from, to, message) {
    const key = `${from}_${to}`;
    if (!this.conversationHistory.has(key)) {
      this.conversationHistory.set(key, []);
    }
    
    this.conversationHistory.get(key).push({
      message,
      timestamp: new Date(),
      from,
      to
    });
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Adiciona erro de digitação
   */
  addTypo(text) {
    const words = text.split(' ');
    if (words.length === 0) return text;
    
    const wordIndex = Math.floor(Math.random() * words.length);
    const word = words[wordIndex];
    
    if (word.length > 2) {
      const charIndex = Math.floor(Math.random() * (word.length - 1)) + 1;
      const chars = word.split('');
      // Trocar duas letras adjacentes
      [chars[charIndex], chars[charIndex - 1]] = [chars[charIndex - 1], chars[charIndex]];
      words[wordIndex] = chars.join('');
    }
    
    return words.join(' ');
  }

  /**
   * Obtém dia da semana em português
   */
  getDayOfWeek() {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return days[new Date().getDay()];
  }

  /**
   * Embaralha array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Gera número aleatório entre min e max
   */
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep/delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Carrega histórico de conversas
   */
  async loadConversationHistory() {
    // TODO: Carregar do banco de dados
    logger.info('📂 Carregando histórico de conversas...');
  }

  /**
   * Obtém estatísticas de conversas de hoje
   */
  async getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    
    let totalConversations = 0;
    let totalMessages = 0;
    let activeConversations = this.activeConversations.size;
    let scheduledConversations = this.scheduledConversations.length;
    let conversationsByType = {};

    // Contar conversas do histórico
    for (const [chipId, history] of this.conversationHistory.entries()) {
      const todayConversations = history.filter(conv => 
        conv.date && conv.date.startsWith(today)
      );
      
      totalConversations += todayConversations.length;
      
      for (const conv of todayConversations) {
        totalMessages += conv.messageCount || 0;
        const type = conv.type || 'unknown';
        conversationsByType[type] = (conversationsByType[type] || 0) + 1;
      }
    }

    return {
      totalConversations,
      totalMessages,
      activeConversations,
      scheduledConversations,
      conversationsByType
    };
  }
}

export default ConversationManager;