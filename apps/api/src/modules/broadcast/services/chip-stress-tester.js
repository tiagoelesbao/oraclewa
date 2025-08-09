// Sistema de Stress Test para Descobrir Limites Reais dos Chips
import logger from '../../../utils/logger.js';
import axios from 'axios';
import { promises as fs } from 'fs';

export class ChipStressTester {
  constructor(config = {}) {
    this.evolutionUrl = config.evolutionUrl || process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
    this.apiKey = config.apiKey || process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    this.instanceName = config.instanceName || 'chip-test-001';
    
    // Configurações de teste
    this.testConfig = {
      currentLimit: 50,        // msgs/hora inicial
      incrementPercent: 25,    // incremento diário
      maxTestLimit: 300,       // limite máximo de teste
      testDuration: 7,         // dias de teste
      currentDay: 1
    };
    
    // Métricas de monitoramento
    this.metrics = {
      totalSent: 0,
      totalFailed: 0,
      averageResponseTime: 0,
      successRate: 100,
      shadowbanDetected: false,
      connectionStable: true,
      riskLevel: 'low'
    };
    
    // Histórico por dia
    this.dailyHistory = new Map();
    
    // Sistema de alertas
    this.alerts = {
      successRateThreshold: 90,
      responseTimeThreshold: 5000,
      consecutiveFailsThreshold: 5,
      shadowbanSuspicion: false
    };
    
    // Contadores
    this.consecutiveFails = 0;
    this.responseTimes = [];
    this.testStartTime = Date.now();
    
    this.initializeTest();
  }
  
  async initializeTest() {
    logger.info('🧪 Initializing Chip Stress Test System');
    await this.loadTestHistory();
    await this.checkInstanceHealth();
  }
  
  /**
   * Executa teste de stress para o dia atual
   */
  async runDailyStressTest(testDay, phoneNumbers, messageTemplate) {
    const dayConfig = this.getDayConfiguration(testDay);
    
    logger.info(`🚀 Starting Day ${testDay} Stress Test`, {
      messagesPerHour: dayConfig.messagesPerHour,
      totalMessages: dayConfig.totalMessages,
      riskLevel: dayConfig.riskLevel
    });
    
    const testResult = {
      day: testDay,
      startTime: Date.now(),
      config: dayConfig,
      metrics: {
        sent: 0,
        failed: 0,
        avgResponseTime: 0,
        successRate: 0
      },
      events: [],
      completed: false
    };
    
    try {
      // Executar teste do dia
      for (let hour = 0; hour < dayConfig.hoursOfOperation; hour++) {
        const hourResult = await this.executeHourlyBatch(
          phoneNumbers, 
          messageTemplate, 
          dayConfig,
          hour
        );
        
        testResult.metrics.sent += hourResult.sent;
        testResult.metrics.failed += hourResult.failed;
        testResult.events.push(...hourResult.events);
        
        // Verificar sinais de alerta a cada hora
        if (await this.checkAlertConditions()) {
          logger.warn('⚠️ Alert conditions detected, adjusting strategy');
          dayConfig.messagesPerHour *= 0.8; // Reduzir 20%
        }
        
        // Pausa entre horas (simulação)
        if (hour < dayConfig.hoursOfOperation - 1) {
          await this.sleep(5000); // 5s para simulação (seria 1 hora real)
        }
      }
      
      // Calcular métricas finais do dia
      testResult.metrics.successRate = testResult.metrics.sent > 0 
        ? (testResult.metrics.sent / (testResult.metrics.sent + testResult.metrics.failed)) * 100
        : 0;
      
      testResult.metrics.avgResponseTime = this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b) / this.responseTimes.length
        : 0;
      
      testResult.completed = true;
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      
      // Salvar resultados do dia
      this.dailyHistory.set(testDay, testResult);
      await this.saveTestHistory();
      
      // Analisar se devemos continuar
      const shouldContinue = this.analyzeDayResults(testResult);
      
      logger.info(`✅ Day ${testDay} completed`, {
        sent: testResult.metrics.sent,
        failed: testResult.metrics.failed,
        successRate: testResult.metrics.successRate.toFixed(1) + '%',
        shouldContinue
      });
      
      return {
        success: true,
        result: testResult,
        shouldContinue,
        recommendations: this.generateDayRecommendations(testResult)
      };
      
    } catch (error) {
      logger.error(`❌ Day ${testDay} test failed:`, error);
      testResult.error = error.message;
      return { success: false, error: error.message, result: testResult };
    }
  }
  
  /**
   * Executa lote de mensagens por hora
   */
  async executeHourlyBatch(phoneNumbers, messageTemplate, dayConfig, hour) {
    const hourResult = {
      hour,
      sent: 0,
      failed: 0,
      events: []
    };
    
    const messagesThisHour = dayConfig.messagesPerHour;
    const intervalMs = (60 * 60 * 1000) / messagesThisHour; // intervalo entre mensagens
    
    logger.info(`⏱️ Hour ${hour + 1}: Sending ${messagesThisHour} messages`);
    
    for (let i = 0; i < messagesThisHour; i++) {
      try {
        const phoneNumber = phoneNumbers[i % phoneNumbers.length];
        const personalizedMessage = this.personalizeMessage(messageTemplate, {
          name: `Teste ${i + 1}`,
          phone: phoneNumber
        });
        
        const sendStart = Date.now();
        const result = await this.sendTestMessage(phoneNumber, personalizedMessage);
        const responseTime = Date.now() - sendStart;
        
        this.responseTimes.push(responseTime);
        
        if (result.success) {
          hourResult.sent++;
          this.metrics.totalSent++;
          this.consecutiveFails = 0;
        } else {
          hourResult.failed++;
          this.metrics.totalFailed++;
          this.consecutiveFails++;
          
          hourResult.events.push({
            type: 'send_failed',
            time: Date.now(),
            phone: phoneNumber,
            error: result.error
          });
        }
        
        // Verificar alertas críticos
        if (this.consecutiveFails >= this.alerts.consecutiveFailsThreshold) {
          throw new Error(`${this.consecutiveFails} consecutive failures detected`);
        }
        
        // Delay entre mensagens (simulação rápida para teste)
        if (i < messagesThisHour - 1) {
          await this.sleep(Math.random() * 2000 + 1000); // 1-3s para simulação
        }
        
      } catch (error) {
        hourResult.failed++;
        hourResult.events.push({
          type: 'critical_error', 
          time: Date.now(),
          error: error.message
        });
        
        if (error.message.includes('consecutive failures')) {
          throw error; // Parar o teste
        }
      }
    }
    
    return hourResult;
  }
  
  /**
   * Envia mensagem de teste individual
   */
  async sendTestMessage(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.evolutionUrl}/message/sendText/${this.instanceName}`,
        {
          number: phoneNumber,
          text: message,
          delay: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          },
          timeout: 10000
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
  
  /**
   * Gera configuração para cada dia de teste
   */
  getDayConfiguration(day) {
    const baseConfig = {
      day,
      hoursOfOperation: 8, // 9h-17h
      riskLevel: 'low'
    };
    
    switch(day) {
      case 1:
      case 2:
        return {
          ...baseConfig,
          messagesPerHour: 50,
          totalMessages: 400,
          riskLevel: 'low'
        };
      
      case 3:
        return {
          ...baseConfig,
          messagesPerHour: 62, // +25%
          totalMessages: 496,
          riskLevel: 'low'
        };
        
      case 4:
        return {
          ...baseConfig,
          messagesPerHour: 75, // +50%
          totalMessages: 600,
          riskLevel: 'medium'
        };
        
      case 5:
        return {
          ...baseConfig,
          messagesPerHour: 87, // +75%
          totalMessages: 696,
          riskLevel: 'medium'
        };
        
      case 6:
        return {
          ...baseConfig,
          messagesPerHour: 120, // teste agressivo
          totalMessages: 960,
          riskLevel: 'high'
        };
        
      case 7:
        return {
          ...baseConfig,
          messagesPerHour: 200, // teste extremo
          totalMessages: 1600,
          riskLevel: 'critical'
        };
        
      default:
        return baseConfig;
    }
  }
  
  /**
   * Verifica condições de alerta
   */
  async checkAlertConditions() {
    const currentSuccessRate = this.metrics.totalSent > 0
      ? (this.metrics.totalSent / (this.metrics.totalSent + this.metrics.totalFailed)) * 100
      : 100;
    
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.slice(-10).reduce((a, b) => a + b) / 10
      : 0;
    
    // Atualizar métricas
    this.metrics.successRate = currentSuccessRate;
    this.metrics.averageResponseTime = avgResponseTime;
    
    // Verificar alertas
    const alerts = [];
    
    if (currentSuccessRate < this.alerts.successRateThreshold) {
      alerts.push(`Low success rate: ${currentSuccessRate.toFixed(1)}%`);
    }
    
    if (avgResponseTime > this.alerts.responseTimeThreshold) {
      alerts.push(`High response time: ${avgResponseTime}ms`);
    }
    
    if (this.consecutiveFails >= this.alerts.consecutiveFailsThreshold) {
      alerts.push(`Consecutive failures: ${this.consecutiveFails}`);
    }
    
    if (alerts.length > 0) {
      logger.warn('🚨 Alert conditions detected:', alerts);
      return true;
    }
    
    return false;
  }
  
  /**
   * Analisa resultados do dia e decide se continuar
   */
  analyzeDayResults(dayResult) {
    const successRate = dayResult.metrics.successRate;
    const riskLevel = dayResult.config.riskLevel;
    
    // Critérios para parar o teste
    if (successRate < 70) {
      logger.error('❌ Success rate too low, stopping test');
      return false;
    }
    
    if (dayResult.config.day >= 7) {
      logger.info('✅ Test cycle completed (7 days)');
      return false;
    }
    
    if (riskLevel === 'critical' && successRate < 90) {
      logger.warn('⚠️ Critical risk level with low success rate');
      return false;
    }
    
    return true;
  }
  
  /**
   * Gera relatório final do teste
   */
  generateFinalReport() {
    const totalDays = this.dailyHistory.size;
    let maxSafeLimit = 50; // limite mínimo
    let totalSent = 0;
    let totalFailed = 0;
    
    const reportData = {
      testPeriod: `${totalDays} days`,
      chipCost: 'R$ 120',
      testStartDate: new Date(this.testStartTime).toLocaleDateString('pt-BR'),
      testEndDate: new Date().toLocaleDateString('pt-BR'),
      dailyResults: [],
      summary: {},
      recommendations: {}
    };
    
    // Analisar cada dia
    for (const [day, result] of this.dailyHistory) {
      totalSent += result.metrics.sent;
      totalFailed += result.metrics.failed;
      
      if (result.metrics.successRate >= 95) {
        maxSafeLimit = Math.max(maxSafeLimit, result.config.messagesPerHour);
      }
      
      reportData.dailyResults.push({
        day,
        messagesPerHour: result.config.messagesPerHour,
        totalSent: result.metrics.sent,
        successRate: result.metrics.successRate.toFixed(1) + '%',
        riskLevel: result.config.riskLevel,
        duration: `${Math.round(result.duration / 1000 / 60)} min`
      });
    }
    
    const overallSuccessRate = totalSent > 0 
      ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)
      : '0';
    
    reportData.summary = {
      maxSafeLimit: `${maxSafeLimit} msgs/hora`,
      maxDailyCapacity: `${maxSafeLimit * 8} msgs/dia`,
      totalMessagesSent: totalSent,
      overallSuccessRate: `${overallSuccessRate}%`,
      chipEfficiency: this.calculateChipEfficiency(maxSafeLimit),
      recommendedScale: this.calculateScaleRecommendation(maxSafeLimit)
    };
    
    reportData.recommendations = this.generateScaleRecommendations(maxSafeLimit);
    
    return reportData;
  }
  
  /**
   * Calcula eficiência do chip vs chips comuns
   */
  calculateChipEfficiency(maxSafeLimit) {
    const commonChipLimit = 40; // msgs/hora chip comum
    const efficiency = ((maxSafeLimit / commonChipLimit) * 100).toFixed(0);
    const costEfficiency = (efficiency / 300).toFixed(1); // 300% mais caro
    
    return {
      vsCommonChip: `${efficiency}% mais eficiente`,
      costEfficiency: `${costEfficiency}x custo-benefício`
    };
  }
  
  /**
   * Calcula recomendação de escala para 1000 msgs/hora
   */
  calculateScaleRecommendation(maxSafeLimit) {
    const chipsNeeded = Math.ceil(1000 / maxSafeLimit);
    const totalCost = chipsNeeded * 120;
    const dailyCapacity = chipsNeeded * maxSafeLimit * 8;
    
    return {
      chipsFor1000PerHour: chipsNeeded,
      totalInvestment: `R$ ${totalCost}`,
      dailyCapacity: `${dailyCapacity} msgs/dia`,
      viability: totalCost < 2000 ? 'Viável' : 'Avaliar'
    };
  }
  
  // Métodos utilitários
  
  personalizeMessage(template, contact) {
    return template
      .replace(/{{name}}/g, contact.name || 'Cliente')
      .replace(/{{phone}}/g, contact.phone || '');
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async saveTestHistory() {
    try {
      const data = {
        testConfig: this.testConfig,
        metrics: this.metrics,
        dailyHistory: Array.from(this.dailyHistory.entries()),
        lastUpdate: new Date().toISOString()
      };
      
      await fs.writeFile(
        './chip-stress-test-results.json',
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save test history:', error);
    }
  }
  
  async loadTestHistory() {
    try {
      const data = await fs.readFile('./chip-stress-test-results.json', 'utf-8');
      const parsed = JSON.parse(data);
      
      this.testConfig = parsed.testConfig || this.testConfig;
      this.metrics = parsed.metrics || this.metrics;
      this.dailyHistory = new Map(parsed.dailyHistory || []);
      
      logger.info('✅ Test history loaded');
    } catch (error) {
      logger.info('📝 Starting fresh test (no previous history)');
    }
  }
  
  async checkInstanceHealth() {
    try {
      const response = await axios.get(
        `${this.evolutionUrl}/instance/connectionState/${this.instanceName}`,
        { headers: { 'apikey': this.apiKey } }
      );
      
      const isConnected = response.data?.instance?.state === 'open';
      this.metrics.connectionStable = isConnected;
      
      if (!isConnected) {
        throw new Error(`Instance ${this.instanceName} is not connected`);
      }
      
      logger.info(`✅ Instance ${this.instanceName} is healthy and connected`);
    } catch (error) {
      logger.error(`❌ Instance health check failed: ${error.message}`);
      throw error;
    }
  }
  
  generateScaleRecommendations(maxSafeLimit) {
    const scenarios = [
      { target: 1000, description: '1000 msgs/hora' },
      { target: 2000, description: '2000 msgs/hora' },
      { target: 5000, description: '5000 msgs/hora' }
    ];
    
    return scenarios.map(scenario => ({
      target: scenario.description,
      chipsNeeded: Math.ceil(scenario.target / maxSafeLimit),
      investment: `R$ ${Math.ceil(scenario.target / maxSafeLimit) * 120}`,
      viability: (Math.ceil(scenario.target / maxSafeLimit) * 120) < 3000 ? 'Viável' : 'Caro'
    }));
  }
}

export default ChipStressTester;