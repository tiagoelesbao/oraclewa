/**
 * Gerenciador Simples de WhatsApp
 * Funcionalidade básica com anti-ban integrado para Railway
 */
import http from 'http';
import { URL } from 'url';
import logger from '../../utils/logger.js';
import DelayManager from '../antiban/delay-manager.js';

class SimpleWhatsAppManager {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080',
      apiKey: config.apiKey || process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure',
      instanceName: config.instanceName || 'imperio1',
      timeout: config.timeout || 10000
    };
    
    this.delayManager = new DelayManager();
  }

  /**
   * Simular digitação
   */
  async simulateTyping(phone) {
    return new Promise((resolve) => {
      try {
        const payload = JSON.stringify({
          number: phone,
          delay: 3000
        });
        
        const url = new URL(`/chat/sendPresence/${this.config.instanceName}`, this.config.apiUrl);
        
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'apikey': this.config.apiKey,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 5000
        };
        
        logger.debug(`⌨️ Simulating typing for ${phone}...`);
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            logger.debug(`✅ Typing simulation sent: ${res.statusCode}`);
            resolve(true);
          });
        });
        
        req.on('error', (error) => {
          logger.warn(`❌ Typing simulation failed: ${error.message}`);
          resolve(false); // Don't block main flow
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        
        req.write(payload);
        req.end();
        
      } catch (error) {
        logger.warn(`❌ Typing simulation error: ${error.message}`);
        resolve(false);
      }
    });
  }

  /**
   * Enviar mensagem WhatsApp com anti-ban
   */
  async sendMessage(phone, message, options = {}) {
    try {
      // Aplicar delay anti-ban robusto
      await this.delayManager.applyDelay();
      
      // Limpar telefone
      let cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('55')) {
        cleanPhone = '55' + cleanPhone;
      }
      
      // Simular digitação (3 segundos)
      await this.simulateTyping(cleanPhone);
      await this.sleep(3000); // Aguardar "digitação"
      
      const payload = JSON.stringify({
        number: cleanPhone,
        text: message
      });
      
      const url = new URL(`/message/sendText/${this.config.instanceName}`, this.config.apiUrl);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: this.config.timeout
      };
      
      logger.info(`📤 Sending WhatsApp to ${cleanPhone} via ${this.config.instanceName}`);
      
      return new Promise((resolve, reject) => {
        const req = http.request(requestOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            logger.info(`✅ WhatsApp sent successfully: ${res.statusCode}`);
            resolve({ success: true, status: res.statusCode, data });
          });
        });
        
        req.on('error', (error) => {
          logger.error(`❌ WhatsApp send failed: ${error.message}`);
          reject(error);
        });
        
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.write(payload);
        req.end();
      });
      
    } catch (error) {
      logger.error(`❌ WhatsApp function error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas do anti-ban
   */
  getStats() {
    return this.delayManager.getStats();
  }

  /**
   * Reset estatísticas (para testes)
   */
  reset() {
    this.delayManager.reset();
  }
}

export default SimpleWhatsAppManager;