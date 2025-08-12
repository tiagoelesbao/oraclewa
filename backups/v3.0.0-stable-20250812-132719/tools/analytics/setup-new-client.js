// 🏗️ CONFIGURAR NOVA INSTÂNCIA PARA CLIENTE
// Automatiza criação de instância + configuração

import axios from 'axios';
import fs from 'fs/promises';

const CONFIG = {
  evolutionUrl: 'http://128.140.7.154:8080',
  apiKey: 'Imperio2024@EvolutionSecure'
};

class NewClientSetup {
  constructor(clientName) {
    this.clientName = clientName;
    this.instanceName = `${clientName.toLowerCase().replace(/\s+/g, '-')}-broadcast`;
    this.setupLog = [];
  }
  
  // 📝 Log de progresso
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = { timestamp, message, type };
    this.setupLog.push(logEntry);
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${timestamp}] ${message}`);
  }
  
  // 🔍 Verificar se instância já existe
  async checkInstanceExists() {
    try {
      this.log(`Verificando se instância ${this.instanceName} já existe...`);
      
      const response = await axios.get(
        `${CONFIG.evolutionUrl}/instance/fetchInstances`,
        {
          headers: { apikey: CONFIG.apiKey },
          timeout: 10000
        }
      );
      
      const instances = response.data || [];
      const exists = instances.some(inst => inst.instanceName === this.instanceName);
      
      if (exists) {
        this.log(`Instância ${this.instanceName} já existe`, 'warning');
        return true;
      } else {
        this.log(`Instância ${this.instanceName} não existe - pode criar`, 'success');
        return false;
      }
      
    } catch (error) {
      this.log(`Erro ao verificar instâncias: ${error.message}`, 'error');
      return false;
    }
  }
  
  // 🏗️ Criar nova instância
  async createInstance() {
    try {
      this.log(`Criando instância ${this.instanceName}...`);
      
      const response = await axios.post(
        `${CONFIG.evolutionUrl}/instance/create`,
        {
          instanceName: this.instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        },
        {
          headers: {
            'apikey': CONFIG.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      if (response.status === 201) {
        this.log(`Instância ${this.instanceName} criada com sucesso!`, 'success');
        return true;
      } else {
        this.log(`Erro ao criar instância: Status ${response.status}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Erro ao criar instância: ${error.message}`, 'error');
      return false;
    }
  }
  
  // 📱 Gerar QR Code para conexão
  async generateQRCode() {
    try {
      this.log(`Gerando QR Code para ${this.instanceName}...`);
      
      const response = await axios.get(
        `${CONFIG.evolutionUrl}/instance/connect/${this.instanceName}`,
        {
          headers: { apikey: CONFIG.apiKey },
          timeout: 15000
        }
      );
      
      if (response.data && response.data.qrcode) {
        this.log(`QR Code gerado! Escaneie com WhatsApp do cliente`, 'success');
        console.log(`\n📱 QR CODE:\n${response.data.qrcode.code}\n`);
        return response.data.qrcode.code;
      } else {
        this.log(`Erro ao gerar QR Code`, 'error');
        return null;
      }
      
    } catch (error) {
      this.log(`Erro ao gerar QR Code: ${error.message}`, 'error');
      return null;
    }
  }
  
  // ⏳ Aguardar conexão
  async waitForConnection(maxWaitMinutes = 10) {
    this.log(`Aguardando conexão do WhatsApp (máximo ${maxWaitMinutes} minutos)...`);
    
    const startTime = Date.now();
    const maxWaitMs = maxWaitMinutes * 60 * 1000;
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await axios.get(
          `${CONFIG.evolutionUrl}/instance/connectionState/${this.instanceName}`,
          {
            headers: { apikey: CONFIG.apiKey },
            timeout: 5000
          }
        );
        
        const state = response.data?.instance?.state;
        
        if (state === 'open') {
          this.log(`WhatsApp conectado com sucesso!`, 'success');
          return true;
        } else {
          process.stdout.write(`⏳ Status: ${state || 'connecting'}...\\r`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check a cada 5s
        
      } catch (error) {
        process.stdout.write(`⏳ Verificando conexão...\\r`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.log(`Timeout: WhatsApp não conectou em ${maxWaitMinutes} minutos`, 'warning');
    return false;
  }
  
  // 📤 Teste de envio
  async testSending(testNumber) {
    try {
      this.log(`Testando envio para ${testNumber}...`);
      
      const testMessage = `🧪 *TESTE DE CONFIGURAÇÃO*
      
Olá! Este é um teste da nova instância ${this.instanceName}.

✅ *Status da configuração:*
• Instância: CONECTADA
• WhatsApp: FUNCIONANDO  
• Sistema: OPERACIONAL

🎯 Cliente: ${this.clientName}
⏰ Setup: ${new Date().toLocaleString('pt-BR')}

*Sistema OracleWA - Configuração concluída!*`;
      
      const response = await axios.post(
        `${CONFIG.evolutionUrl}/message/sendText/${this.instanceName}`,
        {
          number: testNumber,
          text: testMessage,
          delay: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.apiKey
          },
          timeout: 15000
        }
      );
      
      if (response.status === 201) {
        this.log(`Teste de envio realizado com sucesso!`, 'success');
        return true;
      } else {
        this.log(`Erro no teste de envio: Status ${response.status}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Erro no teste de envio: ${error.message}`, 'error');
      return false;
    }
  }
  
  // 📝 Criar arquivo de configuração do cliente
  async createClientConfig() {
    const config = {
      cliente: {
        nome: this.clientName,
        instancia: this.instanceName,
        dataSetup: new Date().toISOString(),
        status: 'ATIVO'
      },
      configuracao: {
        evolutionUrl: CONFIG.evolutionUrl,
        apiKey: CONFIG.apiKey,
        instanceName: this.instanceName
      },
      limites: {
        mensagensHora: 150, // Para chip R$ 120
        mensagensDia: 1000,
        loteSize: 15,
        pausaEntreLotes: 3 * 60 * 1000 // 3 minutos
      },
      monitoramento: {
        taxaMinimaSuccess: 80, // %
        maxFailureRate: 20, // %
        maxResponseTime: 10000 // ms
      },
      setupLog: this.setupLog
    };
    
    const filename = `client-${this.instanceName}-config.json`;
    await fs.writeFile(filename, JSON.stringify(config, null, 2));
    
    this.log(`Arquivo de configuração salvo: ${filename}`, 'success');
    return filename;
  }
  
  // 🎯 Setup completo
  async setupComplete(testNumber) {
    console.log(`\n🚀 === CONFIGURANDO NOVO CLIENTE ===`);
    console.log(`👤 Cliente: ${this.clientName}`);
    console.log(`📱 Instância: ${this.instanceName}`);
    console.log(`⏰ Início: ${new Date().toLocaleString('pt-BR')}\n`);
    
    try {
      // 1. Verificar se já existe
      const exists = await this.checkInstanceExists();
      if (exists) {
        this.log(`Instância já existe. Verificando status...`);
        
        // Verificar se está conectada
        const response = await axios.get(
          `${CONFIG.evolutionUrl}/instance/connectionState/${this.instanceName}`,
          { headers: { apikey: CONFIG.apiKey } }
        );
        
        const state = response.data?.instance?.state;
        if (state === 'open') {
          this.log(`Instância já conectada e funcionando!`, 'success');
          
          if (testNumber) {
            await this.testSending(testNumber);
          }
          
          const configFile = await this.createClientConfig();
          return { success: true, instanceName: this.instanceName, configFile };
        } else {
          this.log(`Instância existe mas não conectada. Gerando QR Code...`);
          await this.generateQRCode();
          const connected = await this.waitForConnection();
          
          if (connected && testNumber) {
            await this.testSending(testNumber);
          }
          
          const configFile = await this.createClientConfig();
          return { success: connected, instanceName: this.instanceName, configFile };
        }
      }
      
      // 2. Criar nova instância
      const created = await this.createInstance();
      if (!created) {
        return { success: false, error: 'Falha ao criar instância' };
      }
      
      // 3. Gerar QR Code
      const qrCode = await this.generateQRCode();
      if (!qrCode) {
        return { success: false, error: 'Falha ao gerar QR Code' };
      }
      
      // 4. Aguardar conexão
      const connected = await this.waitForConnection();
      if (!connected) {
        this.log(`Setup incompleto - WhatsApp não conectado`, 'warning');
        this.log(`Execute novamente após conectar o WhatsApp`, 'info');
      }
      
      // 5. Teste de envio (opcional)
      if (connected && testNumber) {
        await this.testSending(testNumber);
      }
      
      // 6. Criar configuração
      const configFile = await this.createClientConfig();
      
      console.log(`\n🎉 === SETUP CONCLUÍDO ===`);
      console.log(`✅ Instância: ${this.instanceName}`);
      console.log(`📱 WhatsApp: ${connected ? 'CONECTADO' : 'PENDENTE'}`);
      console.log(`📄 Config: ${configFile}`);
      console.log(`🚀 Pronto para broadcast!`);
      
      return {
        success: true,
        instanceName: this.instanceName,
        connected,
        configFile,
        qrCode: connected ? null : qrCode
      };
      
    } catch (error) {
      this.log(`Erro no setup: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
}

// 🚀 Executar setup
async function setupNewClient(clientName, testNumber = null) {
  const setup = new NewClientSetup(clientName);
  return await setup.setupComplete(testNumber);
}

// Executar se chamado diretamente
if (process.argv[2]) {
  const clientName = process.argv[2];
  const testNumber = process.argv[3];
  
  console.log(`🏗️ Configurando cliente: ${clientName}`);
  if (testNumber) {
    console.log(`📞 Número de teste: ${testNumber}`);
  }
  
  setupNewClient(clientName, testNumber)
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Setup concluído para ${clientName}!`);
      } else {
        console.log(`\n❌ Falha no setup: ${result.error}`);
      }
    })
    .catch(error => {
      console.error(`\n💥 Erro crítico:`, error.message);
    });
}

export { setupNewClient, NewClientSetup };