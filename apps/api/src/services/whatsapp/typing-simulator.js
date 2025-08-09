import logger from '../../utils/logger.js';

/**
 * Simulador de Digitação Humanizada
 * Simula delays realistas de digitação para evitar detecção de bot
 */
export class TypingSimulator {
  
  /**
   * Calcula tempo de digitação baseado no comprimento da mensagem
   */
  static calculateTypingTime(message) {
    if (!message || typeof message !== 'string') return 2000;
    
    // Configurações realistas de digitação humana
    const WPM = 40; // 40 palavras por minuto (velocidade média)
    const CHARS_PER_WORD = 5; // Média de caracteres por palavra
    const CHARS_PER_MINUTE = WPM * CHARS_PER_WORD; // 200 chars/min
    const CHARS_PER_MS = CHARS_PER_MINUTE / 60000; // chars por millisegundo
    
    // Tempo base baseado no comprimento
    const baseTime = message.length / CHARS_PER_MS;
    
    // Fatores de ajuste para humanização
    const pauseForPunctuation = (message.match(/[.!?]/g) || []).length * 500; // 500ms por pontuação
    const pauseForCommas = (message.match(/[,;]/g) || []).length * 200; // 200ms por vírgula
    const pauseForLineBreaks = (message.match(/\n/g) || []).length * 800; // 800ms por quebra de linha
    const pauseForEmojis = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length * 300; // 300ms por emoji
    
    // Tempo total com pausas
    let totalTime = baseTime + pauseForPunctuation + pauseForCommas + pauseForLineBreaks + pauseForEmojis;
    
    // Limites mínimos e máximos
    const MIN_TIME = 2000;  // 2 segundos mínimo
    const MAX_TIME = 15000; // 15 segundos máximo
    
    totalTime = Math.max(MIN_TIME, Math.min(MAX_TIME, totalTime));
    
    // Adicionar variação aleatória ±20%
    const variation = totalTime * 0.2;
    totalTime += (Math.random() - 0.5) * variation;
    
    return Math.round(totalTime);
  }
  
  /**
   * Simula processo completo de digitação
   */
  static async simulateTyping(message, phoneNumber) {
    const typingTime = this.calculateTypingTime(message);
    const readingTime = this.calculateReadingTime(message);
    
    logger.info(`✍️ Simulando digitação para ${phoneNumber.slice(-4)}: ${Math.round(typingTime/1000)}s`);
    
    // Fase 1: "Lendo" a mensagem anterior (simulação)
    if (readingTime > 0) {
      logger.debug(`👀 Simulando leitura: ${Math.round(readingTime/1000)}s`);
      await this.delay(readingTime);
    }
    
    // Fase 2: "Digitando" com pausas realistas
    await this.simulateKeystrokes(message, typingTime);
    
    // Fase 3: Pausa final antes de enviar (revisão)
    const reviewTime = 1000 + Math.random() * 2000; // 1-3 segundos
    logger.debug(`🔍 Simulando revisão: ${Math.round(reviewTime/1000)}s`);
    await this.delay(reviewTime);
    
    const totalTime = readingTime + typingTime + reviewTime;
    logger.info(`⚡ Simulação completa: ${Math.round(totalTime/1000)}s total`);
    
    return totalTime;
  }
  
  /**
   * Simula digitação com pausas entre caracteres/palavras
   */
  static async simulateKeystrokes(message, totalTime) {
    const words = message.split(' ');
    const timePerWord = totalTime / words.length;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Tempo para digitar esta palavra
      let wordTime = timePerWord;
      
      // Ajustar tempo baseado no comprimento da palavra
      if (word.length > 8) wordTime *= 1.2; // Palavras longas são mais lentas
      if (word.length < 3) wordTime *= 0.8; // Palavras curtas são mais rápidas
      
      // Pausa extra para palavras com caracteres especiais
      if (/[áéíóúàèìòùâêîôûãõç]/i.test(word)) wordTime *= 1.1;
      if (/[0-9]/.test(word)) wordTime *= 1.15; // Números são mais lentos
      
      // Simular digitação da palavra
      await this.delay(wordTime);
      
      // Pausa entre palavras (espaço)
      if (i < words.length - 1) {
        const spacePause = 100 + Math.random() * 200; // 100-300ms
        await this.delay(spacePause);
      }
    }
  }
  
  /**
   * Calcula tempo de "leitura" da mensagem anterior
   */
  static calculateReadingTime(message) {
    // Simula tempo para "ler" e "pensar" na resposta
    const READING_WPM = 200; // 200 palavras por minuto (leitura)
    const words = message.split(' ').length;
    const readingTime = (words / READING_WPM) * 60000; // em ms
    
    // Tempo mínimo de 1 segundo, máximo de 5 segundos
    return Math.max(1000, Math.min(5000, readingTime));
  }
  
  /**
   * Delay com precisão de milissegundos
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Detecta se a mensagem parece ser automática/template
   */
  static isTemplateMessage(message) {
    const templateIndicators = [
      /\{\{.*\}\}/, // Handlebars templates
      /Olá.*!.*Sua/, // Padrões de template
      /Parabéns.*aprovada/, // Templates de aprovação
      /Total:.*R\$/, // Templates com valores
    ];
    
    return templateIndicators.some(pattern => pattern.test(message));
  }
  
  /**
   * Ajusta tempo de digitação baseado no contexto
   */
  static getContextualDelay(messageType, isTemplate) {
    let multiplier = 1;
    
    // Mensagens de template parecem mais "pensadas"
    if (isTemplate) multiplier *= 1.3;
    
    // Diferentes tipos de mensagem
    switch (messageType) {
      case 'order_paid':
        multiplier *= 1.2; // Mensagens de aprovação são mais cuidadosas
        break;
      case 'order_expired':
        multiplier *= 0.9; // Mensagens de expiração são mais diretas
        break;
      default:
        break;
    }
    
    return multiplier;
  }
}

export default TypingSimulator;