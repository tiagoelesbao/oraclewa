/**
 * Gerenciador de Delays Anti-ban
 * Centraliza todas as estratégias de delay para evitar banimento
 */
import logger from '../../utils/logger.js';

class DelayManager {
  constructor() {
    this.lastMessageTime = 0;
    this.messageCount = 0;
    this.config = {
      minDelay: 90000, // 90 segundos mínimo
      randomDelayMax: 60000, // +0-60s variação aleatória
      longPauseChance: 0.15, // 15% chance de pausa longa
      longPauseMin: 300000, // 5 minutos mínimo para pausa longa
      longPauseMax: 900000, // 15 minutos máximo para pausa longa
      batchSize: 5, // Pausa a cada 5 mensagens
      batchPauseMin: 120000, // 2 minutos mínimo entre lotes
      batchPauseMax: 300000 // 5 minutos máximo entre lotes
    };
  }

  /**
   * Aplica delay anti-ban robusto
   */
  async applyDelay() {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    this.messageCount++;
    
    // Calcular delay base (mínimo 90s + variação)
    let waitTime = this.config.minDelay + Math.random() * this.config.randomDelayMax;
    
    // Se ainda não passou tempo suficiente, aguardar
    if (timeSinceLastMessage < this.config.minDelay) {
      waitTime = this.config.minDelay - timeSinceLastMessage + Math.random() * this.config.randomDelayMax;
    }
    
    // Chance de pausa longa aleatória
    if (Math.random() < this.config.longPauseChance) {
      const longPause = this.config.longPauseMin + Math.random() * (this.config.longPauseMax - this.config.longPauseMin);
      waitTime += longPause;
      logger.info(`🛑 PAUSA LONGA ALEATÓRIA: ${Math.round(longPause / 60000)} minutos extras`);
    }
    
    // Pausa extra a cada 5 mensagens
    if (this.messageCount % this.config.batchSize === 0) {
      const batchPause = this.config.batchPauseMin + Math.random() * (this.config.batchPauseMax - this.config.batchPauseMin);
      waitTime += batchPause;
      logger.info(`📦 PAUSA ENTRE LOTES (${this.messageCount} msgs): +${Math.round(batchPause / 60000)} minutos`);
    }
    
    if (waitTime > 1000) {
      const waitMinutes = Math.round(waitTime / 60000 * 10) / 10; // 1 casa decimal
      const waitSeconds = Math.round((waitTime % 60000) / 1000);
      logger.info(`⏳ Anti-ban delay: ${waitMinutes}min ${waitSeconds}s (mensagem #${this.messageCount})`);
      await this.sleep(waitTime);
    }
    
    this.lastMessageTime = Date.now();
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      messageCount: this.messageCount,
      lastMessageTime: new Date(this.lastMessageTime).toISOString(),
      minDelaySeconds: this.config.minDelay / 1000,
      features: ['90s+ delays', 'random long pauses', 'batch pauses']
    };
  }

  /**
   * Reset contador (para testes)
   */
  reset() {
    this.messageCount = 0;
    this.lastMessageTime = 0;
    logger.info('DelayManager reset');
  }
}

export default DelayManager;