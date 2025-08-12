/**
 * Template Manager - Gerenciador Escalável de Templates
 * Carrega templates dinamicamente baseado no cliente
 */
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import clientManager from './client-manager.js';

class TemplateManager {
  constructor() {
    this.templates = new Map(); // clientId -> templateType -> template
    this.initialized = false;
  }

  /**
   * Inicializa o gerenciador de templates
   */
  async initialize() {
    try {
      logger.info('🎨 Initializing Template Manager...');
      await this.loadAllTemplates();
      this.initialized = true;
      logger.info(`✅ Template Manager initialized with templates for ${this.templates.size} clients`);
    } catch (error) {
      logger.error('❌ Failed to initialize Template Manager:', error);
      throw error;
    }
  }

  /**
   * Carrega todos os templates de todos os clientes
   */
  async loadAllTemplates() {
    const clients = clientManager.getActiveClients();
    
    for (const client of clients) {
      await this.loadClientTemplates(client.id);
    }
  }

  /**
   * Carrega templates de um cliente específico
   */
  async loadClientTemplates(clientId) {
    try {
      const templatesPath = clientManager.getClientPath(clientId, 'templates');
      
      try {
        const files = await fs.readdir(templatesPath);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        if (!this.templates.has(clientId)) {
          this.templates.set(clientId, new Map());
        }
        
        const clientTemplates = this.templates.get(clientId);
        
        for (const file of jsFiles) {
          const templateName = path.basename(file, '.js');
          const templatePath = path.join(templatesPath, file);
          
          try {
            // Importar template dinamicamente
            const templateModule = await import(`file://${templatePath}`);
            clientTemplates.set(templateName, templateModule);
            
            logger.debug(`📄 Template loaded: ${clientId}/${templateName}`);
          } catch (error) {
            logger.warn(`⚠️ Failed to load template ${clientId}/${templateName}:`, error.message);
          }
        }
        
        logger.info(`✅ Templates loaded for client: ${clientId} (${jsFiles.length} templates)`);
        
      } catch (error) {
        logger.warn(`⚠️ No templates directory for client: ${clientId}`);
      }
      
    } catch (error) {
      logger.error(`❌ Failed to load templates for client ${clientId}:`, error);
    }
  }

  /**
   * Obtém template de um cliente
   */
  getTemplate(clientId, templateType) {
    if (!this.initialized) {
      throw new Error('Template Manager not initialized');
    }
    
    const clientTemplates = this.templates.get(clientId);
    if (!clientTemplates) {
      throw new Error(`No templates found for client: ${clientId}`);
    }
    
    const template = clientTemplates.get(templateType);
    if (!template) {
      throw new Error(`Template not found: ${clientId}/${templateType}`);
    }
    
    return template;
  }

  /**
   * Gera mensagem usando template com sistema de variações
   */
  async generateMessage(clientId, templateType, data) {
    try {
      // 70% chance de usar variação
      if (Math.random() > 0.3) {
        try {
          const variation = await this.loadClientVariation(clientId, templateType);
          if (variation) {
            logger.info(`🎲 Using template variation for ${clientId}/${templateType}`);
            return this.compileTemplate(variation, data);
          }
        } catch (error) {
          logger.warn(`Failed to load variation for ${clientId}/${templateType}:`, error.message);
        }
      }
      
      // Fallback para template padrão
      const template = this.getTemplate(clientId, templateType);
      
      // Se tem função de geração específica
      if (template.generateOrderPaidMessage && templateType.includes('paid')) {
        return template.generateOrderPaidMessage(data.customerName, data.productName, data.total);
      }
      
      if (template.generateOrderExpiredMessage && templateType.includes('expired')) {
        return template.generateOrderExpiredMessage(data.customerName, data.productName, data.total);
      }
      
      // Função genérica
      if (template.generateMessage) {
        return template.generateMessage(data);
      }
      
      throw new Error(`No generation function found in template: ${clientId}/${templateType}`);
      
    } catch (error) {
      logger.error(`❌ Failed to generate message:`, error);
      throw error;
    }
  }

  /**
   * Lista templates de um cliente
   */
  getClientTemplates(clientId) {
    const clientTemplates = this.templates.get(clientId);
    if (!clientTemplates) {
      return [];
    }
    
    return Array.from(clientTemplates.keys()).map(templateType => {
      const template = clientTemplates.get(templateType);
      return {
        type: templateType,
        config: template.ORDER_PAID_CONFIG || template.ORDER_EXPIRED_CONFIG || {},
        hasGenerator: !!(
          template.generateMessage || 
          template.generateOrderPaidMessage || 
          template.generateOrderExpiredMessage
        )
      };
    });
  }

  /**
   * Obtém estatísticas dos templates
   */
  getTemplateStats() {
    const stats = {
      totalClients: this.templates.size,
      totalTemplates: 0,
      clientTemplates: {}
    };
    
    for (const [clientId, clientTemplates] of this.templates) {
      const count = clientTemplates.size;
      stats.totalTemplates += count;
      stats.clientTemplates[clientId] = count;
    }
    
    return stats;
  }

  /**
   * Recarrega templates de um cliente
   */
  async reloadClientTemplates(clientId) {
    logger.info(`🔄 Reloading templates for client: ${clientId}`);
    
    // Limpar templates existentes do cliente
    this.templates.delete(clientId);
    
    // Recarregar
    await this.loadClientTemplates(clientId);
  }

  /**
   * Recarrega todos os templates
   */
  async reloadAllTemplates() {
    logger.info('🔄 Reloading all templates...');
    this.templates.clear();
    await this.loadAllTemplates();
    logger.info(`✅ Reloaded templates for ${this.templates.size} clients`);
  }

  /**
   * Valida se template existe
   */
  hasTemplate(clientId, templateType) {
    const clientTemplates = this.templates.get(clientId);
    return clientTemplates && clientTemplates.has(templateType);
  }

  /**
   * Carrega variação de template específica do cliente
   */
  async loadClientVariation(clientId, templateType) {
    try {
      const variationPath = path.resolve(process.cwd(), 'clients', clientId, 'templates', 'variations', `${templateType}-variations.js`);
      const variationModule = await import(`file://${variationPath}?t=${Date.now()}`);
      
      if (variationModule.getRandomVariation) {
        return variationModule.getRandomVariation();
      }
      
      return null;
    } catch (error) {
      // Arquivo não existe ou erro de import - retorna null silenciosamente
      return null;
    }
  }

  /**
   * Compila template usando substituição de variáveis
   */
  compileTemplate(template, data) {
    let compiled = template;
    
    // Substituir variáveis {{variableName}}
    compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return data[varName] || match;
    });
    
    return compiled;
  }
}

// Instância singleton
const templateManager = new TemplateManager();

export default templateManager;