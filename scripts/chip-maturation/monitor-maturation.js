#!/usr/bin/env node

/**
 * 📊 SCRIPT - MONITORAMENTO DE MATURAÇÃO
 * 
 * Dashboard em tempo real do sistema de maturação de chips
 * Exibe estatísticas, progresso e alertas
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configurações
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  stats: `${API_BASE}/api/chip-maturation/stats`,
  chips: `${API_BASE}/api/chip-maturation/chips`,
  conversations: `${API_BASE}/api/chip-maturation/conversations/stats`,
  groups: `${API_BASE}/api/chip-maturation/groups/stats`,
  productionReady: `${API_BASE}/api/chip-maturation/pools/production-ready`
};

/**
 * Cores para terminal
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Limpa o terminal
 */
function clearScreen() {
  console.clear();
}

/**
 * Formatar data para exibição
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR');
}

/**
 * Barra de progresso
 */
function progressBar(percentage, width = 20) {
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = percentage >= 90 ? colors.green : 
                percentage >= 50 ? colors.yellow : colors.red;
  
  return `${color}${bar}${colors.reset} ${percentage.toFixed(1)}%`;
}

/**
 * Fazer requisição HTTP com tratamento de erro
 */
async function safeFetch(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.status === 500 ? 'Server Error' : error.message 
    };
  }
}

/**
 * Exibe header do dashboard
 */
function showHeader() {
  const timestamp = new Date().toLocaleString('pt-BR');
  
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                🎯 ORACLE WA CHIP MATURATION                  ║');
  console.log('║                    📊 DASHBOARD TEMPO REAL                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}${colors.dim}Última atualização: ${timestamp}${colors.reset}\n`);
}

/**
 * Exibe estatísticas gerais
 */
async function showGeneralStats() {
  console.log(`${colors.bright}📊 ESTATÍSTICAS GERAIS${colors.reset}`);
  console.log('─'.repeat(50));
  
  const result = await safeFetch(API_ENDPOINTS.stats);
  
  if (!result.success) {
    console.log(`${colors.red}❌ Erro ao obter estatísticas: ${result.error}${colors.reset}\n`);
    return;
  }

  try {
    const stats = result.data.stats;
    
    // Pool Oracle
    const oracle = stats.oraclePool;
    console.log(`🏢 ${colors.cyan}Pool OracleWA:${colors.reset}`);
    console.log(`   Total: ${colors.white}${oracle.total}${colors.reset} | Ativos: ${colors.green}${oracle.active}${colors.reset} | Maturando: ${colors.yellow}${oracle.maturing}${colors.reset} | Prontos: ${colors.bright}${oracle.ready}${colors.reset}`);
    
    // Distribuição por fase
    if (oracle.distribution) {
      const dist = oracle.distribution;
      console.log(`   Fases: 👶${dist.baby} 🧒${dist.child} 👦${dist.teen} 👨${dist.adult} 🧙${dist.mature}`);
    }
    
    // Pools de clientes
    if (stats.clientPools && Object.keys(stats.clientPools).length > 0) {
      console.log(`\n👥 ${colors.cyan}Pools de Clientes:${colors.reset}`);
      Object.entries(stats.clientPools).forEach(([clientId, pool]) => {
        console.log(`   ${clientId}: ${colors.white}${pool.total}${colors.reset} chips (${colors.green}${pool.active}${colors.reset} ativos, ${colors.bright}${pool.ready || 0}${colors.reset} prontos)`);
      });
    }
    
    console.log('');
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao processar estatísticas: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Exibe atividade de conversas
 */
async function showConversationActivity() {
  console.log(`${colors.bright}💬 ATIVIDADE DE CONVERSAS${colors.reset}`);
  console.log('─'.repeat(50));
  
  const result = await safeFetch(API_ENDPOINTS.conversations);
  
  if (!result.success) {
    console.log(`${colors.red}❌ Erro ao obter conversas: ${result.error}${colors.reset}\n`);
    return;
  }

  try {
    const stats = result.data.conversations;
    
    console.log(`Total hoje: ${colors.white}${stats.totalConversations}${colors.reset} conversas`);
    console.log(`Mensagens: ${colors.white}${stats.totalMessages}${colors.reset} enviadas`);
    console.log(`Ativas agora: ${colors.green}${stats.activeConversations}${colors.reset} | Agendadas: ${colors.yellow}${stats.scheduledConversations}${colors.reset}`);
    
    if (stats.conversationsByType && Object.keys(stats.conversationsByType).length > 0) {
      console.log(`\nTipos mais utilizados:`);
      Object.entries(stats.conversationsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${colors.white}${count}${colors.reset}`);
        });
    }
    
    console.log('');
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao processar conversas: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Exibe atividade de grupos
 */
async function showGroupActivity() {
  console.log(`${colors.bright}👥 ATIVIDADE DE GRUPOS${colors.reset}`);
  console.log('─'.repeat(50));
  
  const result = await safeFetch(API_ENDPOINTS.groups);
  
  if (!result.success) {
    console.log(`${colors.red}❌ Erro ao obter grupos: ${result.error}${colors.reset}\n`);
    return;
  }

  try {
    const stats = result.data.groups;
    
    console.log(`Grupos disponíveis: ${colors.white}${stats.activeGroups}${colors.reset}/${stats.totalGroups}`);
    console.log(`Chips em grupos: ${colors.white}${stats.chipsInGroups}${colors.reset}`);
    console.log(`Total memberships: ${colors.white}${stats.totalMemberships}${colors.reset}`);
    console.log(`Entradas agendadas: ${colors.yellow}${stats.scheduledJoins}${colors.reset} | Interações pendentes: ${colors.yellow}${stats.pendingInteractions}${colors.reset}`);
    
    if (stats.groupDistribution && Object.keys(stats.groupDistribution).length > 0) {
      console.log(`\nCategorias:`);
      Object.entries(stats.groupDistribution).forEach(([category, count]) => {
        console.log(`   ${category}: ${colors.white}${count}${colors.reset} grupos`);
      });
    }
    
    console.log('');
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao processar grupos: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Exibe chips prontos para produção
 */
async function showProductionReady() {
  console.log(`${colors.bright}🚀 CHIPS PRONTOS PARA PRODUÇÃO${colors.reset}`);
  console.log('─'.repeat(50));
  
  const result = await safeFetch(API_ENDPOINTS.productionReady);
  
  if (!result.success) {
    console.log(`${colors.red}❌ Erro ao obter chips prontos: ${result.error}${colors.reset}\n`);
    return;
  }

  try {
    const chips = result.data.chips;
    
    if (chips.length === 0) {
      console.log(`${colors.dim}Nenhum chip pronto para produção no momento${colors.reset}\n`);
      return;
    }
    
    console.log(`${colors.green}${chips.length} chip${chips.length !== 1 ? 's' : ''} pronto${chips.length !== 1 ? 's' : ''} para produção:${colors.reset}\n`);
    
    chips.slice(0, 5).forEach(chip => {
      const progress = chip.metrics?.maturationProgress || 100;
      console.log(`📱 ${colors.white}${chip.instanceName}${colors.reset}`);
      console.log(`   👤 Owner: ${chip.owner} | 🎯 Estratégia: ${chip.strategy}`);
      console.log(`   ${progressBar(progress)}`);
      console.log('');
    });
    
    if (chips.length > 5) {
      console.log(`${colors.dim}... e mais ${chips.length - 5} chip${chips.length - 5 !== 1 ? 's' : ''}${colors.reset}\n`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao processar chips prontos: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Exibe chips em maturação
 */
async function showMaturationProgress() {
  console.log(`${colors.bright}🌱 PROGRESSO DE MATURAÇÃO${colors.reset}`);
  console.log('─'.repeat(50));
  
  const result = await safeFetch(`${API_ENDPOINTS.chips}?status=active`);
  
  if (!result.success) {
    console.log(`${colors.red}❌ Erro ao obter progresso: ${result.error}${colors.reset}\n`);
    return;
  }

  try {
    const chips = result.data.chips || [];
    
    if (chips.length === 0) {
      console.log(`${colors.dim}Nenhum chip em processo de maturação${colors.reset}\n`);
      return;
    }
    
    // Agrupar por owner
    const byOwner = chips.reduce((acc, chip) => {
      if (!acc[chip.owner]) acc[chip.owner] = [];
      acc[chip.owner].push(chip);
      return acc;
    }, {});
    
    Object.entries(byOwner).forEach(([owner, ownerChips]) => {
      console.log(`\n${colors.cyan}${owner.toUpperCase()}:${colors.reset}`);
      
      ownerChips.slice(0, 3).forEach(chip => {
        const progress = chip.progress || 0;
        console.log(`  📱 ${chip.instanceName}`);
        console.log(`     ${chip.phase || 'BABY'} | Dia ${chip.currentDay || 0} | ${progressBar(progress, 15)}`);
      });
      
      if (ownerChips.length > 3) {
        console.log(`  ${colors.dim}... e mais ${ownerChips.length - 3} chips${colors.reset}`);
      }
    });
    
    console.log('');
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao processar progresso: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Exibe footer com controles
 */
function showFooter() {
  console.log('─'.repeat(70));
  console.log(`${colors.dim}Pressione Ctrl+C para sair | Atualizando a cada 30 segundos${colors.reset}`);
}

/**
 * Atualiza o dashboard
 */
async function updateDashboard() {
  clearScreen();
  showHeader();
  
  // Executar todas as seções do dashboard
  await showGeneralStats();
  await showConversationActivity();
  await showGroupActivity();
  await showProductionReady();
  await showMaturationProgress();
  
  showFooter();
}

/**
 * Modo dashboard em tempo real
 */
async function runDashboard() {
  console.log('🚀 Iniciando dashboard em tempo real...\n');
  
  // Primeira atualização imediata
  await updateDashboard();
  
  // Atualizações periódicas
  const interval = setInterval(updateDashboard, 30000); // 30 segundos
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n👋 Dashboard finalizado. Até logo!');
    process.exit(0);
  });
  
  // Manter rodando
  process.stdin.resume();
}

/**
 * Modo snapshot único
 */
async function runSnapshot() {
  console.log('📸 Gerando snapshot do sistema...\n');
  await updateDashboard();
  console.log('\n✅ Snapshot gerado com sucesso!');
}

/**
 * Função principal
 */
async function main() {
  try {
    // Verificar conectividade
    const healthCheck = await safeFetch(`${API_BASE}/api/chip-maturation/stats`);
    if (!healthCheck.success) {
      console.error(`${colors.red}❌ Erro: Não foi possível conectar à API${colors.reset}`);
      console.error(`${colors.yellow}💡 Verifique se o servidor OracleWA está rodando em ${API_BASE}${colors.reset}`);
      process.exit(1);
    }
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
📊 OracleWA Chip Maturation Monitor

Uso:
  node monitor-maturation.js [opções]

Opções:
  --help, -h        Mostrar esta ajuda
  --snapshot        Gerar snapshot único (não contínuo)

Exemplos:
  node monitor-maturation.js                    # Dashboard contínuo
  node monitor-maturation.js --snapshot         # Snapshot único
`);
      return;
    }
    
    if (args.includes('--snapshot')) {
      await runSnapshot();
    } else {
      await runDashboard();
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro inesperado: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Execução
main();