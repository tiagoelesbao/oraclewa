import logger from '../../utils/logger.js';
import { getRedisClient } from '../redis/client.js';

export class WhatsAppWarmupManager {
  constructor() {
    this.redis = process.env.SKIP_DB !== 'true' ? getRedisClient() : null;
    
    // Fallback em memória quando Redis não disponível
    this.inMemoryCounters = {
      consecutive: new Map(),
      lastMessage: new Map(),
      pauseUntil: new Map()
    };
  }

  /**
   * Verifica se um número está em período de aquecimento
   */
  async isNumberInWarmup(instanceName) {
    if (!this.redis) return false;
    
    const warmupKey = `warmup:${instanceName}`;
    const startDate = await this.redis.get(warmupKey);
    
    if (!startDate) return false;
    
    const daysSinceStart = Math.floor((Date.now() - parseInt(startDate)) / (1000 * 60 * 60 * 24));
    return daysSinceStart < 7;
  }

  /**
   * Obtém o limite diário baseado no período de aquecimento
   * TEMPORARIAMENTE DESABILITADO - retorna limite alto
   */
  async getDailyLimit(instanceName) {
    // 🔧 TEMPORARIAMENTE DESABILITADO - sem limite diário progressivo
    logger.info('📊 Limite diário progressivo TEMPORARIAMENTE DESABILITADO - usando limite fixo de 5000');
    return 5000; // Limite alto para não bloquear
    
    /* CÓDIGO ORIGINAL (DESATIVADO TEMPORARIAMENTE):
    if (!this.redis) return 1000;
    
    const warmupKey = `warmup:${instanceName}`;
    const startDate = await this.redis.get(warmupKey);
    
    if (!startDate) {
      await this.redis.set(warmupKey, Date.now().toString());
      return 20;
    }
    
    const daysSinceStart = Math.floor((Date.now() - parseInt(startDate)) / (1000 * 60 * 60 * 24));
    const warmupLimits = [20, 40, 80, 160, 320, 500, 600];
    
    if (daysSinceStart >= warmupLimits.length) {
      return 600;
    }
    
    return warmupLimits[daysSinceStart];
    */
  }

  /**
   * Verifica se pode enviar mensagem baseado nos limites
   */
  async canSendMessage(instanceName) {
    // 🚨 PARADA DE EMERGÊNCIA
    if (process.env.EMERGENCY_STOP === 'true') {
      logger.error('🚨 SISTEMA PAUSADO - EMERGENCY_STOP ativado');
      return false;
    }
    
    // ⏰ VERIFICAR HORÁRIO COMERCIAL SEMPRE (mesmo sem Redis)
    const now = new Date();
    const hour = now.getHours();
    
    // Verificar horário comercial (9h às 21h) - DESABILITADO TEMPORARIAMENTE
    // if (hour < 9 || hour >= 21) {
    //   logger.warn(`🚫 Fora do horário comercial: ${hour}h - mensagem bloqueada`);
    //   return false;
    // }
    logger.info(`⏰ Verificação de horário comercial TEMPORARIAMENTE DESABILITADA - permitindo envio às ${hour}h`);
    
    if (!this.redis) {
      logger.info('✅ Horário comercial OK - Redis desabilitado, permitindo envio');
      return true; // Sem Redis, mas dentro do horário
    }
    
    // Verificar limite diário
    const dailyKey = `daily_count:${instanceName}:${now.toISOString().split('T')[0]}`;
    const dailyCount = parseInt(await this.redis.get(dailyKey) || '0');
    const dailyLimit = await this.getDailyLimit(instanceName);
    
    if (dailyCount >= dailyLimit) {
      logger.warn(`Limite diário atingido para ${instanceName}: ${dailyCount}/${dailyLimit}`);
      return false;
    }
    
    // Verificar limite por hora - ULTRA CONSERVADOR
    const hourlyKey = `hourly_count:${instanceName}:${now.toISOString().slice(0, 13)}`;
    const hourlyCount = parseInt(await this.redis.get(hourlyKey) || '0');
    
    // Limite ultra conservador: máximo 25 msgs/hora
    if (hourlyCount >= 25) {
      logger.warn(`🚨 Limite horário ULTRA CONSERVADOR atingido para ${instanceName}: ${hourlyCount}/25`);
      return false;
    }
    
    // Verificar se precisa de pausa após mensagens consecutivas
    const needsPause = this.redis ? 
      await this.redis.get(`needs_pause:${instanceName}`) : 
      this.inMemoryCounters.pauseUntil.get(instanceName);
    
    if (needsPause) {
      const pauseTime = Date.now() - parseInt(needsPause);
      const PAUSE_DURATION = 300000; // 5 minutos
      
      if (pauseTime < PAUSE_DURATION) {
        const remainingPause = Math.ceil((PAUSE_DURATION - pauseTime) / 60000);
        logger.warn(`⏸️ Pausa após mensagens consecutivas: aguardando ${remainingPause} minutos`);
        return false;
      } else {
        // Pausa concluída, remover flag
        if (this.redis) {
          await this.redis.del(`needs_pause:${instanceName}`);
        } else {
          this.inMemoryCounters.pauseUntil.delete(instanceName);
        }
        logger.info(`✅ Pausa concluída para ${instanceName}, retomando envios`);
      }
    }
    
    return true;
  }

  /**
   * Registra envio de mensagem + controle de consecutivas
   */
  async recordMessageSent(instanceName) {
    const now = new Date();
    
    if (this.redis) {
      // Com Redis: usar implementação completa
      const dailyKey = `daily_count:${instanceName}:${now.toISOString().split('T')[0]}`;
      await this.redis.incr(dailyKey);
      await this.redis.expire(dailyKey, 86400);
      
      const hourlyKey = `hourly_count:${instanceName}:${now.toISOString().slice(0, 13)}`;
      await this.redis.incr(hourlyKey);
      await this.redis.expire(hourlyKey, 3600);
      
      const consecutiveCount = await this.redis.incr(`consecutive:${instanceName}`);
      await this.redis.expire(`consecutive:${instanceName}`, 1800);
      
      logger.info(`📊 Mensagem ${consecutiveCount} consecutiva para ${instanceName}`);
      
      if (consecutiveCount >= 5) {
        await this.redis.set(`needs_pause:${instanceName}`, Date.now().toString());
        await this.redis.expire(`needs_pause:${instanceName}`, 1800);
        logger.warn(`🛑 ${instanceName} precisa de pausa após ${consecutiveCount} mensagens consecutivas`);
        await this.redis.del(`consecutive:${instanceName}`);
      }
      
      await this.redis.set(`last_message:${instanceName}`, Date.now().toString());
    } else {
      // Sem Redis: usar contadores em memória para controle consecutivo
      const currentCount = (this.inMemoryCounters.consecutive.get(instanceName) || 0) + 1;
      this.inMemoryCounters.consecutive.set(instanceName, currentCount);
      
      logger.info(`📊 Mensagem ${currentCount} consecutiva para ${instanceName} (modo sem Redis)`);
      
      // Se atingir 5 mensagens consecutivas, marcar para pausa
      if (currentCount >= 5) {
        this.inMemoryCounters.pauseUntil.set(instanceName, Date.now().toString());
        this.inMemoryCounters.consecutive.set(instanceName, 0); // Reset contador
        logger.warn(`🛑 ${instanceName} precisa de pausa após ${currentCount} mensagens consecutivas (modo sem Redis)`);
      }
      
      // Registrar última mensagem
      this.inMemoryCounters.lastMessage.set(instanceName, Date.now());
      
      // Limpeza automática após 30 minutos (evitar memory leak)
      setTimeout(() => {
        this.inMemoryCounters.consecutive.delete(instanceName);
        this.inMemoryCounters.pauseUntil.delete(instanceName);
      }, 1800000); // 30 min
    }
  }

  /**
   * Obtém delay recomendado entre mensagens - MODO ULTRA CONSERVADOR
   */
  async getRecommendedDelay(instanceName) {
    // MODO ULTRA CONSERVADOR: 1 número + alto volume = delays rigorosos
    const MIN_DELAY = 60000;  // 1 minuto mínimo
    const MAX_DELAY = 120000; // 2 minutos máximo
    
    const lastMessageTime = this.redis ? 
      await this.redis.get(`last_message:${instanceName}`) :
      this.inMemoryCounters.lastMessage.get(instanceName);
    
    if (!lastMessageTime) {
      logger.info('🛡️ Primeiro envio do dia - delay conservador aplicado');
      return MIN_DELAY;
    }
    
    const timeSinceLastMessage = Date.now() - parseInt(lastMessageTime);
    
    // Se passou menos de 1 minuto, aguardar o tempo restante + extra
    if (timeSinceLastMessage < MIN_DELAY) {
      const remainingTime = MIN_DELAY - timeSinceLastMessage;
      const extraSafety = Math.random() * 30000; // 0-30s extra por segurança
      
      logger.warn(`⏱️ Delay de segurança: aguardando ${Math.round((remainingTime + extraSafety) / 1000)}s`);
      return remainingTime + extraSafety;
    }
    
    // Delay aleatório entre 1-2 minutos
    const randomDelay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    logger.info(`⏰ Delay aplicado: ${Math.round(randomDelay / 1000)}s (modo ultra conservador)`);
    
    return randomDelay;
  }

  /**
   * Verifica se pode enviar para um número específico
   * TEMPORARIAMENTE DESABILITADO - sempre retorna true
   */
  async canMessageRecipient(phoneNumber) {
    // 🔧 TEMPORARIAMENTE DESABILITADO - sem cooldown de 24h
    logger.info('🔓 Cooldown de 24h TEMPORARIAMENTE DESABILITADO - permitindo reenvio para qualquer número');
    return true;
    
    /* CÓDIGO ORIGINAL (DESATIVADO TEMPORARIAMENTE):
    if (!this.redis) return true;
    
    const recipientKey = `recipient:${phoneNumber}`;
    const lastContact = await this.redis.get(recipientKey);
    
    if (!lastContact) return true;
    
    const hoursSinceLastContact = (Date.now() - parseInt(lastContact)) / (1000 * 60 * 60);
    
    if (hoursSinceLastContact < 24) {
      logger.warn(`Número ${phoneNumber} contactado há menos de 24h`);
      return false;
    }
    
    return true;
    */
  }

  /**
   * Registra contato com destinatário
   */
  async recordRecipientContact(phoneNumber) {
    if (!this.redis) return;
    
    const recipientKey = `recipient:${phoneNumber}`;
    await this.redis.set(recipientKey, Date.now().toString());
    await this.redis.expire(recipientKey, 86400); // Expirar em 24h
  }
}

export default new WhatsAppWarmupManager();