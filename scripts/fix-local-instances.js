import axios from 'axios';

// URLs locais
const LOCAL_API = 'http://localhost:3333';
const EVOLUTION_LOCAL = 'http://localhost:8080';

async function checkLocalInstances() {
  console.log('\n🔍 === VERIFICANDO INSTÂNCIAS LOCAIS ===\n');
  
  try {
    // 1. Verificar Evolution API local
    console.log('📡 Testando Evolution API local...');
    try {
      const evolutionResponse = await axios.get(`${EVOLUTION_LOCAL}/instance/fetchInstances`, {
        headers: {
          'apikey': 'Imperio2024@EvolutionSecure',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log('✅ Evolution API local respondendo!');
      console.log(`📊 Total de instâncias: ${evolutionResponse.data.length}`);
      
      // Listar instâncias do pool
      const poolInstances = ['imperio-webhook-1', 'imperio-webhook-2', 'imperio-webhook-3', 'imperio-webhook-4'];
      
      console.log('\n📱 Status das instâncias do pool:');
      for (const poolName of poolInstances) {
        const instance = evolutionResponse.data.find(i => i.name === poolName);
        if (instance) {
          const status = instance.connectionStatus === 'open' ? '✅ CONECTADA' : '❌ DESCONECTADA';
          console.log(`   ${poolName}: ${status}`);
        } else {
          console.log(`   ${poolName}: ⚠️ NÃO EXISTE (precisa criar)`);
        }
      }
      
      // Verificar instância principal
      const mainInstance = evolutionResponse.data.find(i => i.name === 'oraclewa-imperio');
      if (mainInstance) {
        const status = mainInstance.connectionStatus === 'open' ? '✅ CONECTADA' : '❌ DESCONECTADA';
        console.log(`\n📱 Instância principal:`);
        console.log(`   oraclewa-imperio: ${status}`);
      }
      
    } catch (error) {
      console.log('❌ Evolution API local não está respondendo');
      console.log('   Certifique-se que está rodando na porta 8080');
    }
    
    // 2. Verificar API backend
    console.log('\n🔧 Testando API backend local...');
    try {
      const apiResponse = await axios.get(`${LOCAL_API}/health`, {
        timeout: 5000
      });
      
      console.log('✅ Backend API respondendo!');
      console.log(`📊 Total de clientes: ${apiResponse.data.system.totalClients}`);
      console.log(`📊 Total de instâncias: ${apiResponse.data.system.totalInstances}`);
      
    } catch (error) {
      console.log('❌ Backend API não está respondendo');
      console.log('   Execute: ./start.sh dev');
    }
    
    // 3. Criar instâncias faltantes
    console.log('\n🔨 Criando instâncias do pool faltantes...');
    
    for (let i = 1; i <= 3; i++) {
      const instanceName = `imperio-webhook-${i}`;
      
      try {
        // Verificar se já existe
        const checkResponse = await axios.get(`${EVOLUTION_LOCAL}/instance/fetchInstances`, {
          headers: {
            'apikey': 'Imperio2024@EvolutionSecure'
          },
          timeout: 5000
        });
        
        const exists = checkResponse.data.some(inst => inst.name === instanceName);
        
        if (!exists) {
          console.log(`\n📱 Criando ${instanceName}...`);
          
          const createResponse = await axios.post(
            `${EVOLUTION_LOCAL}/instance/create`,
            {
              instanceName: instanceName,
              webhook: `http://localhost:3333/webhook/imperio/messages`,
              webhook_by_events: false,
              events: ['messages.upsert'],
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS'
            },
            {
              headers: {
                'apikey': 'Imperio2024@EvolutionSecure',
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ ${instanceName} criada com sucesso!`);
        } else {
          console.log(`⏭️ ${instanceName} já existe`);
        }
        
      } catch (error) {
        console.log(`❌ Erro ao criar ${instanceName}: ${error.message}`);
      }
    }
    
    // 4. Instruções finais
    console.log('\n📋 === PRÓXIMOS PASSOS ===\n');
    console.log('1. Acesse o frontend: http://localhost:3001/instances');
    console.log('2. Conecte as instâncias do pool (1, 2, 3) com números diferentes');
    console.log('3. Cada instância precisa de um número WhatsApp único');
    console.log('4. Escaneie o QR Code de cada uma');
    console.log('\n✅ Sistema pronto para uso!\n');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
checkLocalInstances();