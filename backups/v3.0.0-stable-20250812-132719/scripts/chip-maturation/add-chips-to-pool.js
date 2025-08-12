#!/usr/bin/env node

/**
 * 🎯 SCRIPT - ADICIONAR CHIPS AO POOL DE MATURAÇÃO
 * 
 * Adiciona novos chips aos pools de maturação (Oracle ou cliente específico)
 * Configura estratégias e inicia processo automático
 */

import axios from 'axios';
import readline from 'readline';

// Configurações
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  addChip: `${API_BASE}/api/chip-maturation/chips`,
  stats: `${API_BASE}/api/chip-maturation/stats`,
  strategies: `${API_BASE}/api/chip-maturation/strategies`
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Exibe banner do script
 */
function showBanner() {
  console.log('\n🎯 ===============================================');
  console.log('📱 ORACLE WA - CHIP MATURATION MANAGER');
  console.log('🔄 Adicionar Chips ao Pool de Maturação');
  console.log('===============================================\n');
}

/**
 * Lista estratégias disponíveis
 */
async function listStrategies() {
  try {
    const response = await axios.get(API_ENDPOINTS.strategies);
    const strategies = response.data.strategies;
    
    console.log('📋 Estratégias de Maturação Disponíveis:\n');
    strategies.forEach((strategy, index) => {
      console.log(`  ${index + 1}. ${strategy.name}`);
      console.log(`     📝 ${strategy.description}`);
      console.log(`     ⏱️  ${strategy.duration} dias\n`);
    });
    
    return strategies;
  } catch (error) {
    console.error('❌ Erro ao listar estratégias:', error.message);
    return [];
  }
}

/**
 * Obtém estatísticas atuais
 */
async function showCurrentStats() {
  try {
    const response = await axios.get(API_ENDPOINTS.stats);
    const stats = response.data.stats;
    
    console.log('📊 Estatísticas Atuais:\n');
    console.log(`🏢 Pool Oracle:`);
    console.log(`   Total: ${stats.oraclePool.stats.total}`);
    console.log(`   Ativos: ${stats.oraclePool.stats.active}`);
    console.log(`   Em Maturação: ${stats.oraclePool.stats.maturing}`);
    console.log(`   Prontos: ${stats.oraclePool.stats.ready}\n`);
    
    if (Object.keys(stats.clientPools).length > 0) {
      console.log(`👥 Pools de Clientes:`);
      Object.entries(stats.clientPools).forEach(([clientId, pool]) => {
        console.log(`   ${clientId}: ${pool.total} chips (${pool.active} ativos)`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
  }
}

/**
 * Coleta dados do chip
 */
async function collectChipData() {
  console.log('📱 Dados do Novo Chip:\n');
  
  const instanceName = await question('🔸 Nome da instância: ');
  const phoneNumber = await question('📞 Número do telefone (opcional): ');
  
  console.log('\n🎯 Proprietário:');
  console.log('1. OracleWA (Pool de Contingência)');
  console.log('2. Cliente Específico');
  
  const ownerChoice = await question('Escolha (1-2): ');
  let owner = 'oraclewa';
  
  if (ownerChoice === '2') {
    owner = await question('🏢 ID do Cliente: ');
  }
  
  console.log('\n⚡ Prioridade:');
  console.log('1. Normal');
  console.log('2. Alta');
  console.log('3. Crítica');
  
  const priorityChoice = await question('Escolha (1-3): ');
  const priorityMap = { '1': 'normal', '2': 'high', '3': 'critical' };
  const priority = priorityMap[priorityChoice] || 'normal';
  
  return {
    instanceName: instanceName.trim(),
    phoneNumber: phoneNumber.trim() || undefined,
    owner,
    priority
  };
}

/**
 * Seleciona estratégia
 */
async function selectStrategy(strategies) {
  console.log('\n🎯 Selecione a Estratégia de Maturação:');
  
  strategies.forEach((strategy, index) => {
    console.log(`${index + 1}. ${strategy.name} (${strategy.duration} dias)`);
  });
  
  const choice = await question('\nEscolha (1-' + strategies.length + '): ');
  const index = parseInt(choice) - 1;
  
  if (index >= 0 && index < strategies.length) {
    return strategies[index].key;
  }
  
  return 'gradual_conti_chips'; // default
}

/**
 * Adiciona chip ao pool
 */
async function addChipToPool(chipData) {
  try {
    console.log('\n🔄 Adicionando chip ao pool...');
    
    const response = await axios.post(API_ENDPOINTS.addChip, chipData);
    
    if (response.data.success) {
      const chip = response.data.chip;
      
      console.log('\n✅ Chip adicionado com sucesso!');
      console.log(`📱 ID: ${chip.id}`);
      console.log(`🔸 Nome: ${chip.instanceName}`);
      console.log(`🏢 Owner: ${chip.owner}`);
      console.log(`🎯 Estratégia: ${chip.strategy}`);
      console.log(`📅 Início: ${new Date(chip.startDate).toLocaleString()}`);
      console.log(`🎯 Previsão Conclusão: ${new Date(chip.targetDate).toLocaleString()}`);
      
      return chip;
    } else {
      console.error('❌ Falha ao adicionar chip:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na API:', error.response?.data?.error || error.message);
    return null;
  }
}

/**
 * Menu de adição em lote
 */
async function batchAddChips() {
  const quantity = await question('📊 Quantos chips adicionar? ');
  const count = parseInt(quantity);
  
  if (isNaN(count) || count <= 0) {
    console.log('❌ Quantidade inválida');
    return;
  }
  
  console.log('\n🔧 Configuração para todos os chips:');
  const strategies = await listStrategies();
  const strategy = await selectStrategy(strategies);
  
  console.log('\n🏢 Proprietário:');
  console.log('1. OracleWA (Pool de Contingência)');
  console.log('2. Cliente Específico');
  
  const ownerChoice = await question('Escolha (1-2): ');
  let owner = 'oraclewa';
  
  if (ownerChoice === '2') {
    owner = await question('🏢 ID do Cliente: ');
  }
  
  console.log('\n🔄 Adicionando chips em lote...\n');
  
  const results = [];
  for (let i = 1; i <= count; i++) {
    const chipData = {
      instanceName: `${owner}-maturation-${Date.now()}-${i}`,
      phoneNumber: undefined,
      owner,
      strategy,
      priority: 'normal'
    };
    
    console.log(`📱 Adicionando chip ${i}/${count}: ${chipData.instanceName}`);
    const result = await addChipToPool(chipData);
    
    if (result) {
      results.push(result);
      console.log(`   ✅ Sucesso`);
    } else {
      console.log(`   ❌ Falha`);
    }
    
    // Delay pequeno entre adições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 Processo concluído: ${results.length}/${count} chips adicionados com sucesso`);
  return results;
}

/**
 * Menu principal
 */
async function mainMenu() {
  while (true) {
    console.log('\n🎯 Menu Principal:');
    console.log('1. 📊 Ver Estatísticas');
    console.log('2. 📱 Adicionar Chip Individual');
    console.log('3. 📦 Adicionar Chips em Lote');
    console.log('4. 📋 Listar Estratégias');
    console.log('5. 🚪 Sair');
    
    const choice = await question('\nEscolha uma opção (1-5): ');
    
    switch (choice) {
      case '1':
        await showCurrentStats();
        break;
        
      case '2':
        const strategies = await listStrategies();
        if (strategies.length === 0) break;
        
        const chipData = await collectChipData();
        chipData.strategy = await selectStrategy(strategies);
        
        await addChipToPool(chipData);
        break;
        
      case '3':
        await batchAddChips();
        break;
        
      case '4':
        await listStrategies();
        break;
        
      case '5':
        console.log('\n👋 Até logo!');
        rl.close();
        process.exit(0);
        
      default:
        console.log('❌ Opção inválida');
    }
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    showBanner();
    
    // Verificar se API está acessível
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ Conectado à API OracleWA\n');
    } catch (error) {
      console.error('❌ Não foi possível conectar à API:', API_BASE);
      console.error('💡 Verifique se o servidor está rodando');
      process.exit(1);
    }
    
    await mainMenu();
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    process.exit(1);
  }
}

// Tratar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🎯 OracleWA Chip Maturation Manager

Uso:
  node add-chips-to-pool.js [opções]

Opções:
  --help, -h        Mostrar esta ajuda
  --batch <count>   Adicionar múltiplos chips
  --owner <owner>   Especificar proprietário (oraclewa|clientId)
  --strategy <name> Especificar estratégia

Exemplos:
  node add-chips-to-pool.js
  node add-chips-to-pool.js --batch 10 --owner oraclewa
`);
  process.exit(0);
}

// Execução com argumentos
if (args.includes('--batch')) {
  const batchIndex = args.indexOf('--batch');
  const count = parseInt(args[batchIndex + 1]);
  
  if (isNaN(count) || count <= 0) {
    console.error('❌ Quantidade inválida para --batch');
    process.exit(1);
  }
  
  // TODO: Implementar modo batch não-interativo
  console.log(`🔄 Modo batch: ${count} chips`);
}

// Executar
main();