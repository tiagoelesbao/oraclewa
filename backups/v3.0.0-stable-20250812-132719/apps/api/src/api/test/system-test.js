import logger from '../../utils/logger.js';
import warmupManager from '../../services/whatsapp/warmup-manager.js';
import evolutionManager from '../../services/whatsapp/evolution-manager.js';
import { renderTemplateWithButtons } from '../../services/templates/renderer.js';
import { getButtonOptions } from '../../services/templates/button-options.js';

/**
 * Sistema de teste completo para verificar funcionalidades
 */
export class SystemTest {
  constructor() {
    this.testResults = {};
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    logger.info('🧪 INICIANDO TESTE COMPLETO DO SISTEMA');
    logger.info('=====================================');
    
    const tests = [
      this.testWarmupManager.bind(this),
      this.testEvolutionConnection.bind(this),
      this.testButtonSystem.bind(this),
      this.testTemplateRendering.bind(this),
      this.testMessageLimits.bind(this),
      this.testBusinessHours.bind(this)
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        logger.error(`Erro no teste: ${error.message}`);
      }
    }

    return this.generateReport();
  }

  /**
   * Testa o Warmup Manager
   */
  async testWarmupManager() {
    logger.info('\n📊 TESTE: Warmup Manager');
    logger.info('------------------------');
    
    const results = {
      dailyLimit: false,
      canSendMessage: false,
      recipientCooldown: false,
      recommendedDelay: false
    };

    try {
      // Teste 1: Limite diário
      const limit = await warmupManager.getDailyLimit('test-instance');
      logger.info(`✅ Limite diário: ${limit} (esperado: 5000)`);
      results.dailyLimit = limit === 5000;

      // Teste 2: Pode enviar mensagem
      const canSend = await warmupManager.canSendMessage('test-instance');
      logger.info(`✅ Pode enviar mensagem: ${canSend}`);
      results.canSendMessage = canSend;

      // Teste 3: Cooldown de destinatário
      const canMessage = await warmupManager.canMessageRecipient('5511999999999');
      logger.info(`✅ Cooldown 24h desabilitado: ${canMessage} (esperado: true)`);
      results.recipientCooldown = canMessage === true;

      // Teste 4: Delay recomendado
      const delay = await warmupManager.getRecommendedDelay('test-instance');
      logger.info(`✅ Delay recomendado: ${Math.round(delay/1000)}s (entre 60-120s)`);
      results.recommendedDelay = delay >= 60000 && delay <= 120000;

    } catch (error) {
      logger.error(`❌ Erro no teste Warmup Manager: ${error.message}`);
    }

    this.testResults.warmupManager = results;
  }

  /**
   * Testa conexão com Evolution API
   */
  async testEvolutionConnection() {
    logger.info('\n🔌 TESTE: Evolution API Connection');
    logger.info('----------------------------------');
    
    const results = {
      instancesInitialized: false,
      instanceStatus: false,
      canGetInstance: false
    };

    try {
      // Teste 1: Verificar instâncias
      const instances = evolutionManager.getInstancesStatus();
      logger.info(`✅ Instâncias carregadas: ${instances.length}`);
      results.instancesInitialized = instances.length > 0;

      // Teste 2: Status das instâncias
      const activeInstances = instances.filter(i => i.status === 'connected');
      logger.info(`✅ Instâncias conectadas: ${activeInstances.length}`);
      results.instanceStatus = activeInstances.length > 0;

      // Teste 3: Obter próxima instância
      try {
        const instance = await evolutionManager.getNextAvailableInstance();
        logger.info(`✅ Próxima instância disponível: ${instance.name}`);
        results.canGetInstance = true;
      } catch (error) {
        logger.warn(`⚠️ Nenhuma instância disponível: ${error.message}`);
      }

    } catch (error) {
      logger.error(`❌ Erro no teste Evolution API: ${error.message}`);
    }

    this.testResults.evolutionConnection = results;
  }

  /**
   * Testa sistema de botões
   */
  async testButtonSystem() {
    logger.info('\n🔘 TESTE: Sistema de Botões');
    logger.info('---------------------------');
    
    const results = {
      buttonOptionsLoaded: false,
      orderPaidButtons: false,
      orderExpiredButtons: false,
      buttonHandler: false
    };

    try {
      // Teste 1: Opções de botões carregadas
      const orderPaidOptions = getButtonOptions('ORDER_PAID');
      results.buttonOptionsLoaded = orderPaidOptions !== null;
      logger.info(`✅ Opções de botões carregadas: ${results.buttonOptionsLoaded}`);

      // Teste 2: Botões para order_paid
      if (orderPaidOptions) {
        results.orderPaidButtons = orderPaidOptions.buttons.length === 2;
        logger.info(`✅ Botões order_paid: ${orderPaidOptions.buttons.length} (esperado: 2)`);
      }

      // Teste 3: Botões para order_expired
      const orderExpiredOptions = getButtonOptions('ORDER_EXPIRED');
      if (orderExpiredOptions) {
        results.orderExpiredButtons = orderExpiredOptions.buttons.length === 2;
        logger.info(`✅ Botões order_expired: ${orderExpiredOptions.buttons.length} (esperado: 2)`);
      }

      // Teste 4: Handler de cliques
      const { handleButtonClick } = await import('../../services/templates/button-options.js');
      const response = await handleButtonClick('join_community', '5511999999999', 'test');
      results.buttonHandler = response.action === 'redirect';
      logger.info(`✅ Handler de botões funcionando: ${results.buttonHandler}`);

    } catch (error) {
      logger.error(`❌ Erro no teste de botões: ${error.message}`);
    }

    this.testResults.buttonSystem = results;
  }

  /**
   * Testa renderização de templates
   */
  async testTemplateRendering() {
    logger.info('\n📄 TESTE: Template Rendering');
    logger.info('----------------------------');
    
    const results = {
      orderPaidTemplate: false,
      orderExpiredTemplate: false,
      templateWithButtons: false
    };

    try {
      // Dados de teste
      const testData = {
        user: { name: 'Teste User' },
        product: { title: 'Produto Teste' },
        quantity: 1,
        total: '10.00',
        id: 'TEST-001'
      };

      // Teste 1: Template order_paid
      const { renderTemplate } = await import('../../services/templates/renderer.js');
      const orderPaidMsg = await renderTemplate('order_paid', testData);
      results.orderPaidTemplate = orderPaidMsg.includes('PARABÉNS');
      logger.info(`✅ Template order_paid renderizado: ${results.orderPaidTemplate}`);

      // Teste 2: Template order_expired
      const orderExpiredMsg = await renderTemplate('order_expired', testData);
      results.orderExpiredTemplate = orderExpiredMsg.includes('expirou') || orderExpiredMsg.includes('EXPIROU');
      logger.info(`✅ Template order_expired renderizado: ${results.orderExpiredTemplate}`);

      // Teste 3: Template com botões
      const templateWithButtons = await renderTemplateWithButtons('order_paid', testData);
      results.templateWithButtons = templateWithButtons.buttonOptions !== null;
      logger.info(`✅ Template com botões: ${results.templateWithButtons}`);

    } catch (error) {
      logger.error(`❌ Erro no teste de templates: ${error.message}`);
    }

    this.testResults.templateRendering = results;
  }

  /**
   * Testa limites de mensagens
   */
  async testMessageLimits() {
    logger.info('\n⏱️ TESTE: Limites de Mensagens');
    logger.info('-------------------------------');
    
    const results = {
      dailyLimitDisabled: false,
      cooldownDisabled: false,
      consecutiveMessages: false
    };

    try {
      // Teste 1: Limite diário desabilitado
      const limit = await warmupManager.getDailyLimit('test');
      results.dailyLimitDisabled = limit === 5000;
      logger.info(`✅ Limite diário desabilitado: ${results.dailyLimitDisabled} (limite: ${limit})`);

      // Teste 2: Cooldown desabilitado
      const canMessage = await warmupManager.canMessageRecipient('5511999999999');
      results.cooldownDisabled = canMessage === true;
      logger.info(`✅ Cooldown 24h desabilitado: ${results.cooldownDisabled}`);

      // Teste 3: Sistema de mensagens consecutivas
      for (let i = 0; i < 6; i++) {
        await warmupManager.recordMessageSent('test-consecutive');
      }
      const canSendAfter6 = await warmupManager.canSendMessage('test-consecutive');
      results.consecutiveMessages = !canSendAfter6; // Deve bloquear após 5
      logger.info(`✅ Pausa após 5 mensagens: ${results.consecutiveMessages}`);

    } catch (error) {
      logger.error(`❌ Erro no teste de limites: ${error.message}`);
    }

    this.testResults.messageLimits = results;
  }

  /**
   * Testa horário comercial
   */
  async testBusinessHours() {
    logger.info('\n⏰ TESTE: Horário Comercial');
    logger.info('---------------------------');
    
    const results = {
      currentHour: new Date().getHours(),
      businessHoursCheck: false
    };

    try {
      const canSend = await warmupManager.canSendMessage('test-hours');
      results.businessHoursCheck = canSend;
      logger.info(`✅ Hora atual: ${results.currentHour}h`);
      logger.info(`✅ Pode enviar agora: ${results.businessHoursCheck}`);
      logger.info(`ℹ️ Horário comercial temporariamente DESABILITADO`);

    } catch (error) {
      logger.error(`❌ Erro no teste de horário: ${error.message}`);
    }

    this.testResults.businessHours = results;
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    logger.info('\n📊 RELATÓRIO FINAL DOS TESTES');
    logger.info('=============================');
    
    let totalTests = 0;
    let passedTests = 0;

    for (const [category, results] of Object.entries(this.testResults)) {
      logger.info(`\n${category}:`);
      for (const [test, passed] of Object.entries(results)) {
        totalTests++;
        if (passed) passedTests++;
        const icon = passed ? '✅' : '❌';
        logger.info(`  ${icon} ${test}: ${passed}`);
      }
    }

    const percentage = Math.round((passedTests / totalTests) * 100);
    logger.info(`\n🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram (${percentage}%)`);
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      percentage,
      details: this.testResults
    };
  }
}

// Exportar função para executar testes
export async function runSystemTests() {
  const tester = new SystemTest();
  return await tester.runAllTests();
}

export default SystemTest;