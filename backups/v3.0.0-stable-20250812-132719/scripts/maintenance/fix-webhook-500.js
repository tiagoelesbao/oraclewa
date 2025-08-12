// DIAGNÓSTICO RÁPIDO - Webhook Error 500
// Execute após reiniciar Railway

import axios from 'axios';

const RAILWAY_URL = 'https://oraclewa-imperio-production.up.railway.app';

async function testWebhookEndpoint() {
    console.log('🧪 TESTANDO ENDPOINT DE WEBHOOK...');
    
    const testPayload = {
        timestamp: new Date().toISOString(),
        event: "order.paid",
        userId: "test-user-123",
        userName: "Teste Sistema",
        phone: "(11) 99999-9999",
        total: 10.50,
        status: "processing"
    };
    
    try {
        const response = await axios.post(`${RAILWAY_URL}/temp-order-paid`, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'axios/1.6.8'
            },
            timeout: 30000
        });
        
        console.log('✅ WEBHOOK FUNCIONANDO!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('❌ WEBHOOK COM PROBLEMA:');
        console.log('Status:', error.response?.status || 'N/A');
        console.log('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 500) {
            console.log('\n💡 POSSÍVEIS CAUSAS DO ERRO 500:');
            console.log('1. Evolution API não responde (instância império1 em loop)');
            console.log('2. Database connection perdida');
            console.log('3. Variáveis de ambiente incorretas');
            console.log('4. Timeout ao enviar WhatsApp');
        }
    }
}

async function testEvolutionAPI() {
    console.log('\n📱 TESTANDO EVOLUTION API...');
    
    try {
        const response = await axios.get(`${RAILWAY_URL}/instance/fetchInstances`, {
            headers: {
                'apikey': 'Imperio2024@EvolutionSecure',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Evolution API respondendo');
        console.log('Instâncias:', response.data?.length || 0);
        
    } catch (error) {
        console.log('❌ Evolution API com problema');
        console.log('Error:', error.response?.status || error.message);
    }
}

async function diagnose() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
    console.log('=' .repeat(50));
    
    await testWebhookEndpoint();
    await testEvolutionAPI();
    
    console.log('\n📋 RESUMO:');
    console.log('- Sistema recebeu vendas às 02:23 e 02:24');
    console.log('- Ambas falharam com erro 500');
    console.log('- Evolution API possivelmente instável');
    console.log('- REINICIALIZAÇÃO URGENTE necessária');
}

// Executar diagnóstico
diagnose().catch(console.error);