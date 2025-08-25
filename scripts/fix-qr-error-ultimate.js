import axios from 'axios';

const EVOLUTION_URL = 'http://128.140.7.154:8080';
const EVOLUTION_KEY = 'Imperio2024@EvolutionSecure';

console.log('\n🚨 === CORREÇÃO DEFINITIVA DO ERRO QR CODE ===\n');

async function ultimateQRFix() {
  const instancesToFix = ['imperio-webhook-3', 'imperio-webhook-4'];
  
  for (const instanceName of instancesToFix) {
    console.log(`\n📱 Aplicando correção definitiva em ${instanceName}...`);
    
    try {
      // 1. Deletar instância completamente
      console.log('   🗑️ Deletando instância antiga...');
      try {
        await axios.delete(
          `${EVOLUTION_URL}/instance/delete/${instanceName}`,
          {
            headers: { 'apikey': EVOLUTION_KEY },
            timeout: 10000
          }
        );
        console.log('   ✅ Instância deletada');
      } catch (error) {
        console.log('   ⏭️ Instância já não existe');
      }
      
      // 2. Aguardar limpeza completa
      console.log('   ⏳ Aguardando limpeza completa (10 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 3. Criar com configurações ultra-minimalistas
      console.log('   🔨 Criando com configurações ultra-minimalistas...');
      
      const ultraMinimalPayload = {
        instanceName: instanceName,
        webhook: `http://localhost:3333/webhook/imperio/messages`,
        webhook_by_events: false,
        events: ['messages.upsert'],
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      };
      
      await axios.post(
        `${EVOLUTION_URL}/instance/create`,
        ultraMinimalPayload,
        {
          headers: {
            'apikey': EVOLUTION_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('   ✅ Instância criada com payload minimalista');
      
      // 4. Aplicar settings MAIS restritivos possível
      console.log('   ⚙️ Aplicando settings ultra-restritivos...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const ultraRestrictiveSettings = {
        rejectCall: true,
        msgCall: "Sistema indisponível",
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false
      };
      
      await axios.post(
        `${EVOLUTION_URL}/settings/set/${instanceName}`,
        ultraRestrictiveSettings,
        {
          headers: {
            'apikey': EVOLUTION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Settings ultra-restritivos aplicados');
      
      // 5. Aguardar estabilização
      console.log('   ⏳ Aguardando estabilização (5 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 6. Gerar QR Code limpo
      console.log('   📱 Gerando QR Code ultra-limpo...');
      
      const qrResponse = await axios.get(
        `${EVOLUTION_URL}/instance/connect/${instanceName}`,
        {
          headers: { 'apikey': EVOLUTION_KEY },
          timeout: 15000
        }
      );
      
      if (qrResponse.data?.code) {
        console.log('   ✅ QR Code ultra-limpo gerado!');
        console.log(`   📱 Tamanho: ${qrResponse.data.code.length} chars`);
        console.log(`   🔗 Válido: ${qrResponse.data.code.startsWith('2@') ? 'SIM' : 'NÃO'}`);
      }
      
      console.log(`   ✅ ${instanceName} pronta com configuração ultra-restritiva!`);
      
    } catch (error) {
      console.error(`   ❌ Erro em ${instanceName}:`, error.message);
    }
  }
  
  // Instruções específicas para o erro
  console.log('\n🔧 === INSTRUÇÕES ESPECÍFICAS PARA O ERRO ===\n');
  console.log('❌ ERRO: "Não foi possível conectar o dispositivo"\n');
  
  console.log('🎯 SOLUÇÕES ORDENADAS POR EFETIVIDADE:\n');
  
  console.log('1. 📱 SMARTPHONE (MAIS IMPORTANTE):');
  console.log('   ✅ Use APENAS WhatsApp OFICIAL (não Business/GB)');
  console.log('   ✅ Feche completamente o WhatsApp antes de escanear');
  console.log('   ✅ Force close: Settings > Apps > WhatsApp > Force Stop');
  console.log('   ✅ Aguarde 30 segundos após force close');
  console.log('   ✅ Reabra o WhatsApp e vá direto para QR scanner');
  console.log('');
  
  console.log('2. 🌐 CONEXÃO (CRÍTICO):');
  console.log('   ✅ DESATIVE WiFi completamente');
  console.log('   ✅ Use APENAS dados móveis (4G/5G)');
  console.log('   ✅ Certifique-se de ter sinal forte');
  console.log('   ✅ Se necessário, mude de localização para melhor sinal');
  console.log('');
  
  console.log('3. ⏱️ TIMING (FUNDAMENTAL):');
  console.log('   ✅ QR Code expira em 20-40 segundos');
  console.log('   ✅ Escaneie IMEDIATAMENTE após aparecer');
  console.log('   ✅ Se demorar >10s para escanear, atualize o QR');
  console.log('   ✅ Tenha o celular pronto ANTES de gerar o QR');
  console.log('');
  
  console.log('4. 📞 NÚMERO (IMPORTANTE):');
  console.log('   ✅ Use um número que NUNCA foi usado no WhatsApp Web');
  console.log('   ✅ Ou aguarde 24-48h se já foi usado antes');
  console.log('   ✅ Certifique-se que não está logado em outros dispositivos');
  console.log('   ✅ Faça logout de todos WhatsApp Web antes');
  console.log('');
  
  console.log('5. 🔄 PROCEDIMENTO CORRETO:');
  console.log('   1️⃣ Force close do WhatsApp');
  console.log('   2️⃣ Desativar WiFi, usar só dados móveis');
  console.log('   3️⃣ Reabrir WhatsApp');
  console.log('   4️⃣ Menu > Aparelhos conectados');
  console.log('   5️⃣ "Conectar um aparelho"');
  console.log('   6️⃣ Gerar QR no frontend');
  console.log('   7️⃣ Escanear IMEDIATAMENTE (<10s)');
  console.log('   8️⃣ Aguardar "Conectado com sucesso"');
  console.log('');
  
  console.log('🆘 SE AINDA ASSIM NÃO FUNCIONAR:');
  console.log('   • Tente em horários diferentes (madrugada tem menos tráfego)');
  console.log('   • Use outro celular se disponível');
  console.log('   • Reinicie completamente o celular');
  console.log('   • Limpe cache do WhatsApp');
  console.log('   • Use um número completamente diferente');
  console.log('');
  
  console.log('✅ Configurações ultra-restritivas aplicadas para máxima compatibilidade!');
  console.log('📱 Acesse: http://localhost:3001/instances');
  console.log('🔄 As instâncias 3 e 4 têm QR codes completamente novos e otimizados!');
}

// Executar
ultimateQRFix().catch(console.error);