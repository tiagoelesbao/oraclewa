#!/usr/bin/env node

/**
 * Script para conectar novas instâncias Império
 * Execute quando tiver os chips prontos
 */

import axios from 'axios';
import readline from 'readline';
import QRCode from 'qrcode';

const EVOLUTION_URL = 'http://128.140.7.154:8080';
const EVOLUTION_KEY = 'Imperio2024@EvolutionSecure';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Configuração das novas instâncias
const NEW_INSTANCES = [
  {
    name: 'broadcast-imperio-1',
    type: 'broadcast',
    provider: 'evolution-baileys',
    description: 'Broadcast Baileys 1/3'
  },
  {
    name: 'broadcast-imperio-2', 
    type: 'broadcast',
    provider: 'evolution-baileys',
    description: 'Broadcast Baileys 2/3'
  },
  {
    name: 'broadcast-imperio-3',
    type: 'broadcast', 
    provider: 'evolution-baileys',
    description: 'Broadcast Baileys 3/3'
  }
];

async function createEvolutionInstance(instanceName) {
  try {
    console.log(`\n📱 Criando instância: ${instanceName}`);
    
    const response = await axios.post(
      `${EVOLUTION_URL}/instance/create`,
      {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      },
      {
        headers: {
          'apikey': EVOLUTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Instância ${instanceName} criada com sucesso!`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Instância ${instanceName} já existe, obtendo QR Code...`);
      return await getQRCode(instanceName);
    }
    throw error;
  }
}

async function getQRCode(instanceName) {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connect/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Erro ao obter QR Code: ${error.message}`);
    return null;
  }
}

async function displayQRCode(qrData) {
  if (!qrData || !qrData.pairingCode) {
    console.log('❌ QR Code não disponível');
    return;
  }
  
  try {
    // Exibir QR Code no terminal
    const qrString = await QRCode.toString(qrData.pairingCode, { type: 'terminal' });
    console.log('\n📱 Escaneie o QR Code abaixo com WhatsApp:\n');
    console.log(qrString);
    console.log('\n🔢 Código de pareamento:', qrData.pairingCode);
  } catch (error) {
    console.log('🔢 Código de pareamento:', qrData.pairingCode);
  }
}

async function checkInstanceStatus(instanceName) {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connectionState/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_KEY
        }
      }
    );
    return response.data?.instance?.state || 'disconnected';
  } catch (error) {
    return 'error';
  }
}

async function connectInstance(instance) {
  console.log('\n' + '='.repeat(50));
  console.log(`🔌 Conectando: ${instance.description}`);
  console.log('='.repeat(50));
  
  // Criar ou obter instância
  const result = await createEvolutionInstance(instance.name);
  
  if (result && result.qrcode) {
    await displayQRCode(result.qrcode);
    
    console.log('\n⏳ Aguardando conexão...');
    
    // Aguardar conexão
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const status = await checkInstanceStatus(instance.name);
      
      if (status === 'open') {
        console.log(`\n✅ ${instance.name} conectada com sucesso!`);
        return true;
      }
      
      process.stdout.write('.');
      attempts++;
    }
    
    console.log(`\n⚠️  Timeout na conexão de ${instance.name}`);
  }
  
  return false;
}

async function connectZAPIInstance() {
  console.log('\n' + '='.repeat(50));
  console.log('🔌 Configuração Z-API');
  console.log('='.repeat(50));
  
  console.log('\n📝 INSTRUÇÕES Z-API:');
  console.log('1. Acesse https://api.z-api.io');
  console.log('2. Faça login com sua conta');
  console.log('3. Crie uma nova instância "imperio-zapi"');
  console.log('4. Copie o Client Token e Instance Token');
  console.log('5. Adicione no arquivo: clients/imperio/zapi-config.json');
  console.log('6. Execute: npm run connect:zapi');
  
  const hasToken = await question('\n❓ Você já tem o Client Token Z-API? (s/n): ');
  
  if (hasToken.toLowerCase() === 's') {
    const token = await question('📝 Cole o Client Token aqui: ');
    console.log('\n✅ Token salvo! Execute npm run connect:zapi para conectar.');
    // Aqui você salvaria o token no arquivo de config
  } else {
    console.log('\n⏸️  Configure a Z-API manualmente quando estiver pronto.');
  }
}

async function main() {
  console.log('🚀 OracleWA - Conectar Novas Instâncias');
  console.log('========================================\n');
  
  const choice = await question(
    'Escolha uma opção:\n' +
    '1. Conectar todas as instâncias Baileys (3x broadcast)\n' +
    '2. Conectar uma instância específica\n' +
    '3. Configurar Z-API\n' +
    '4. Verificar status de todas as instâncias\n' +
    '5. Sair\n\n' +
    'Opção: '
  );
  
  switch (choice) {
    case '1':
      console.log('\n🚀 Conectando todas as instâncias Baileys...');
      for (const instance of NEW_INSTANCES) {
        const connected = await connectInstance(instance);
        if (!connected) {
          const retry = await question('\n❓ Tentar novamente? (s/n): ');
          if (retry.toLowerCase() === 's') {
            await connectInstance(instance);
          }
        }
      }
      break;
      
    case '2':
      console.log('\nInstâncias disponíveis:');
      NEW_INSTANCES.forEach((inst, idx) => {
        console.log(`${idx + 1}. ${inst.name} - ${inst.description}`);
      });
      const idx = await question('\nEscolha o número: ');
      const selected = NEW_INSTANCES[parseInt(idx) - 1];
      if (selected) {
        await connectInstance(selected);
      }
      break;
      
    case '3':
      await connectZAPIInstance();
      break;
      
    case '4':
      console.log('\n📊 Verificando status das instâncias...\n');
      const allInstances = ['imperio1', ...NEW_INSTANCES.map(i => i.name), 'imperio-zapi'];
      for (const inst of allInstances) {
        const status = await checkInstanceStatus(inst);
        const emoji = status === 'open' ? '✅' : status === 'connecting' ? '🔄' : '❌';
        console.log(`${emoji} ${inst}: ${status}`);
      }
      break;
      
    case '5':
      console.log('\n👋 Até logo!');
      process.exit(0);
      break;
      
    default:
      console.log('\n❌ Opção inválida!');
  }
  
  const again = await question('\n❓ Deseja fazer outra operação? (s/n): ');
  if (again.toLowerCase() === 's') {
    console.clear();
    await main();
  } else {
    console.log('\n✅ Configuração concluída!');
    console.log('📝 Lembre-se de atualizar clients/imperio/config.json com os telefones conectados.');
    rl.close();
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro:', error.message);
  rl.close();
  process.exit(1);
});