#!/usr/bin/env node

/**
 * Verificação Profunda do Estado do Hetzner e Evolution API
 * Analisa todas as instâncias e configurações atuais
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';

// Função para testar conectividade básica
async function testHetznerConnectivity() {
  console.log('🔍 === TESTANDO CONECTIVIDADE HETZNER ===\n');
  
  const startTime = performance.now();
  
  try {
    const response = await axios.get(`${evolutionUrl}/`, {
      timeout: 10000,
      headers: {
        'apikey': evolutionApiKey
      }
    });
    
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    console.log(`✅ Hetzner Server: ONLINE`);
    console.log(`📡 IP: 128.140.7.154:8080`);
    console.log(`⚡ Latency: ${latency}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`🔧 Evolution API: RESPONDING`);
    
    return true;
  } catch (error) {
    console.log(`❌ Hetzner Server: OFFLINE or ERROR`);
    console.log(`📡 IP: 128.140.7.154:8080`);
    console.log(`❌ Error: ${error.message}`);
    console.log(`🔧 Evolution API: NOT RESPONDING`);
    
    return false;
  }
}

// Função para listar todas as instâncias
async function getAllInstances() {
  try {
    console.log('\n📱 === LISTANDO TODAS AS INSTÂNCIAS ===\n');
    
    const response = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    const instances = response.data || [];
    console.log(`📊 Total de instâncias encontradas: ${instances.length}\n`);
    
    const categorizedInstances = {
      connected: [],
      disconnected: [],
      webhook: [],
      broadcast: [],
      other: []
    };
    
    for (const instance of instances) {
      const isConnected = instance.connectionStatus === 'open';
      const isWebhook = instance.name?.includes('webhook');
      const isBroadcast = instance.name?.includes('broadcast');
      const isImperio = instance.name?.includes('imperio');
      
      // Categorizar
      if (isConnected) categorizedInstances.connected.push(instance);
      else categorizedInstances.disconnected.push(instance);
      
      if (isWebhook) categorizedInstances.webhook.push(instance);
      else if (isBroadcast) categorizedInstances.broadcast.push(instance);
      else categorizedInstances.other.push(instance);
      
      // Log detalhado
      const emoji = isConnected ? '✅' : '❌';
      const type = isWebhook ? 'WEBHOOK' : isBroadcast ? 'BROADCAST' : 'OTHER';
      const phone = instance.ownerJid ? instance.ownerJid.replace('@s.whatsapp.net', '') : 'N/A';
      const profileName = instance.profileName || 'N/A';
      const messageCount = instance._count?.Message || 0;
      
      console.log(`${emoji} ${instance.name}`);
      console.log(`   📞 Telefone: ${phone}`);
      console.log(`   👤 Perfil: ${profileName}`);
      console.log(`   🏷️ Tipo: ${type}`);
      console.log(`   🔗 Status: ${instance.connectionStatus}`);
      console.log(`   📨 Mensagens: ${messageCount}`);
      console.log(`   📅 Criado: ${new Date(instance.createdAt).toLocaleString()}`);
      console.log(`   🔄 Atualizado: ${new Date(instance.updatedAt).toLocaleString()}`);
      
      if (!isConnected && instance.disconnectionAt) {
        console.log(`   ⏰ Desconectado em: ${new Date(instance.disconnectionAt).toLocaleString()}`);
      }
      
      console.log('');
    }
    
    return { instances, categorized: categorizedInstances };
  } catch (error) {
    console.log(`❌ Erro ao buscar instâncias: ${error.message}`);
    return { instances: [], categorized: {} };
  }
}

// Função para verificar instâncias específicas do webhook pool
async function checkWebhookPoolInstances() {
  console.log('\n🏊 === VERIFICANDO POOL DE WEBHOOKS ===\n');
  
  const webhookInstances = [
    'imperio-webhook-1',
    'imperio-webhook-2', 
    'imperio-webhook-3'
    // imperio-webhook-4 será desativada conforme solicitado
  ];
  
  const results = [];
  
  for (const instanceName of webhookInstances) {
    try {
      const response = await axios.get(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const state = response.data?.instance?.state || 'unknown';
      const isConnected = state === 'open';
      
      console.log(`${isConnected ? '✅' : '📱'} ${instanceName}`);
      console.log(`   🔗 Estado: ${state}`);
      console.log(`   📊 Status: ${isConnected ? 'CONECTADO' : 'DESCONECTADO - PRECISA QR CODE'}`);
      
      if (!isConnected) {
        // Tentar obter QR Code
        try {
          const qrResponse = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, {
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (qrResponse.data?.base64) {
            console.log(`   📱 QR Code: DISPONÍVEL`);
            console.log(`   🔗 URL: ${evolutionUrl}/instance/connect/${instanceName}`);
          } else {
            console.log(`   📱 QR Code: NÃO DISPONÍVEL`);
          }
        } catch (qrError) {
          console.log(`   📱 QR Code: ERRO - ${qrError.message}`);
        }
      }
      
      results.push({
        name: instanceName,
        exists: true,
        connected: isConnected,
        state,
        needsQR: !isConnected
      });
      
    } catch (error) {
      console.log(`❌ ${instanceName}`);
      console.log(`   🔗 Estado: NÃO EXISTE`);
      console.log(`   📊 Status: PRECISA SER CRIADO`);
      
      results.push({
        name: instanceName,
        exists: false,
        connected: false,
        state: 'not-found',
        needsCreation: true
      });
    }
    
    console.log('');
  }
  
  return results;
}

// Função para testar criação de instância (se necessário)
async function createMissingInstances(missingInstances) {
  if (missingInstances.length === 0) {
    console.log('✅ Todas as instâncias necessárias já existem!\n');
    return;
  }
  
  console.log('\n🔧 === CRIANDO INSTÂNCIAS FALTANTES ===\n');
  
  for (const instanceName of missingInstances) {
    try {
      console.log(`🔧 Criando ${instanceName}...`);
      
      const payload = {
        instanceName: instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true
      };
      
      const response = await axios.post(`${evolutionUrl}/instance/create`, payload, {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data) {
        console.log(`✅ ${instanceName} criado com sucesso!`);
        
        // Aguardar um pouco antes de tentar obter QR code
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const qrResponse = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, {
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (qrResponse.data?.base64) {
            console.log(`   📱 QR Code gerado e disponível no frontend`);
          }
        } catch (qrError) {
          console.log(`   ⚠️ QR Code será gerado quando necessário`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro ao criar ${instanceName}: ${error.message}`);
    }
    
    console.log('');
  }
}

// Função para verificar configuração do sistema
async function checkSystemConfig() {
  console.log('\n⚙️ === CONFIGURAÇÃO DO SISTEMA ===\n');
  
  console.log(`🔧 Evolution API URL: ${evolutionUrl}`);
  console.log(`🔑 API Key: ${evolutionApiKey.substring(0, 10)}...`);
  console.log(`📍 Localização: Hetzner Germany`);
  console.log(`🌐 Frontend URL: https://oraclewa-imperio-production.up.railway.app`);
  console.log(`🔗 Webhook URL: /webhook/imperio/order_paid`);
  console.log(`🏊 Pool configurado para: 3 instâncias (1, 2, 3)`);
  console.log(`❌ Instância 4: DESATIVADA conforme solicitado`);
}

async function main() {
  console.log('🔍 === DIAGNÓSTICO COMPLETO HETZNER + EVOLUTION API ===\n');
  
  // 1. Testar conectividade básica
  const isOnline = await testHetznerConnectivity();
  
  if (!isOnline) {
    console.log('\n❌ CRÍTICO: Servidor Hetzner não está respondendo!');
    console.log('   Verifique se o servidor está online e as credenciais corretas.');
    process.exit(1);
  }
  
  // 2. Listar todas as instâncias
  const { instances, categorized } = await getAllInstances();
  
  // 3. Verificar pool específico
  const poolResults = await checkWebhookPoolInstances();
  
  // 4. Identificar instâncias que precisam ser criadas
  const missingInstances = poolResults
    .filter(result => !result.exists)
    .map(result => result.name);
  
  // 5. Criar instâncias faltantes
  await createMissingInstances(missingInstances);
  
  // 6. Mostrar configuração
  checkSystemConfig();
  
  // 7. Resumo final
  console.log('\n📊 === RESUMO FINAL ===\n');
  
  const connectedCount = poolResults.filter(r => r.connected).length;
  const needsQRCount = poolResults.filter(r => r.exists && !r.connected).length;
  const createdCount = missingInstances.length;
  
  console.log(`✅ Instâncias conectadas: ${connectedCount}/3`);
  console.log(`📱 Precisam de QR Code: ${needsQRCount}`);
  console.log(`🔧 Criadas nesta execução: ${createdCount}`);
  console.log(`❌ Instância 4: Desativada (não será usada)`);
  
  console.log('\n🎯 === PRÓXIMOS PASSOS ===\n');
  console.log('1. Acesse o frontend: http://localhost:3001/instances');
  console.log('2. Para cada instância DESCONECTADA:');
  console.log('   - Clique em "Conectar"');
  console.log('   - Escaneie o QR Code com um número diferente');
  console.log('   - Aguarde a conexão (status fica verde)');
  console.log('3. O pool usará automaticamente apenas instâncias conectadas');
  console.log('4. Monitor: /api/webhooks/pools para ver status em tempo real');
  
  console.log('\n✅ Diagnóstico completo finalizado!\n');
}

// Executar diagnóstico
main().catch(error => {
  console.error('❌ Erro no diagnóstico:', error);
  process.exit(1);
});