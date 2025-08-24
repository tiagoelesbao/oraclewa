/**
 * Auto Reconnect Service
 * Monitora e reconecta automaticamente instâncias desconectadas
 */

import logger from '../../utils/logger.js';
import axios from 'axios';
import { io } from '../../index.js';

class AutoReconnectService {
  constructor() {
    this.reconnectAttempts = new Map(); // instanceName -> attempt count
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 60000; // 1 minuto entre tentativas
    this.criticalAlertThreshold = 5; // Alertar após 5 minutos offline
    this.monitoringActive = false;
  }

  /**
   * Inicia monitoramento de reconexão
   */
  startMonitoring(webhookPoolManager) {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    this.webhookPoolManager = webhookPoolManager;
    
    // Verificar instâncias a cada 30 segundos
    this.monitorInterval = setInterval(() => {
      this.checkAndReconnectInstances();
    }, 30000);
    
    logger.info('🔄 Auto-reconnect monitoring started');
  }

  /**
   * Para monitoramento
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitoringActive = false;
      logger.info('⏹️ Auto-reconnect monitoring stopped');
    }
  }

  /**
   * Verifica e reconecta instâncias offline
   */
  async checkAndReconnectInstances() {
    try {
      const allInstances = [
        'imperio-webhook-1',
        'imperio-webhook-2',
        'imperio-webhook-3',
        'imperio-webhook-4'
      ];
      
      for (const instanceName of allInstances) {
        const health = await this.checkInstanceStatus(instanceName);
        
        if (health.status === 'unhealthy' || health.state === 'close') {
          logger.warn(`⚠️ Instance ${instanceName} is disconnected. State: ${health.state}`);
          
          // Tentar reconectar
          await this.attemptReconnect(instanceName);
        } else {
          // Reset contador se reconectou
          this.reconnectAttempts.delete(instanceName);
        }
      }
    } catch (error) {
      logger.error('❌ Error in auto-reconnect check:', error);
    }
  }

  /**
   * Tenta reconectar uma instância
   */
  async attemptReconnect(instanceName) {
    const attempts = this.reconnectAttempts.get(instanceName) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      // Enviar alerta crítico
      await this.sendCriticalAlert(instanceName);
      return;
    }
    
    try {
      logger.info(`🔄 Attempting to reconnect ${instanceName} (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      // Tentar reconectar via Evolution API
      const response = await axios.post(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {},
        {
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      if (response.data?.qrcode) {
        // Precisa de novo QR Code
        logger.warn(`📱 Instance ${instanceName} needs QR Code scan`);
        await this.sendQRCodeAlert(instanceName, response.data.qrcode);
      } else if (response.data?.connected) {
        logger.info(`✅ Instance ${instanceName} reconnected successfully`);
        this.reconnectAttempts.delete(instanceName);
        
        // Notificar sucesso
        io.emit('instance-reconnected', {
          instanceName,
          timestamp: new Date().toISOString()
        });
      }
      
      this.reconnectAttempts.set(instanceName, attempts + 1);
      
    } catch (error) {
      logger.error(`❌ Failed to reconnect ${instanceName}:`, error.message);
      this.reconnectAttempts.set(instanceName, attempts + 1);
    }
  }

  /**
   * Verifica status de uma instância
   */
  async checkInstanceStatus(instanceName) {
    try {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
      
      const response = await axios.get(
        `${evolutionUrl}/instance/connectionState/${instanceName}`,
        {
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      const state = response.data?.instance?.state || 'unknown';
      const status = response.data?.instance?.status || 'unknown';
      
      return {
        status: (state === 'open' || state === 'connected') ? 'healthy' : 'unhealthy',
        state,
        connectionStatus: status,
        instance: response.data?.instance || {}
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        state: 'error',
        error: error.message
      };
    }
  }

  /**
   * Envia alerta crítico
   */
  async sendCriticalAlert(instanceName) {
    logger.error(`🚨 CRITICAL: Instance ${instanceName} failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    
    // Emitir evento crítico
    io.emit('critical-instance-failure', {
      instanceName,
      attempts: this.maxReconnectAttempts,
      timestamp: new Date().toISOString(),
      message: `WhatsApp instance ${instanceName} is offline and cannot be reconnected automatically`
    });
    
    // Reset contador para tentar novamente mais tarde
    setTimeout(() => {
      this.reconnectAttempts.delete(instanceName);
    }, this.reconnectInterval * 5); // Esperar 5 minutos antes de tentar novamente
  }

  /**
   * Envia alerta de QR Code necessário
   */
  async sendQRCodeAlert(instanceName, qrcode) {
    logger.warn(`📱 QR Code required for ${instanceName}`);
    
    io.emit('qrcode-required', {
      instanceName,
      qrcode,
      timestamp: new Date().toISOString(),
      message: `Instance ${instanceName} requires QR Code scan to reconnect`
    });
  }

  /**
   * Força reconexão de todas as instâncias
   */
  async forceReconnectAll() {
    logger.info('🔄 Forcing reconnection of all instances...');
    
    const allInstances = [
      'imperio-webhook-1',
      'imperio-webhook-2',
      'imperio-webhook-3',
      'imperio-webhook-4'
    ];
    
    const results = [];
    
    for (const instanceName of allInstances) {
      try {
        await this.attemptReconnect(instanceName);
        results.push({ instanceName, success: true });
      } catch (error) {
        results.push({ instanceName, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Obtém status de reconexão
   */
  getReconnectStatus() {
    const status = [];
    
    for (const [instanceName, attempts] of this.reconnectAttempts) {
      status.push({
        instanceName,
        reconnectAttempts: attempts,
        maxAttempts: this.maxReconnectAttempts,
        critical: attempts >= this.maxReconnectAttempts
      });
    }
    
    return {
      monitoringActive: this.monitoringActive,
      instances: status,
      nextCheck: this.monitoringActive ? new Date(Date.now() + 30000).toISOString() : null
    };
  }
}

// Singleton
const autoReconnectService = new AutoReconnectService();

export default autoReconnectService;