#!/usr/bin/env node

/**
 * Script de preparação do pool de webhooks
 * Apenas cria as instâncias no Evolution API (sem depender do backend)
 */

import axios from 'axios';
import chalk from 'chalk';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://128.140.7.154:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';

const WEBHOOK_INSTANCES = [
  'imperio-webhook-1',
  'imperio-webhook-2', 
  'imperio-webhook-3',
  'imperio-webhook-4'
];

class WebhookPoolPrep {
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
      return response.data || [];
    } catch (error) {
      this.log(`Erro ao verificar Evolution API: ${error.message}`, 'error');
      this.log('Verifique as credenciais e conectividade com ' + EVOLUTION_API_URL, 'warning');
      return null;
    }
  }

  async deleteOldInstance(instanceName) {
    try {
      this.log(`Removendo instância antiga: ${instanceName}...`);
      
      await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
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
        qrcode: true
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
      if (error.response?.status === 409) {
        this.log(`Instância ${instanceName} já existe (ok)`, 'warning');
        return true;
      }
      this.log(`Erro ao criar instância ${instanceName}: ${error.message}`, 'error');
      if (error.response?.data) {
        console.log(chalk.gray('Detalhes do erro:'), JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  async run() {
    console.log(chalk.cyan.bold('\n🔧 PREPARAÇÃO DO POOL DE WEBHOOKS IMPÉRIO\n'));

    // 1. Verificar Evolution API
    const instances = await this.checkEvolutionAPI();
    if (instances === null) {
      this.log('Evolution API não está acessível. Abortando.', 'error');
      process.exit(1);
    }

    // 2. Remover instância antiga imperio1
    const oldInstances = ['imperio1', 'imperio2', 'imperio3'];
    for (const oldInstance of oldInstances) {
      const exists = instances.find(inst => inst.name === oldInstance);
      if (exists) {
        await this.deleteOldInstance(oldInstance);
      }
    }

    // 3. Criar novas instâncias do pool
    this.log('Criando as 4 instâncias do pool...');
    let createdCount = 0;

    for (const instanceName of WEBHOOK_INSTANCES) {
      const exists = instances.find(inst => inst.name === instanceName);
      if (!exists) {
        const created = await this.createInstance(instanceName);
        if (created) {
          createdCount++;
        }
      } else {
        this.log(`Instância ${instanceName} já existe`, 'warning');
        createdCount++;
      }
    }

    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.cyan.bold('📊 RESULTADO DA PREPARAÇÃO'));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.white(`Instâncias do pool: ${createdCount}/4`));

    if (createdCount === 4) {
      console.log(chalk.green.bold('\n🎉 POOL PREPARADO COM SUCESSO!'));
      console.log(chalk.green('Todas as 4 instâncias foram criadas no Evolution API.'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  PREPARAÇÃO PARCIAL'));
      console.log(chalk.yellow(`${createdCount} instâncias criadas de 4 planejadas.`));
    }

    console.log('\n' + chalk.cyan('🔗 Próximos passos:'));
    console.log(chalk.white('1. Execute: ./start.sh'));
    console.log(chalk.white('2. Acesse: http://localhost:3001/webhooks'));
    console.log(chalk.white('3. Conecte as 4 instâncias pelos QR codes'));
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    this.log('Preparação concluída!', 'success');
  }
}

// Executar preparação
const prep = new WebhookPoolPrep();
prep.run().catch(error => {
  console.error(chalk.red.bold('\n💥 ERRO FATAL:'), error.message);
  process.exit(1);
});