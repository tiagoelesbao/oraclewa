import { getZapiManager } from './services/zapi-manager.js';
import logger from '../../utils/logger.js';

export class BroadcastModule {
  constructor() {
    this.initialized = false;
    this.zapiManager = null;
  }

  async initialize() {
    try {
      logger.info('=== BROADCAST MODULE INITIALIZATION ===');
      
      // Check if module is enabled
      if (process.env.BROADCAST_MODULE_ENABLED !== 'true') {
        logger.warn('Broadcast module is disabled (BROADCAST_MODULE_ENABLED !== true)');
        return false;
      }

      // Initialize ZAPI manager
      this.zapiManager = await getZapiManager();
      
      // Test connection
      const status = await this.zapiManager.getStatus();
      if (!status.connected) {
        throw new Error('ZAPI connection failed - check credentials and instance status');
      }

      logger.info('✅ Broadcast module initialized successfully', {
        provider: 'zapi',
        connected: status.connected
      });

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize broadcast module:', error);
      
      // Don't fail the entire app if broadcast module fails
      logger.warn('🔄 App will continue without broadcast functionality');
      return false;
    }
  }

  async getStatus() {
    if (!this.initialized) {
      return {
        enabled: false,
        initialized: false,
        error: 'Module not initialized'
      };
    }

    try {
      const zapiStatus = await this.zapiManager.getStatus();
      return {
        enabled: true,
        initialized: this.initialized,
        provider: 'zapi',
        connection: zapiStatus
      };
    } catch (error) {
      return {
        enabled: true,
        initialized: this.initialized,
        error: error.message
      };
    }
  }

  isEnabled() {
    return process.env.BROADCAST_MODULE_ENABLED === 'true';
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
export const broadcastModule = new BroadcastModule();

// Auto-initialize if enabled (DISABLED FOR STABILITY)
// NOTE: Temporarily disabled to prevent startup blocking
// Enable only when ZAPI credentials are properly configured
/*
if (broadcastModule.isEnabled()) {
  broadcastModule.initialize().then((success) => {
    if (success) {
      logger.info('🚀 Broadcast module ready for use');
    } else {
      logger.warn('⚠️ Broadcast module failed to initialize - check configuration');
    }
  }).catch((error) => {
    logger.error('💥 Critical error in broadcast module initialization:', error);
  });
}
*/
logger.info('📢 Broadcast module auto-initialization disabled for stability');

export default broadcastModule;