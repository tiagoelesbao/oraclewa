import axios from 'axios';

const EVOLUTION_URL = 'http://128.140.7.154:8080';
const EVOLUTION_KEY = 'Imperio2024@EvolutionSecure';

console.log('\n🔨 === CRIANDO INSTÂNCIAS COM PAYLOAD MÍNIMO ===\n');

async function createSimpleInstances() {
  const instances = [
    { name: 'imperio-webhook-3' },
    { name: 'imperio-webhook-4' }
  ];
  
  for (const instance of instances) {
    console.log(`\n📱 Criando ${instance.name}...`);
    
    try {
      // Payload absolutamente mínimo
      const minimalPayload = {
        instanceName: instance.name,
        integration: 'WHATSAPP-BAILEYS'
      };
      
      console.log('   🔧 Usando payload mínimo:', JSON.stringify(minimalPayload));
      
      const response = await axios.post(
        `${EVOLUTION_URL}/instance/create`,
        minimalPayload,
        {
          headers: {
            'apikey': EVOLUTION_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('   ✅ Instância criada com sucesso!');
      console.log('   📊 Resposta:', response.data);
      
      // Aguardar um pouco antes da próxima
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Configurar webhook
      console.log('   🔗 Configurando webhook...');
      try {
        await axios.post(
          `${EVOLUTION_URL}/webhook/set/${instance.name}`,
          {
            webhook: 'http://localhost:3333/webhook/imperio/messages',
            events: ['messages.upsert'],
            webhook_by_events: false
          },
          {
            headers: {
              'apikey': EVOLUTION_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('   ✅ Webhook configurado');
      } catch (webhookError) {
        console.log('   ⚠️ Erro no webhook, mas instância foi criada:', webhookError.message);
      }
      
      // Tentar gerar QR
      console.log('   📱 Tentando gerar QR...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const qrResponse = await axios.get(
          `${EVOLUTION_URL}/instance/connect/${instance.name}`,
          {
            headers: { 'apikey': EVOLUTION_KEY }
          }
        );
        
        if (qrResponse.data) {
          console.log('   ✅ QR disponível!');
        }
      } catch (qrError) {
        console.log('   ℹ️ QR será gerado no frontend');
      }
      
    } catch (error) {
      console.error(`   ❌ Erro ao criar ${instance.name}:`, error.response?.data || error.message);
      
      // Tentar com payload ainda mais simples
      if (error.response?.status === 400) {
        console.log('   🔄 Tentando com payload ultra-simples...');
        try {
          const ultraSimplePayload = {
            instanceName: instance.name
          };
          
          await axios.post(
            `${EVOLUTION_URL}/instance/create`,
            ultraSimplePayload,
            {
              headers: {
                'apikey': EVOLUTION_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('   ✅ Criada com payload ultra-simples!');
        } catch (secondError) {
          console.log('   ❌ Falhou mesmo com payload ultra-simples:', secondError.message);
        }
      }
    }
  }
  
  console.log('\n📋 === STATUS FINAL ===\n');
  console.log('🎯 PRÓXIMOS PASSOS PARA RESOLVER O ERRO:');
  console.log('');
  console.log('1. 📱 PREPARAÇÃO DO CELULAR (CRÍTICO):');
  console.log('   • Feche completamente o WhatsApp');
  console.log('   • Desative WiFi, use APENAS dados móveis');
  console.log('   • Reabra o WhatsApp');
  console.log('');
  console.log('2. 🌐 CONEXÃO:');
  console.log('   • Certifique-se de ter sinal 4G/5G forte');
  console.log('   • Se o sinal estiver fraco, mude de localização');
  console.log('');
  console.log('3. ⏱️ TIMING:');
  console.log('   • Tenha o celular PRONTO antes de gerar QR');
  console.log('   • Escaneie IMEDIATAMENTE (< 10 segundos)');
  console.log('   • Se demorar, clique em "Atualizar QR"');
  console.log('');
  console.log('4. 📞 NÚMERO:');
  console.log('   • Use números que NUNCA foram usados no WhatsApp Web');
  console.log('   • Ou aguarde 24-48h se já foram usados');
  console.log('');
  console.log('✅ Acesse: http://localhost:3001/instances');
  console.log('🔄 Clique em "Conectar" nas instâncias 3 e 4');
  console.log('📱 Siga EXATAMENTE o procedimento acima!');
}

// Executar
createSimpleInstances().catch(console.error);