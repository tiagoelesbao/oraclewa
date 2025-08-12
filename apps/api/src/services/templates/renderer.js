import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';
// Variações serão carregadas dinamicamente via Template Manager
import { getButtonOptions } from './button-options.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = {};

Handlebars.registerHelper('currency', (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
});

Handlebars.registerHelper('date', (value) => {
  return new Date(value).toLocaleDateString('pt-BR');
});

export const loadTemplates = async () => {
  try {
    const templatesDir = path.join(__dirname, 'messages');
    const files = await fs.readdir(templatesDir);
    
    for (const file of files) {
      if (file.endsWith('.hbs')) {
        const templateName = file.replace('.hbs', '');
        const templatePath = path.join(templatesDir, file);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        templates[templateName] = Handlebars.compile(templateContent);
        logger.info(`Template loaded: ${templateName}`);
      }
    }
  } catch (error) {
    logger.error('Error loading templates:', error);
    await createDefaultTemplates();
  }
};

const createDefaultTemplates = async () => {
  const defaultTemplates = {
    carrinho_abandonado: `Olá {{customerName}}! 🛒

Notamos que você deixou alguns itens incríveis no seu carrinho:
{{#each items}}
• {{this.name}} ({{this.quantity}}x)
{{/each}}

Total: {{cartTotal}}

Que tal finalizar sua compra? Seus produtos estão te esperando!
👉 {{recoveryUrl}}

Válido por 24 horas. Não perca!`,

    venda_expirada: `Oi {{customerName}}! ⏰

Sua reserva no valor de {{orderTotal}} está prestes a expirar!

Data limite: {{expirationDate}}

Finalize agora e garanta seus produtos:
👉 {{paymentUrl}}

Após o vencimento, não podemos garantir a disponibilidade dos itens.`,

    venda_aprovada: `Parabéns {{customerName}}! 🎉

Sua compra #{{orderId}} foi aprovada com sucesso!

Valor total: {{orderTotal}}

{{#if trackingCode}}
Código de rastreamento: {{trackingCode}}
{{/if}}

{{#if estimatedDelivery}}
Previsão de entrega: {{estimatedDelivery}}
{{/if}}

Produtos:
{{#each items}}
• {{this.name}} ({{this.quantity}}x)
{{/each}}

Obrigado por comprar conosco! 💚`
  };

  const templatesDir = path.join(__dirname, 'messages');
  
  try {
    await fs.mkdir(templatesDir, { recursive: true });
    
    for (const [name, content] of Object.entries(defaultTemplates)) {
      const filePath = path.join(templatesDir, `${name}.hbs`);
      await fs.writeFile(filePath, content, 'utf-8');
      templates[name] = Handlebars.compile(content);
      logger.info(`Default template created: ${name}`);
    }
  } catch (error) {
    logger.error('Error creating default templates:', error);
    
    for (const [name, content] of Object.entries(defaultTemplates)) {
      templates[name] = Handlebars.compile(content);
    }
  }
};

// Prevent infinite loops in template loading
let isLoadingTemplates = false;

export const renderTemplate = async (templateName, data, clientId = null) => {
  // Tentar carregar template específico do cliente com variação
  if (clientId && Math.random() > 0.3) { // 70% chance de usar variação
    try {
      const variation = await loadClientVariation(clientId, templateName);
      if (variation) {
        logger.info(`Using template variation for ${clientId}/${templateName}`);
        const compiledVariation = Handlebars.compile(variation);
        return compiledVariation(data);
      }
    } catch (error) {
      logger.warn(`Failed to load variation for ${clientId}/${templateName}:`, error.message);
    }
  }
  
  // Usar template padrão
  if (!templates[templateName] && !isLoadingTemplates) {
    isLoadingTemplates = true;
    try {
      await loadTemplates();
    } catch (error) {
      logger.error('Failed to load templates:', error);
    } finally {
      isLoadingTemplates = false;
    }
  }
  
  const template = templates[templateName];
  
  if (!template) {
    logger.error(`Template not found: ${templateName}. Available templates:`, Object.keys(templates));
    
    // Create a simple fallback template inline
    const fallbackTemplate = templateName === 'order_expired' 
      ? `Olá {{user.name}}! Suas {{quantity}} cotas estão expirando. Total: R$ {{total}}`
      : `Olá {{user.name}}! Pagamento confirmado. {{quantity}} cotas - R$ {{total}}`;
    
    const compiled = Handlebars.compile(fallbackTemplate);
    return compiled(data);
  }
  
  try {
    return template(data);
  } catch (error) {
    logger.error(`Error rendering template ${templateName}:`, error);
    throw error;
  }
};

/**
 * Renderiza template com botões (para instâncias ZAPI)
 * Para Evolution API, retorna apenas o texto
 */
export const renderTemplateWithButtons = async (templateName, data, instanceType = 'evolution') => {
  const messageContent = await renderTemplate(templateName, data, data.clientId);
  
  // Se for ZAPI, adicionar botões
  if (instanceType === 'zapi') {
    const buttonOptionsKey = templateName.toUpperCase();
    const buttonOptions = getButtonOptions(buttonOptionsKey);
    
    return {
      message: messageContent,
      buttonOptions: buttonOptions,
      supportsButtons: true
    };
  }
  
  // Evolution API - apenas texto
  return {
    message: messageContent,
    supportsButtons: false
  };
};

/**
 * Carrega variação de template específica do cliente
 */
const loadClientVariation = async (clientId, templateName) => {
  try {
    const variationPath = path.resolve(process.cwd(), 'clients', clientId, 'templates', 'variations', `${templateName}-variations.js`);
    const variationModule = await import(variationPath);
    
    if (variationModule.getRandomVariation) {
      return variationModule.getRandomVariation();
    }
    
    return null;
  } catch (error) {
    // Arquivo não existe ou erro de import - retorna null silenciosamente
    return null;
  }
};

loadTemplates();