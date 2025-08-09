/**
 * Client Configuration Loader
 * Carrega configurações específicas do cliente baseado em variáveis de ambiente
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

class ClientConfigLoader {
  constructor() {
    this.clientId = process.env.CLIENT_ID;
    this.serviceType = process.env.SERVICE_TYPE;
    this.config = null;
  }

  /**
   * Carrega configuração do cliente
   */
  loadClientConfig() {
    if (!this.clientId) {
      logger.warn('CLIENT_ID not set, using default configuration');
      return this.loadDefaultConfig();
    }

    // Tentar carregar arquivo .env específico do cliente
    const clientEnvPath = path.resolve(`.env.${this.clientId}`);
    if (fs.existsSync(clientEnvPath)) {
      logger.info(`Loading client configuration from ${clientEnvPath}`);
      dotenv.config({ path: clientEnvPath });
    }

    // Construir configuração baseada no serviço
    const config = {
      client: {
        id: this.clientId,
        name: process.env.CLIENT_NAME || this.clientId,
        serviceType: this.serviceType || 'all'
      },
      
      // Configurações específicas por tipo de serviço
      ...(this.serviceType === 'recovery' || this.serviceType === 'all' ? {
        recovery: this.loadRecoveryConfig()
      } : {}),
      
      ...(this.serviceType === 'broadcast' || this.serviceType === 'all' ? {
        broadcast: this.loadBroadcastConfig()
      } : {}),
      
      // Configurações compartilhadas
      evolution: this.loadEvolutionConfig(),
      security: this.loadSecurityConfig(),
      logging: this.loadLoggingConfig(),
      monitoring: this.loadMonitoringConfig()
    };

    this.config = config;
    return config;
  }

  /**
   * Configuração do serviço de recuperação
   */
  loadRecoveryConfig() {
    return {
      enabled: process.env.RECOVERY_ENABLED === 'true',
      port: parseInt(process.env.RECOVERY_PORT || '4001'),
      instances: (process.env.RECOVERY_INSTANCES || '').split(',').filter(Boolean),
      database: {
        host: process.env.RECOVERY_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.RECOVERY_DB_PORT || process.env.DB_PORT || '5432'),
        name: process.env.RECOVERY_DB_NAME || `${this.clientId}_recovery`,
        user: process.env.RECOVERY_DB_USER || process.env.DB_USER,
        password: process.env.RECOVERY_DB_PASS || process.env.DB_PASS,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000
        }
      },
      redis: {
        host: process.env.RECOVERY_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.RECOVERY_REDIS_PORT || process.env.REDIS_PORT || '6379'),
        db: parseInt(process.env.RECOVERY_REDIS_DB || '0'),
        keyPrefix: `${this.clientId}:recovery:`
      },
      webhooks: ['order_expired', 'order_paid'],
      queue: {
        maxRetries: 3,
        retryDelay: 60000,
        priority: {
          order_paid: 3,
          order_expired: 2
        }
      },
      limits: {
        daily: 500,
        hourly: 50,
        concurrent: 5
      }
    };
  }

  /**
   * Configuração do serviço de broadcast
   */
  loadBroadcastConfig() {
    return {
      enabled: process.env.BROADCAST_ENABLED === 'true',
      isolated: process.env.BROADCAST_ISOLATED === 'true',
      port: parseInt(process.env.BROADCAST_PORT || '4002'),
      instances: (process.env.BROADCAST_INSTANCES || '').split(',').filter(Boolean),
      database: {
        host: process.env.BROADCAST_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.BROADCAST_DB_PORT || process.env.DB_PORT || '5432'),
        name: process.env.BROADCAST_DB_NAME || `${this.clientId}_broadcast`,
        user: process.env.BROADCAST_DB_USER || process.env.DB_USER,
        password: process.env.BROADCAST_DB_PASS || process.env.DB_PASS,
        pool: {
          max: 5,
          min: 1,
          acquire: 30000,
          idle: 10000
        }
      },
      redis: {
        host: process.env.BROADCAST_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.BROADCAST_REDIS_PORT || '6380'), // Porta diferente!
        db: parseInt(process.env.BROADCAST_REDIS_DB || '0'),
        keyPrefix: `${this.clientId}:broadcast:`
      },
      antiban: this.loadAntibanConfig(),
      limits: {
        daily: parseInt(process.env.BROADCAST_DAILY_LIMIT || '1000'),
        hourly: parseInt(process.env.BROADCAST_HOURLY_LIMIT || '100'),
        perInstance: parseInt(process.env.BROADCAST_PER_INSTANCE_LIMIT || '350'),
        concurrent: 10
      },
      templates: {
        randomization: true,
        variations: 8,
        personalFields: ['nome', 'produto', 'valor']
      }
    };
  }

  /**
   * Configuração anti-ban baseada no manual Conti Chips
   */
  loadAntibanConfig() {
    return {
      enabled: process.env.ANTIBAN_ENABLED === 'true',
      strategy: process.env.ANTIBAN_STRATEGY || 'conti_chips',
      delays: {
        min: parseInt(process.env.ANTIBAN_DELAY_MIN || '30') * 1000,
        max: parseInt(process.env.ANTIBAN_DELAY_MAX || '120') * 1000,
        humanized: true,
        initial24h: 86400000 // 24h standby inicial (Conti Chips)
      },
      warmup: {
        day1: {
          min: parseInt(process.env.CHIP_WARMUP_DAY1_MIN || '10'),
          max: parseInt(process.env.CHIP_WARMUP_DAY1_MAX || '20')
        },
        day2: {
          min: parseInt(process.env.CHIP_WARMUP_DAY2_MIN || '30'),
          max: parseInt(process.env.CHIP_WARMUP_DAY2_MAX || '40')
        },
        day3: {
          min: parseInt(process.env.CHIP_WARMUP_DAY3_MIN || '50'),
          max: parseInt(process.env.CHIP_WARMUP_DAY3_MAX || '60')
        },
        mature: {
          min: parseInt(process.env.CHIP_WARMUP_MATURE_MIN || '70'),
          max: parseInt(process.env.CHIP_WARMUP_MATURE_MAX || '100')
        }
      },
      pausas: {
        batch: parseInt(process.env.ANTIBAN_BATCH_SIZE || '10'),
        pauseMin: parseInt(process.env.ANTIBAN_PAUSE_MIN || '60') * 1000,
        pauseMax: parseInt(process.env.ANTIBAN_PAUSE_MAX || '180') * 1000
      },
      requirements: {
        use4GOrProxy: true,
        enterGroups: 3, // Entrar em 3-5 grupos (Conti Chips)
        manualMessagesBefore: 5,
        monthlyRecharge: 15 // R$15-25 mensais
      }
    };
  }

  /**
   * Configuração da Evolution API
   */
  loadEvolutionConfig() {
    return {
      baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      apiKey: process.env.EVOLUTION_API_KEY,
      instances: this.getAllInstances()
    };
  }

  /**
   * Configuração de segurança
   */
  loadSecurityConfig() {
    return {
      webhookToken: process.env.WEBHOOK_TOKEN,
      apiKey: process.env.API_KEY,
      jwtSecret: process.env.JWT_SECRET,
      cors: {
        enabled: true,
        origins: process.env.CORS_ORIGINS?.split(',') || ['*']
      },
      rateLimit: {
        windowMs: 60000,
        max: 100
      }
    };
  }

  /**
   * Configuração de logging
   */
  loadLoggingConfig() {
    const logPrefix = process.env.LOG_PREFIX || `[${this.clientId || 'DEFAULT'}]`;
    return {
      level: process.env.LOG_LEVEL || 'info',
      prefix: logPrefix,
      dir: process.env.LOG_DIR || './logs',
      retention: process.env.LOG_RETENTION_DAYS || '30',
      format: 'json',
      files: {
        error: 'error.log',
        combined: 'combined.log',
        webhook: 'webhook.log',
        broadcast: 'broadcast.log'
      }
    };
  }

  /**
   * Configuração de monitoramento
   */
  loadMonitoringConfig() {
    return {
      metrics: {
        enabled: process.env.METRICS_ENABLED === 'true',
        port: parseInt(process.env.METRICS_PORT || '9091'),
        path: '/metrics'
      },
      healthcheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
        path: '/health'
      }
    };
  }

  /**
   * Retorna todas as instâncias configuradas
   */
  getAllInstances() {
    const instances = [];
    
    if (process.env.RECOVERY_INSTANCES) {
      instances.push(...process.env.RECOVERY_INSTANCES.split(','));
    }
    
    if (process.env.BROADCAST_INSTANCES) {
      instances.push(...process.env.BROADCAST_INSTANCES.split(','));
    }
    
    if (process.env.EVOLUTION_INSTANCE_NAME) {
      instances.push(process.env.EVOLUTION_INSTANCE_NAME);
    }
    
    return [...new Set(instances)]; // Remove duplicatas
  }

  /**
   * Configuração padrão (fallback)
   */
  loadDefaultConfig() {
    // Carrega configuração atual do sistema para compatibilidade
    return {
      client: {
        id: 'default',
        name: 'Default Configuration',
        serviceType: 'all'
      },
      app: {
        port: process.env.APP_PORT || 3000,
        env: process.env.NODE_ENV || 'development'
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'oraclewa',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'password'
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      evolution: {
        baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
        apiKey: process.env.EVOLUTION_API_KEY,
        instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'default-instance'
      }
    };
  }

  /**
   * Valida a configuração carregada
   */
  validateConfig() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    // Validações críticas
    if (this.serviceType === 'broadcast' && this.config.broadcast?.isolated) {
      logger.info('✅ Broadcast service is properly isolated');
    }

    if (this.config.broadcast?.antiban?.enabled) {
      logger.info('✅ Anti-ban strategy enabled:', this.config.broadcast.antiban.strategy);
    }

    return true;
  }

  /**
   * Retorna a configuração atual
   */
  getConfig() {
    if (!this.config) {
      this.loadClientConfig();
    }
    return this.config;
  }
}

// Singleton
const clientConfigLoader = new ClientConfigLoader();

export default clientConfigLoader;
export { ClientConfigLoader };