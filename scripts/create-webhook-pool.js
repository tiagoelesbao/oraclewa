#!/usr/bin/env node

/**
 * Script para criar e configurar pool de webhooks do Império
 * Substitui a instância imperio1 por um pool de 4 instâncias
 */

import axios from 'axios';
import chalk from 'chalk';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3333';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';

const WEBHOOK_INSTANCES = [
  'imperio-webhook-1',
  'imperio-webhook-2', 
  'imperio-webhook-3',
  'imperio-webhook-4'
];

class WebhookPoolSetup {
  constructor() {
    this.stepCounter = 1;
  }

  log(message, type = 'info') {
    const prefix = `[${this.stepCounter++}]`;
    switch (type) {
      case 'success':
        console.log(chalk.green(`✅ ${prefix} ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`❌ ${prefix} ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`⚠️  ${prefix} ${message}`));
        break;
      case 'info':
      default:
        console.log(chalk.blue(`ℹ️  ${prefix} ${message}`));
        break;
    }
  }

  async checkSystemHealth() {
    try {
      this.log('Verificando saúde do sistema...');
      
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 10000
      });

      if (response.data.status === 'ok') {
        this.log('Sistema OracleWA está online e funcionando', 'success');
        this.log(`Versão: ${response.data.version}`);
        this.log(`Clientes ativos: ${response.data.system?.activeClients || 0}`);
        return true;
      } else {
        this.log('Sistema não está saudável', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Erro ao verificar sistema: ${error.message}`, 'error');
      this.log('Certifique-se de que o backend está rodando em ' + BACKEND_URL, 'warning');
      return false;
    }
  }

  async checkEvolutionAPI() {
    try {
      this.log('Verificando Evolution API...');
      
      const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      this.log(`Evolution API está online - ${response.data?.length || 0} instâncias encontradas`, 'success');
      return true;
    } catch (error) {
      this.log(`Erro ao verificar Evolution API: ${error.message}`, 'error');
      this.log('Verifique as credenciais e conectividade com ' + EVOLUTION_API_URL, 'warning');
      return false;
    }
  }

  async deleteOldInstance(instanceName) {
    try {
      this.log(`Removendo instância antiga: ${instanceName}...`);
      
      const response = await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      this.log(`Instância ${instanceName} removida com sucesso`, 'success');
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        this.log(`Instância ${instanceName} não existe (ok)`, 'warning');
        return true;
      }
      this.log(`Erro ao remover instância ${instanceName}: ${error.message}`, 'error');
      return false;
    }
  }

  async createInstance(instanceName) {
    try {
      this.log(`Criando instância: ${instanceName}...`);
      
      const payload = {
        instanceName: instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        webhook: {
          url: `https://oraclewa-imperio-production.up.railway.app/webhook/imperio/order_expired`,
          by_events: true,
          webhook_by_events: true
        }
      };

      const response = await axios.post(`${EVOLUTION_API_URL}/instance/create`, payload, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      this.log(`Instância ${instanceName} criada com sucesso`, 'success');
      return response.data;
    } catch (error) {
      this.log(`Erro ao criar instância ${instanceName}: ${error.message}`, 'error');
      if (error.response?.data) {
        console.log(chalk.gray('Detalhes do erro:'), error.response.data);
      }
      return null;
    }
  }

  async getQRCode(instanceName) {
    try {
      this.log(`Obtendo QR Code para ${instanceName}...`);
      
      const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data?.base64) {
        this.log(`QR Code gerado para ${instanceName}`, 'success');
        return response.data.base64;
      } else {
        this.log(`Sem QR Code disponível para ${instanceName}`, 'warning');
        return null;
      }
    } catch (error) {
      this.log(`Erro ao obter QR Code para ${instanceName}: ${error.message}`, 'error');
      return null;
    }
  }

  async waitForConnection(instanceName, maxAttempts = 10) {
    this.log(`Aguardando conexão de ${instanceName}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        const state = response.data?.instance?.state;
        
        if (state === 'open') {
          this.log(`${instanceName} conectado com sucesso!`, 'success');
          return true;
        } else {
          this.log(`${instanceName} status: ${state} (tentativa ${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s
        }
      } catch (error) {
        this.log(`Erro ao verificar status de ${instanceName}: ${error.message}`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    this.log(`Timeout aguardando conexão de ${instanceName}`, 'warning');
    return false;
  }

  async setupWebhookPool() {
    try {
      this.log('Configurando pool de webhooks no backend...');
      
      // Atualizar configuração do cliente
      const response = await axios.post(`${BACKEND_URL}/api/management/reload/clients`, {}, {
        timeout: 10000
      });

      this.log('Configuração do pool recarregada no backend', 'success');
      return true;
    } catch (error) {
      this.log(`Erro ao configurar pool no backend: ${error.message}`, 'error');
      return false;
    }
  }

  async displayQRCodes(qrCodes) {
    if (qrCodes.length === 0) {
      this.log('Nenhum QR Code para exibir', 'warning');
      return;
    }

    console.log('\n' + chalk.cyan('═'.repeat(80)));
    console.log(chalk.cyan.bold('                    🔗 QR CODES PARA CONEXÃO'));
    console.log(chalk.cyan('═'.repeat(80)));

    qrCodes.forEach(({ instanceName, qrcode }, index) => {
      console.log(`\n${chalk.yellow.bold(`${index + 1}. ${instanceName}:`)}`);
      
      if (qrcode) {
        console.log(chalk.green('✅ QR Code disponível - Escaneie com o WhatsApp'));
        console.log(chalk.gray(`Data URL: data:image/png;base64,${qrcode.substring(0, 50)}...`));
        
        // Salvar QR Code em arquivo para visualização
        const fs = await import('fs');
        const qrPath = `./qr-codes/${instanceName}.png`;
        
        try {
          await fs.promises.mkdir('./qr-codes', { recursive: true });
          await fs.promises.writeFile(qrPath, qrcode, 'base64');
          console.log(chalk.blue(`📁 QR Code salvo em: ${qrPath}`));
        } catch (error) {
          console.log(chalk.red(`Erro ao salvar QR Code: ${error.message}`));
        }
      } else {
        console.log(chalk.red('❌ QR Code não disponível'));
      }
    });

    console.log('\n' + chalk.cyan('═'.repeat(80)));
    console.log(chalk.yellow.bold('🔄 PRÓXIMOS PASSOS:'));
    console.log(chalk.white('1. Abra o WhatsApp nos 4 dispositivos/números'));
    console.log(chalk.white('2. Vá em Dispositivos Conectados > Conectar dispositivo'));
    console.log(chalk.white('3. Escaneie cada QR Code correspondente'));
    console.log(chalk.white('4. Aguarde a conexão de todas as instâncias'));
    console.log(chalk.cyan('═'.repeat(80)) + '\n');
  }

  async run() {
    console.log(chalk.cyan.bold('\n🚀 SETUP DO POOL DE WEBHOOKS IMPÉRIO\n'));
    console.log(chalk.white('Este script vai:'));
    console.log(chalk.white('• Remover a instância imperio1 (se existir)'));
    console.log(chalk.white('• Criar 4 novas instâncias para webhook pool'));
    console.log(chalk.white('• Configurar load balancing automático'));
    console.log(chalk.white('• Ativar sistema anti-ban avançado\n'));

    // 1. Verificar saúde do sistema
    const systemHealthy = await this.checkSystemHealth();
    if (!systemHealthy) {
      this.log('Sistema não está saudável. Abortando.', 'error');
      process.exit(1);
    }

    // 2. Verificar Evolution API
    const evolutionHealthy = await this.checkEvolutionAPI();
    if (!evolutionHealthy) {
      this.log('Evolution API não está acessível. Abortando.', 'error');
      process.exit(1);
    }

    // 3. Remover instância antiga
    await this.deleteOldInstance('imperio1');

    // 4. Criar novas instâncias
    this.log('Iniciando criação das 4 instâncias do pool...');
    const qrCodes = [];

    for (const instanceName of WEBHOOK_INSTANCES) {
      const created = await this.createInstance(instanceName);
      if (created) {
        // Aguardar um pouco antes de obter QR Code
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const qrCode = await this.getQRCode(instanceName);
        if (qrCode) {
          qrCodes.push({ instanceName, qrcode: qrCode });
        }
      }
    }

    // 5. Configurar pool no backend
    await this.setupWebhookPool();

    // 6. Exibir QR Codes
    await this.displayQRCodes(qrCodes);

    // 7. Monitorar conexões
    this.log('Iniciando monitoramento de conexões...');
    const connectionPromises = WEBHOOK_INSTANCES.map(instanceName => 
      this.waitForConnection(instanceName, 20)
    );

    const connectionResults = await Promise.allSettled(connectionPromises);
    const connectedCount = connectionResults.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.cyan.bold('📊 RESULTADO FINAL'));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.white(`Instâncias criadas: ${WEBHOOK_INSTANCES.length}/4`));
    console.log(chalk.white(`Instâncias conectadas: ${connectedCount}/4`));
    console.log(chalk.white(`QR Codes gerados: ${qrCodes.length}/4`));

    if (connectedCount === 4) {
      console.log(chalk.green.bold('\n🎉 POOL DE WEBHOOKS CONFIGURADO COM SUCESSO!'));
      console.log(chalk.green('Todas as 4 instâncias estão conectadas e prontas.'));
    } else if (connectedCount > 0) {
      console.log(chalk.yellow.bold('\n⚠️  POOL PARCIALMENTE CONFIGURADO'));
      console.log(chalk.yellow(`${connectedCount} instâncias conectadas, ${4 - connectedCount} ainda pendentes.`));
      console.log(chalk.white('Continue escaneando os QR Codes restantes.'));
    } else {
      console.log(chalk.red.bold('\n❌ NENHUMA INSTÂNCIA CONECTADA'));
      console.log(chalk.red('Verifique os QR Codes e tente conectar manualmente.'));
    }

    console.log('\n' + chalk.cyan('🔗 URLs Úteis:'));
    console.log(chalk.blue(`• Dashboard: http://localhost:3001/webhooks`));
    console.log(chalk.blue(`• API Health: ${BACKEND_URL}/health`));
    console.log(chalk.blue(`• Pool Status: ${BACKEND_URL}/api/webhooks/pools`));
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    this.log('Setup do pool de webhooks concluído!', 'success');
  }
}

// Executar script
const setup = new WebhookPoolSetup();
setup.run().catch(error => {
  console.error(chalk.red.bold('\n💥 ERRO FATAL:'), error.message);
  console.error(chalk.gray(error.stack));
  process.exit(1);
});