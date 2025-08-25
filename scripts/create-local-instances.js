import axios from 'axios';

// Configurações
const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';

console.log('\n🔍 === CRIANDO INSTÂNCIAS DO POOL LOCALMENTE ===\n');
console.log(`📡 Evolution API: ${EVOLUTION_URL}`);
console.log('⏳ Tentando conectar...\n');

async function createPoolInstances() {
  // Instâncias do pool para criar
  const poolInstances = [
    { name: 'imperio-webhook-1', description: 'Pool Instance 1/3' },
    { name: 'imperio-webhook-2', description: 'Pool Instance 2/3' },
    { name: 'imperio-webhook-3', description: 'Pool Instance 3/3' }
  ];
  
  for (const instance of poolInstances) {
    console.log(`\n📱 Processando ${instance.name}...`);
    
    try {
      // Primeiro verificar se existe
      console.log('   🔍 Verificando se já existe...');
      const fetchResponse = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers: {
          'apikey': EVOLUTION_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const exists = fetchResponse.data.some(i => i.name === instance.name);
      
      if (exists) {
        const existingInstance = fetchResponse.data.find(i => i.name === instance.name);
        const status = existingInstance.connectionStatus === 'open' ? '✅ CONECTADA' : '❌ DESCONECTADA';
        console.log(`   ⏭️ Já existe - Status: ${status}`);
        
        // Se desconectada, gerar QR Code
        if (existingInstance.connectionStatus !== 'open') {
          try {
            console.log('   📱 Gerando QR Code...');
            const qrResponse = await axios.get(`${EVOLUTION_URL}/instance/connect/${instance.name}`, {
              headers: { 'apikey': EVOLUTION_KEY },
              timeout: 10000
            });
            console.log('   ✅ QR Code disponível no frontend!');
          } catch (error) {
            console.log('   ⚠️ QR Code já está sendo exibido ou erro ao gerar');
          }
        }
      } else {
        // Criar nova instância
        console.log('   🔨 Criando nova instância...');
        
        const createPayload = {
          instanceName: instance.name,
          webhook: `http://localhost:3333/webhook/imperio/messages`,
          webhook_by_events: false,
          events: ['messages.upsert'],
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        };
        
        const createResponse = await axios.post(
          `${EVOLUTION_URL}/instance/create`,
          createPayload,
          {
            headers: {
              'apikey': EVOLUTION_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        
        console.log('   ✅ Instância criada com sucesso!');
        console.log('   📱 QR Code disponível no frontend');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Evolution API não está acessível em ${EVOLUTION_URL}`);
        console.log('   💡 Verifique se o servidor está online ou use uma Evolution API local');
        break;
      } else if (error.response?.status === 401) {
        console.log('   ❌ API Key inválida');
        break;
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
  }
  
  console.log('\n📋 === INSTRUÇÕES ===\n');
  console.log('Se o servidor Hetzner estiver offline:');
  console.log('1. Instale e inicie uma Evolution API local:');
  console.log('   docker run -d -p 8080:8080 --name evolution atendai/evolution-api');
  console.log('');
  console.log('2. Ou use um servidor alternativo editando .env:');
  console.log('   EVOLUTION_API_URL=http://seu-servidor:8080');
  console.log('');
  console.log('3. Após configurar, execute novamente este script');
  console.log('');
  console.log('Se o servidor estiver online:');
  console.log('1. Acesse http://localhost:3001/instances');
  console.log('2. Conecte as instâncias escaneando os QR Codes');
  console.log('3. Use números WhatsApp diferentes para cada uma\n');
}

// Executar
createPoolInstances().catch(console.error);