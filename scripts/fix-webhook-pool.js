#!/usr/bin/env node

/**
 * Script para corrigir e configurar o pool de webhooks do Império
 * Cria as 4 instâncias necessárias se não existirem
 */

import axios from 'axios';
import logger from '../apps/api/src/utils/logger.js';

const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';

const webhookInstances = [
  'imperio-webhook-1',
  'imperio-webhook-2', 
  'imperio-webhook-3'
];

async function checkInstanceExists(instanceName) {
  try {
    const response = await axios.get(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return {
      exists: true,
      connected: response.data?.instance?.state === 'open',
      state: response.data?.instance?.state || 'unknown',
      data: response.data
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { exists: false, connected: false, state: 'not-found' };
    }
    return { exists: false, connected: false, state: 'error', error: error.message };
  }
}

async function createInstance(instanceName) {
  try {
    logger.info(`🔧 Creating instance: ${instanceName}`);
    
    const payload = {
      instanceName: instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhookUrl: `https://oraclewa-imperio-production.up.railway.app/webhook/imperio/order_paid`,
      webhookByEvents: true,
      eventsToReceive: ['messages.upsert', 'connection.update']
    };
    
    const response = await axios.post(`${evolutionUrl}/instance/create`, payload, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.data) {
      logger.info(`✅ Instance ${instanceName} created successfully`);
      return { success: true, data: response.data };
    } else {
      throw new Error('Failed to create instance');
    }
  } catch (error) {
    logger.error(`❌ Error creating instance ${instanceName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function getQRCode(instanceName) {
  try {
    const response = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return {
      success: true,
      qrcode: response.data?.base64,
      pairingCode: response.data?.pairingCode
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🏊 === WEBHOOK POOL SETUP FOR IMPÉRIO ===\n');
  
  // 1. Verificar todas as instâncias
  console.log('📋 Checking existing instances...\n');
  
  const instancesStatus = [];
  
  for (const instanceName of webhookInstances) {
    const status = await checkInstanceExists(instanceName);
    instancesStatus.push({ name: instanceName, ...status });
    
    const emoji = status.exists ? (status.connected ? '✅' : '⚠️') : '❌';
    const stateText = status.connected ? 'CONNECTED' : status.exists ? `DISCONNECTED (${status.state})` : 'NOT EXISTS';
    
    console.log(`${emoji} ${instanceName}: ${stateText}`);
  }
  
  // 2. Criar instâncias que não existem
  console.log('\n🔧 Creating missing instances...\n');
  
  const createdInstances = [];
  
  for (const instance of instancesStatus) {
    if (!instance.exists) {
      const result = await createInstance(instance.name);
      if (result.success) {
        createdInstances.push(instance.name);
        console.log(`✅ Created: ${instance.name}`);
      } else {
        console.log(`❌ Failed to create: ${instance.name} - ${result.error}`);
      }
    } else if (!instance.connected) {
      console.log(`⚠️ Instance ${instance.name} exists but is disconnected`);
    }
  }
  
  // 3. Gerar QR Codes para instâncias desconectadas
  if (createdInstances.length > 0) {
    console.log('\n📱 Getting QR codes for new instances...\n');
    
    // Aguardar um pouco para as instâncias serem inicializadas
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    for (const instanceName of createdInstances) {
      const qrResult = await getQRCode(instanceName);
      
      if (qrResult.success && qrResult.qrcode) {
        console.log(`\n📱 QR CODE for ${instanceName}:`);
        console.log(`🔗 Connect at: ${evolutionUrl}/instance/connect/${instanceName}`);
        console.log('📲 Use your phone to scan the QR code');
      } else {
        console.log(`❌ Could not get QR code for ${instanceName}: ${qrResult.error}`);
      }
    }
  }
  
  // 4. Status final
  console.log('\n📊 === FINAL STATUS ===\n');
  
  for (const instanceName of webhookInstances) {
    const finalStatus = await checkInstanceExists(instanceName);
    const emoji = finalStatus.exists ? (finalStatus.connected ? '✅' : '📱') : '❌';
    const action = finalStatus.connected ? 'READY' : finalStatus.exists ? 'CONNECT VIA QR' : 'CREATION FAILED';
    
    console.log(`${emoji} ${instanceName}: ${action}`);
  }
  
  console.log('\n🎯 === NEXT STEPS ===\n');
  console.log('1. Connect each instance by scanning QR codes');
  console.log('2. Once connected, the pool will automatically distribute webhooks');
  console.log('3. Monitor health at: /api/webhooks/pools');
  console.log('4. Dashboard: http://localhost:3001/webhooks');
  
  console.log('\n✅ Webhook pool setup completed!\n');
}

// Executar script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});