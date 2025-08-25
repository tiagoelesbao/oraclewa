import axios from 'axios';

const EVOLUTION_URL = 'http://128.140.7.154:8080';
const EVOLUTION_KEY = 'Imperio2024@EvolutionSecure';

console.log('\n🔧 === RECRIANDO INSTÂNCIAS COM PROBLEMAS ===\n');

async function recreateInstances() {
  // Instâncias para recriar (2 e 3 com problemas de QR Code)
  const instancesToFix = ['imperio-webhook-2', 'imperio-webhook-3'];
  
  for (const instanceName of instancesToFix) {
    console.log(`\n📱 Processando ${instanceName}...`);
    
    try {
      // 1. Deletar instância existente
      console.log('   🗑️ Deletando instância antiga...');
      try {
        const deleteResponse = await axios.delete(
          `${EVOLUTION_URL}/instance/delete/${instanceName}`,
          {
            headers: {
              'apikey': EVOLUTION_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        console.log('   ✅ Instância deletada com sucesso');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('   ⏭️ Instância não existe, prosseguindo...');
        } else {
          console.log(`   ⚠️ Erro ao deletar: ${error.message}`);
        }
      }
      
      // 2. Aguardar um pouco
      console.log('   ⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Criar nova instância
      console.log('   🔨 Criando nova instância...');
      const createPayload = {
        instanceName: instanceName,
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
      
      // 4. Buscar QR Code
      console.log('   📱 Gerando QR Code...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const qrResponse = await axios.get(
          `${EVOLUTION_URL}/instance/connect/${instanceName}`,
          {
            headers: {
              'apikey': EVOLUTION_KEY
            },
            timeout: 10000
          }
        );
        
        if (qrResponse.data?.qrcode?.code) {
          console.log('   ✅ QR Code gerado com sucesso!');
          console.log(`   📱 QR Code (primeiros 50 chars): ${qrResponse.data.qrcode.code.substring(0, 50)}...`);
        } else {
          console.log('   ⚠️ QR Code gerado mas pode estar em formato diferente');
        }
      } catch (error) {
        console.log('   ℹ️ QR Code será exibido no frontend');
      }
      
      console.log(`   ✅ ${instanceName} recriada e pronta para conexão!`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${instanceName}:`, error.message);
      if (error.response?.data) {
        console.error('   Detalhes:', error.response.data);
      }
    }
  }
  
  console.log('\n📋 === INSTRUÇÕES PARA CONECTAR ===\n');
  console.log('1. Acesse o frontend: http://localhost:3001/instances');
  console.log('2. Procure por imperio-webhook-2 e imperio-webhook-3');
  console.log('3. Clique em "Conectar" em cada uma');
  console.log('4. Um novo QR Code será exibido');
  console.log('5. Escaneie com o WhatsApp (use números diferentes)');
  console.log('');
  console.log('💡 DICAS:');
  console.log('- Use o WhatsApp oficial (não o Business)');
  console.log('- Certifique-se que o celular tem internet estável');
  console.log('- Se der erro, aguarde 30 segundos e tente novamente');
  console.log('- Cada instância precisa de um número diferente');
  console.log('');
  console.log('✅ Instâncias recriadas e prontas para uso!');
}

// Executar
recreateInstances().catch(console.error);