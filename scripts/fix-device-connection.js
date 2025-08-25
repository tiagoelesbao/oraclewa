import axios from 'axios';

const EVOLUTION_URL = 'http://128.140.7.154:8080';
const EVOLUTION_KEY = 'Imperio2024@EvolutionSecure';

console.log('\n🔧 === CORRIGINDO ERRO "NÃO FOI POSSÍVEL CONECTAR O DISPOSITIVO" ===\n');

async function fixDeviceConnection() {
  // Instâncias para corrigir
  const instancesToFix = ['imperio-webhook-2', 'imperio-webhook-3', 'imperio-webhook-4'];
  
  for (const instanceName of instancesToFix) {
    console.log(`\n📱 Processando ${instanceName}...`);
    
    try {
      // 1. Verificar configurações atuais
      console.log('   🔍 Verificando configurações atuais...');
      
      const settingsResponse = await axios.get(
        `${EVOLUTION_URL}/settings/find/${instanceName}`,
        {
          headers: { 'apikey': EVOLUTION_KEY },
          timeout: 10000
        }
      );
      
      console.log('   ✅ Configurações atuais obtidas');
      
      // 2. Atualizar configurações para melhor compatibilidade
      console.log('   ⚙️ Atualizando configurações...');
      
      const newSettings = {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false
      };
      
      await axios.post(
        `${EVOLUTION_URL}/settings/set/${instanceName}`,
        newSettings,
        {
          headers: {
            'apikey': EVOLUTION_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('   ✅ Configurações atualizadas');
      
      // 3. Aguardar um momento
      console.log('   ⏳ Aguardando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Forçar reconexão/reiniciar instância
      console.log('   🔄 Reiniciando instância...');
      
      try {
        await axios.post(
          `${EVOLUTION_URL}/instance/restart/${instanceName}`,
          {},
          {
            headers: {
              'apikey': EVOLUTION_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        console.log('   ✅ Instância reiniciada');
        
        // Aguardar reinicialização
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log('   ⏭️ Restart não disponível, continuando...');
      }
      
      // 5. Gerar novo QR Code
      console.log('   📱 Gerando novo QR Code...');
      
      const qrResponse = await axios.get(
        `${EVOLUTION_URL}/instance/connect/${instanceName}`,
        {
          headers: { 'apikey': EVOLUTION_KEY },
          timeout: 15000
        }
      );
      
      if (qrResponse.data?.qrcode) {
        console.log('   ✅ QR Code gerado com sucesso!');
        console.log(`   📱 Status: ${qrResponse.data.status || 'connecting'}`);
        
        // Mostrar primeiros caracteres do QR para verificar
        if (qrResponse.data.qrcode.code) {
          console.log(`   🔗 QR Code válido (${qrResponse.data.qrcode.code.length} chars)`);
        }
      } else {
        console.log('   ⚠️ QR Code em formato diferente');
      }
      
      console.log(`   ✅ ${instanceName} pronta para conexão!`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${instanceName}:`, error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️ Evolution API não está acessível');
        console.log('   💡 Verifique se o servidor está online');
      } else if (error.response?.status === 404) {
        console.log('   ⚠️ Instância não encontrada, pode ter sido deletada');
        console.log('   💡 Execute o script de recriação novamente');
      }
    }
  }
  
  console.log('\n📋 === INSTRUÇÕES ESPECÍFICAS PARA RESOLVER O ERRO ===\n');
  console.log('🔧 CAUSAS COMUNS DO ERRO "Não foi possível conectar o dispositivo":');
  console.log('');
  console.log('1. 📱 PROBLEMA NO CELULAR:');
  console.log('   - Use WhatsApp OFICIAL (não Business/GB WhatsApp)');
  console.log('   - Feche completamente o WhatsApp antes de escanear');
  console.log('   - Certifique-se que o celular tem internet estável');
  console.log('   - Desative WiFi e use apenas dados móveis');
  console.log('');
  console.log('2. 🔗 PROBLEMA NO QR CODE:');
  console.log('   - QR Code expira em 60 segundos');
  console.log('   - Clique em "Atualizar" se demorar mais de 30s');
  console.log('   - Escaneie rapidamente após o QR aparecer');
  console.log('');
  console.log('3. 📶 PROBLEMA DE REDE:');
  console.log('   - Servidor Evolution API deve estar online');
  console.log('   - Verifique conexão com a internet');
  console.log('   - Tente em horários diferentes (menor tráfego)');
  console.log('');
  console.log('4. 🔄 PROBLEMA DE SESSÃO:');
  console.log('   - Se o número já foi usado antes, aguarde 24h');
  console.log('   - Ou use um número completamente diferente');
  console.log('   - Logout do WhatsApp Web em outros lugares');
  console.log('');
  console.log('📱 PASSOS PARA CONECTAR:');
  console.log('1. Acesse: http://localhost:3001/instances');
  console.log('2. Clique em "Conectar" na instância');
  console.log('3. Abra WhatsApp no celular');
  console.log('4. Vá em Menu > Aparelhos conectados');
  console.log('5. Toque em "Conectar um aparelho"');
  console.log('6. Escaneie o QR Code RAPIDAMENTE');
  console.log('7. Aguarde mensagem "Conectado com sucesso"');
  console.log('');
  console.log('⚡ DICA AVANÇADA:');
  console.log('Se persistir o erro, tente:');
  console.log('- Usar dados móveis ao invés de WiFi');
  console.log('- Reiniciar o celular');
  console.log('- Limpar cache do WhatsApp');
  console.log('- Usar outro número se disponível');
  console.log('');
  console.log('✅ As instâncias foram configuradas com settings otimizados!');
}

// Executar
fixDeviceConnection().catch(console.error);