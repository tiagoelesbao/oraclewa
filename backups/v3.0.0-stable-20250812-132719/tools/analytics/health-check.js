// Health Check Completo - OracleWA Império
import axios from 'axios';
import chalk from 'chalk';

const CONFIG = {
  evolutionUrl: 'http://128.140.7.154:8080',
  railwayUrl: 'https://oraclewa-imperio-production.up.railway.app',
  apiKey: 'Imperio2024@EvolutionSecure',
  instances: ['imperio1', 'broadcast-imperio']
};

async function checkEvolutionAPI() {
  console.log(chalk.blue('\n🔍 Verificando Evolution API...'));
  
  try {
    const response = await axios.get(CONFIG.evolutionUrl, {
      headers: { apikey: CONFIG.apiKey },
      timeout: 5000
    });
    
    console.log(chalk.green('   ✅ Evolution API: ONLINE'));
    return true;
  } catch (error) {
    console.log(chalk.red('   ❌ Evolution API: OFFLINE'));
    console.log(chalk.gray(`   Error: ${error.message}`));
    return false;
  }
}

async function checkRailwayApp() {
  console.log(chalk.blue('\n🚂 Verificando Railway App...'));
  
  try {
    const response = await axios.get(`${CONFIG.railwayUrl}/health`, {
      timeout: 10000
    });
    
    console.log(chalk.green('   ✅ Railway App: ONLINE'));
    return true;
  } catch (error) {
    console.log(chalk.red('   ❌ Railway App: OFFLINE'));
    console.log(chalk.gray(`   Error: ${error.message}`));
    return false;
  }
}

async function checkInstance(instanceName) {
  console.log(chalk.blue(`\n📱 Verificando instância ${instanceName}...`));
  
  try {
    const response = await axios.get(
      `${CONFIG.evolutionUrl}/instance/connectionState/${instanceName}`,
      {
        headers: { apikey: CONFIG.apiKey },
        timeout: 5000
      }
    );
    
    const state = response.data?.instance?.state || 'unknown';
    
    if (state === 'open') {
      console.log(chalk.green(`   ✅ ${instanceName}: CONECTADA`));
      return true;
    } else {
      console.log(chalk.yellow(`   ⚠️ ${instanceName}: ${state.toUpperCase()}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ ${instanceName}: ERRO`));
    console.log(chalk.gray(`   Error: ${error.message}`));
    return false;
  }
}

async function testWebhook() {
  console.log(chalk.blue('\n🪝 Testando webhook...'));
  
  const testPayload = {
    event: 'order.paid',
    timestamp: new Date().toISOString(),
    data: {
      user: {
        name: 'Health Check Test',
        phone: '5511999999999'
      },
      product: {
        title: 'Teste de Saúde do Sistema'
      },
      quantity: 1,
      total: 1.00,
      id: 'HEALTH-CHECK-' + Date.now()
    }
  };
  
  try {
    const response = await axios.post(
      `${CONFIG.railwayUrl}/webhook/temp-order-paid`,
      testPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log(chalk.green('   ✅ Webhook: FUNCIONANDO'));
    return true;
  } catch (error) {
    console.log(chalk.red('   ❌ Webhook: FALHOU'));
    console.log(chalk.gray(`   Error: ${error.message}`));
    return false;
  }
}

async function generateReport(results) {
  console.log(chalk.cyan('\n📊 === RELATÓRIO DE SAÚDE ==='));
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const healthScore = ((passedChecks / totalChecks) * 100).toFixed(1);
  
  console.log(chalk.white(`📈 Score de Saúde: ${healthScore}%`));
  console.log(chalk.white(`✅ Aprovados: ${passedChecks}/${totalChecks}`));
  
  if (healthScore >= 90) {
    console.log(chalk.green('🟢 SISTEMA: EXCELENTE'));
  } else if (healthScore >= 70) {
    console.log(chalk.yellow('🟡 SISTEMA: BOM'));
  } else if (healthScore >= 50) {
    console.log(chalk.orange('🟠 SISTEMA: ATENÇÃO'));
  } else {
    console.log(chalk.red('🔴 SISTEMA: CRÍTICO'));
  }
  
  console.log(chalk.gray(`\n⏰ Verificação realizada em: ${new Date().toLocaleString('pt-BR')}`));
  
  return healthScore;
}

async function main() {
  console.log(chalk.magenta('🏥 === HEALTH CHECK - ORACLEWA IMPÉRIO ==='));
  
  const results = {
    evolutionAPI: await checkEvolutionAPI(),
    railwayApp: await checkRailwayApp(),
    webhook: await testWebhook()
  };
  
  // Verificar instâncias
  for (const instance of CONFIG.instances) {
    results[instance] = await checkInstance(instance);
  }
  
  const healthScore = await generateReport(results);
  
  // Exit code baseado na saúde
  if (healthScore >= 70) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('\n💥 Erro crítico no health check:'), error.message);
  process.exit(1);
});