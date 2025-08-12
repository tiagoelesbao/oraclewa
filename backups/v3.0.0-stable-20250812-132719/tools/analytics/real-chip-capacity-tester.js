// 🧪 TESTE PROGRESSIVO REAL - CHIP R$ 120
// Sistema científico para descobrir capacidade real gradualmente

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const CONFIG = {
  // Configuração da instância de teste
  evolutionUrl: 'http://128.140.7.154:8080',
  apiKey: 'Imperio2024@EvolutionSecure', 
  instanceName: 'broadcast-imperio', // usar instância existente
  
  // Configuração financeira
  chipCost: 120.00,
  revenuePerMessage: 0.10,
  breakEvenMessages: 1200, // 120 / 0.10
  
  // Configuração de horários (9h às 14h = 5 horas)
  startHour: 9,
  endHour: 14,
  totalHours: 5,
  
  // Números para teste (usar seu número + alguns de teste)
  testNumbers: [
    '5511959761948', // Seu número principal
    '5511959761948', // Repetir para simular lista maior
    '5511959761948',
    '5511959761948',
    '5511959761948'
  ]
};

class RealChipCapacityTester {
  constructor() {
    this.currentDay = 1;
    this.currentMessagesPerHour = 20; // Começar conservador
    this.testResults = [];
    this.shadowbanDetected = false;
    this.testStarted = null;
    this.logFile = `chip-test-${Date.now()}.json`;
  }
  
  // 📊 Escalonamento progressivo baseado no dia
  getMessagesPerHourForDay(day) {
    const schedule = {
      1: 20,  // DIA 1: Baseline conservador
      2: 30,  // DIA 2: Incremento moderado  
      3: 40,  // DIA 3: Teste intermediário
      4: 50,  // DIA 4: Teste agressivo
      5: 70,  // DIA 5: Limite alto
      6: 90,  // DIA 6: Muito agressivo
      7: 120  // DIA 7: Máximo teórico
    };
    
    return schedule[day] || 150; // Dias extras = 150/hora
  }
  
  // 🎯 Template de mensagem para teste
  generateTestMessage(messageNum, totalToday) {
    const templates = [
      `🎯 *TESTE PROGRESSIVO DIA ${this.currentDay}*

Olá! Este é um teste científico real.

📊 *Dados do teste:*
• Dia: ${this.currentDay}/7
• Mensagem: ${messageNum}/${totalToday}
• Velocidade: ${this.currentMessagesPerHour} msgs/hora
• Horário: ${new Date().toLocaleTimeString('pt-BR')}

💰 *Objetivo:* Descobrir capacidade real de chip R$ ${CONFIG.chipCost}

*Império Prêmios - Departamento de P&D*
_Teste científico de broadcasting_`,

      `🧪 *CAPACIDADE REAL - DIA ${this.currentDay}*

Teste em andamento!

📈 *Progress:*
• Velocidade atual: ${this.currentMessagesPerHour}/hora  
• Total hoje: ${messageNum}/${totalToday}
• ROI: ${(messageNum * CONFIG.revenuePerMessage).toFixed(2)}/R$ ${CONFIG.chipCost}

🎯 Meta: Encontrar limite máximo seguro

*Império Prêmios*`,

      `⚡ *STRESS TEST - DIA ${this.currentDay}*

Sistema operando em velocidade real!

🔥 *Status:*
• Msgs/hora: ${this.currentMessagesPerHour}
• Progresso: ${messageNum}/${totalToday}
• Receita hoje: R$ ${(messageNum * CONFIG.revenuePerMessage).toFixed(2)}

🎯 Descobrindo limites reais do WhatsApp

*Império - Inovação em Scale*`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  // 📱 Enviar mensagem real via Evolution API
  async sendRealMessage(phoneNumber, message, messageNum) {
    try {
      const response = await axios.post(
        `${CONFIG.evolutionUrl}/message/sendText/${CONFIG.instanceName}`,
        {
          number: phoneNumber,
          text: message,
          delay: this.calculateDelay()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.apiKey
          },
          timeout: 30000
        }
      );
      
      return {
        success: true,
        messageId: response.data?.key?.id || 'unknown',
        timestamp: new Date().toISOString(),
        phoneNumber,
        messageNum,
        responseTime: Date.now()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        phoneNumber,
        messageNum,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // ⏱️ Calcular delay entre mensagens
  calculateDelay() {
    const baseInterval = (60 * 60 * 1000) / this.currentMessagesPerHour; // ms por mensagem
    const randomVariation = 0.2; // ±20% de variação
    const variation = (Math.random() - 0.5) * 2 * randomVariation;
    
    return Math.floor(baseInterval * (1 + variation));
  }
  
  // 🛡️ Detectar possível shadowban
  async detectShadowban(results) {
    const recentResults = results.slice(-10); // Últimas 10 mensagens
    
    if (recentResults.length < 5) return false;
    
    const failureRate = recentResults.filter(r => !r.success).length / recentResults.length;
    const avgResponseTime = recentResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.responseTime || 1000), 0) / recentResults.length;
    
    // Critérios de shadowban
    const highFailureRate = failureRate > 0.3; // >30% falhas
    const slowResponseTime = avgResponseTime > 10000; // >10s resposta
    
    return {
      detected: highFailureRate || slowResponseTime,
      failureRate: (failureRate * 100).toFixed(1),
      avgResponseTime: Math.round(avgResponseTime),
      reasons: [
        ...(highFailureRate ? [`Alta taxa de falhas: ${(failureRate * 100).toFixed(1)}%`] : []),
        ...(slowResponseTime ? [`Resposta lenta: ${Math.round(avgResponseTime)}ms`] : [])
      ]
    };
  }
  
  // 📊 Executar teste de um dia
  async runDailyTest() {
    const day = this.currentDay;
    const messagesPerHour = this.getMessagesPerHourForDay(day);
    this.currentMessagesPerHour = messagesPerHour;
    
    const totalMessages = messagesPerHour * CONFIG.totalHours;
    const intervalMs = (CONFIG.totalHours * 60 * 60 * 1000) / totalMessages;
    
    console.log(`\\n🗓️ === DIA ${day} - INICIANDO ===`);
    console.log(`⚡ Velocidade: ${messagesPerHour} msgs/hora`);
    console.log(`📊 Total previsto: ${totalMessages} mensagens`);
    console.log(`⏱️ Intervalo médio: ${Math.round(intervalMs/1000)}s`);
    console.log(`💰 Receita esperada: R$ ${(totalMessages * CONFIG.revenuePerMessage).toFixed(2)}`);
    console.log(`🕒 Horário: ${CONFIG.startHour}h às ${CONFIG.endHour}h\\n`);
    
    const dayResults = [];
    let messagesSent = 0;
    let shouldStop = false;
    
    // Simular 5 horas de envio (tempo acelerado para teste)
    const testDurationMs = 10 * 60 * 1000; // 10 minutos = 1 dia de teste
    const actualIntervalMs = testDurationMs / totalMessages;
    
    console.log(`⚡ MODO TESTE ACELERADO: ${Math.round(actualIntervalMs/1000)}s por mensagem\\n`);
    
    for (let i = 1; i <= totalMessages && !shouldStop; i++) {
      const phoneNumber = CONFIG.testNumbers[i % CONFIG.testNumbers.length];
      const message = this.generateTestMessage(i, totalMessages);
      
      console.log(`📤 Enviando ${i}/${totalMessages} para ${phoneNumber.substring(0,8)}...`);
      
      const result = await this.sendRealMessage(phoneNumber, message, i);
      dayResults.push(result);
      
      if (result.success) {
        messagesSent++;
        console.log(`   ✅ Enviada em ${result.responseTime || 'N/A'}ms`);
      } else {
        console.log(`   ❌ Falhou: ${result.error}`);
      }
      
      // Verificar shadowban a cada 5 mensagens
      if (i % 5 === 0) {
        const shadowbanCheck = await this.detectShadowban(dayResults);
        
        if (shadowbanCheck.detected) {
          console.log(`\\n🚨 POSSÍVEL SHADOWBAN DETECTADO!`);
          console.log(`   📊 Taxa de falhas: ${shadowbanCheck.failureRate}%`);
          console.log(`   ⏱️ Tempo resposta: ${shadowbanCheck.avgResponseTime}ms`);
          console.log(`   🛑 Interrompendo teste por segurança...`);
          
          shouldStop = true;
          this.shadowbanDetected = true;
          break;
        }
      }
      
      // Aguardar intervalo calculado
      if (i < totalMessages) {
        await new Promise(resolve => setTimeout(resolve, actualIntervalMs));
      }
    }
    
    // Calcular métricas do dia
    const successfulMessages = dayResults.filter(r => r.success).length;
    const failedMessages = dayResults.filter(r => !r.success).length;
    const successRate = (successfulMessages / dayResults.length) * 100;
    const revenue = successfulMessages * CONFIG.revenuePerMessage;
    
    const dayReport = {
      day,
      plannedMessagesPerHour: messagesPerHour,
      plannedTotal: totalMessages,
      actualSent: successfulMessages,
      failed: failedMessages,
      successRate: successRate.toFixed(1),
      revenue: revenue.toFixed(2),
      shadowbanDetected: shouldStop,
      timestamp: new Date().toISOString(),
      results: dayResults
    };
    
    this.testResults.push(dayReport);
    
    console.log(`\\n📊 === RESULTADO DIA ${day} ===`);
    console.log(`✅ Enviadas: ${successfulMessages}/${totalMessages}`);
    console.log(`❌ Falharam: ${failedMessages}`);  
    console.log(`📊 Taxa sucesso: ${successRate.toFixed(1)}%`);
    console.log(`💰 Receita: R$ ${revenue.toFixed(2)}`);
    console.log(`🛡️ Shadowban: ${shouldStop ? 'DETECTADO' : 'NÃO'}`);
    
    return {
      success: !shouldStop,
      shouldContinue: !shouldStop && successRate >= 80, // Continuar se >80% sucesso
      dayReport,
      shadowbanDetected: shouldStop
    };
  }
  
  // 🚀 Executar teste completo (7 dias progressivos)
  async runFullCapacityTest() {
    console.log(`🧪 === TESTE PROGRESSIVO REAL - CHIP R$ ${CONFIG.chipCost} ===`);
    console.log(`💰 ROI necessário: ${CONFIG.breakEvenMessages} mensagens`);
    console.log(`⏰ Teste simulado: 7 dias progressivos`);
    console.log(`📱 Instância: ${CONFIG.instanceName}\\n`);
    
    this.testStarted = new Date();
    
    for (let day = 1; day <= 7; day++) {
      this.currentDay = day;
      
      const dayResult = await this.runDailyTest();
      
      if (!dayResult.shouldContinue) {
        console.log(`\\n🛑 Teste interrompido no dia ${day}`);
        if (dayResult.shadowbanDetected) {
          console.log(`🚨 Motivo: Shadowban detectado`);
        } else {
          console.log(`⚠️ Motivo: Taxa de sucesso baixa`);
        }
        break;
      }
      
      // Pausa entre dias (2 segundos = 1 dia)
      if (day < 7) {
        console.log(`\\n⏸️ Pausando até o próximo dia...\\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return this.generateFinalReport();
  }
  
  // 📊 Gerar relatório final
  generateFinalReport() {
    const totalMessagesSent = this.testResults.reduce((sum, day) => sum + parseInt(day.actualSent), 0);
    const totalRevenue = totalMessagesSent * CONFIG.revenuePerMessage;
    const totalDays = this.testResults.length;
    const avgSuccessRate = this.testResults.reduce((sum, day) => sum + parseFloat(day.successRate), 0) / totalDays;
    
    // Encontrar maior velocidade sustentável
    const maxSafeSpeed = this.testResults
      .filter(day => parseFloat(day.successRate) >= 80)
      .map(day => day.plannedMessagesPerHour)
      .pop() || 0;
    
    // Calcular quantos chips para 1000 msgs/hora
    const chipsFor1000 = maxSafeSpeed > 0 ? Math.ceil(1000 / maxSafeSpeed) : 'N/A';
    const investmentFor1000 = chipsFor1000 !== 'N/A' ? chipsFor1000 * CONFIG.chipCost : 'N/A';
    
    const report = {
      testSummary: {
        chipCost: CONFIG.chipCost,
        testDuration: `${totalDays} dias`,
        totalMessagesSent,
        totalRevenue: totalRevenue.toFixed(2),
        avgSuccessRate: avgSuccessRate.toFixed(1),
        shadowbanDetected: this.shadowbanDetected,
        breakEvenProgress: `${totalMessagesSent}/${CONFIG.breakEvenMessages} (${((totalMessagesSent/CONFIG.breakEvenMessages)*100).toFixed(1)}%)`
      },
      capacityDiscovery: {
        maxSafeMessagesPerHour: maxSafeSpeed,
        maxDailyCapacity: maxSafeSpeed * 8, // 8h trabalho
        chipsNeededFor1000PerHour: chipsFor1000,
        investmentFor1000PerHour: investmentFor1000,
        viability: maxSafeSpeed >= 70 ? 'VIÁVEL' : maxSafeSpeed >= 50 ? 'QUESTIONÁVEL' : 'INVIÁVEL'
      },
      dailyResults: this.testResults,
      timestamp: new Date().toISOString(),
      testStarted: this.testStarted?.toISOString(),
      testCompleted: new Date().toISOString()
    };
    
    return report;
  }
  
  // 💾 Salvar relatório
  async saveReport(report) {
    try {
      await fs.writeFile(this.logFile, JSON.stringify(report, null, 2));
      console.log(`\\n💾 Relatório salvo em: ${this.logFile}`);
    } catch (error) {
      console.error(`❌ Erro ao salvar relatório:`, error.message);
    }
  }
}

// 🚀 Executar teste
async function main() {
  console.log(`⚠️ ATENÇÃO: Este é um TESTE REAL com mensagens reais!`);
  console.log(`💰 Custo por teste: ~R$ 0,50 (5 msgs x R$ 0,10)`);
  console.log(`🎯 Descobrirá a capacidade real do chip R$ 120\\n`);
  
  const tester = new RealChipCapacityTester();
  
  try {
    const finalReport = await tester.runFullCapacityTest();
    await tester.saveReport(finalReport);
    
    console.log(`\\n🎯 === CONCLUSÕES FINAIS ===`);
    console.log(`💰 Chip testado: R$ ${finalReport.testSummary.chipCost}`);
    console.log(`📊 Mensagens enviadas: ${finalReport.testSummary.totalMessagesSent}`);  
    console.log(`💵 Receita gerada: R$ ${finalReport.testSummary.totalRevenue}`);
    console.log(`⚡ Capacidade máxima: ${finalReport.capacityDiscovery.maxSafeMessagesPerHour} msgs/hora`);
    console.log(`🎯 Para 1000 msgs/hora: ${finalReport.capacityDiscovery.chipsNeededFor1000PerHour} chips`);
    console.log(`💸 Investimento necessário: R$ ${finalReport.capacityDiscovery.investmentFor1000PerHour}`);
    console.log(`✅ Viabilidade: ${finalReport.capacityDiscovery.viability}`);
    
    if (finalReport.capacityDiscovery.maxSafeMessagesPerHour >= 70) {
      console.log(`\\n🟢 RECOMENDAÇÃO: Chip vale o investimento!`);
    } else if (finalReport.capacityDiscovery.maxSafeMessagesPerHour >= 50) {
      console.log(`\\n🟡 RECOMENDAÇÃO: Avaliar alternativas mais baratas`);  
    } else {
      console.log(`\\n🔴 RECOMENDAÇÃO: Chip NÃO vale R$ 120`);
    }
    
  } catch (error) {
    console.error(`💥 Erro no teste:`, error.message);
  }
}

// Executar
main();