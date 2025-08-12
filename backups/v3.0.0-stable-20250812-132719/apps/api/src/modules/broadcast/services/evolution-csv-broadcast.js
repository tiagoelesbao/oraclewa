import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class EvolutionCSVBroadcast {
  constructor() {
    // Usar Evolution API já configurada no sistema
    this.evolutionUrl = process.env.EVOLUTION_API_URL || 'https://oraclewa-imperio-production.up.railway.app';
    this.apiKey = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'broadcast-imperio-hoje';
    
    // Configurações anti-ban
    this.antiBreachConfig = {
      minDelay: 8000,     // 8 segundos mínimo  
      maxDelay: 15000,    // 15 segundos máximo
      batchSize: 8,       // 8 mensagens por lote (mais conservador)
      batchBreak: 420000  // 7 minutos entre lotes
    };
  }

  // Processar arquivo CSV
  processCSVFile(csvPath) {
    try {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const contacts = [];
      
      // Pular primeira linha (cabeçalho)
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length >= 2) {
          const name = columns[0];
          const phone = columns[1].replace(/\D/g, ''); // Só números
          
          // Validar número brasileiro (10-13 dígitos)
          if (name && phone && phone.length >= 10 && phone.length <= 13) {
            contacts.push({
              name: name,
              phone: phone,
              // Campos adicionais se existirem no CSV
              email: columns[2] || '',
              city: columns[3] || ''
            });
          }
        }
      }
      
      logger.info(`CSV processado: ${contacts.length} contatos válidos de ${lines.length - 1} linhas`);
      return contacts;
    } catch (error) {
      logger.error('Erro ao processar CSV:', error);
      throw new Error(`Falha ao ler CSV: ${error.message}`);
    }
  }

  // Carregar imagem base64 (nossa logo já convertida)
  loadImageBase64() {
    try {
      const imagePath = path.join(__dirname, '..', '..', '..', '..', 'oraclewa-logo-base64.txt');
      const base64Data = fs.readFileSync(imagePath, 'utf8');
      return base64Data;
    } catch (error) {
      logger.warn('Não foi possível carregar imagem base64, continuando só com texto');
      return null;
    }
  }

  // Personalizar mensagem para cada contato
  personalizeMessage(template, contact) {
    return template
      .replace(/{NOME}/g, contact.name)
      .replace(/{nome}/g, contact.name.toLowerCase())
      .replace(/{PRIMEIRO_NOME}/g, contact.name.split(' ')[0])
      .replace(/{primeiro_nome}/g, contact.name.split(' ')[0].toLowerCase())
      .replace(/{CIDADE}/g, contact.city || 'sua cidade')
      .replace(/{EMAIL}/g, contact.email || '');
  }

  // Delay aleatório anti-ban
  getRandomDelay() {
    const { minDelay, maxDelay } = this.antiBreachConfig;
    return Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
  }

  // Enviar mensagem individual
  async sendSingleMessage(contact, message, imageBase64 = null) {
    try {
      const endpoint = imageBase64 ? 
        `/message/sendMedia/${this.instanceName}` : 
        `/message/sendText/${this.instanceName}`;
      
      const payload = imageBase64 ? {
        number: contact.phone,
        media: imageBase64,
        caption: message,
        fileName: 'imperio-promocao.png'
      } : {
        number: contact.phone,
        text: message
      };

      const response = await fetch(`${this.evolutionUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          contact: contact,
          messageId: data.key?.id || null,
          data: data
        };
      } else {
        const errorData = await response.text();
        return {
          success: false,
          contact: contact,
          error: `HTTP ${response.status}: ${errorData}`
        };
      }
    } catch (error) {
      return {
        success: false,
        contact: contact,
        error: error.message
      };
    }
  }

  // Executar broadcast completo
  async executeBroadcast(csvPath, messageTemplate, options = {}) {
    const startTime = new Date();
    logger.info('🚀 INICIANDO BROADCAST CSV - EVOLUTION + BAILEYS');
    logger.info('=' .repeat(60));

    try {
      // 1. Processar CSV
      const contacts = this.processCSVFile(csvPath);
      if (contacts.length === 0) {
        throw new Error('Nenhum contato válido encontrado no CSV');
      }

      // 2. Carregar imagem (opcional)
      const imageBase64 = options.withImage !== false ? this.loadImageBase64() : null;
      const imageStatus = imageBase64 ? '🖼️ COM IMAGEM' : '📝 SÓ TEXTO';

      // 3. Estatísticas
      const stats = {
        total: contacts.length,
        sent: 0,
        failed: 0,
        results: []
      };

      logger.info(`📊 CONFIGURAÇÃO DO BROADCAST:`);
      logger.info(`📱 Total de contatos: ${contacts.length}`);
      logger.info(`📤 Tipo de envio: ${imageStatus}`);
      logger.info(`⏱️ Delay entre envios: ${this.antiBreachConfig.minDelay/1000}s - ${this.antiBreachConfig.maxDelay/1000}s`);
      logger.info(`📦 Tamanho do lote: ${this.antiBreachConfig.batchSize}`);
      logger.info(`🛑 Pausa entre lotes: ${this.antiBreachConfig.batchBreak/60000} minutos`);
      logger.info('=' .repeat(60));

      // 4. Processar em lotes
      const totalBatches = Math.ceil(contacts.length / this.antiBreachConfig.batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * this.antiBreachConfig.batchSize;
        const endIdx = Math.min(startIdx + this.antiBreachConfig.batchSize, contacts.length);
        const batch = contacts.slice(startIdx, endIdx);

        logger.info(`\n📦 LOTE ${batchIndex + 1}/${totalBatches}`);
        logger.info(`📱 Processando contatos ${startIdx + 1} - ${endIdx}`);

        // Processar contatos do lote
        for (let i = 0; i < batch.length; i++) {
          const contact = batch[i];
          const personalizedMessage = this.personalizeMessage(messageTemplate, contact);

          logger.info(`📤 [${stats.sent + stats.failed + 1}/${contacts.length}] Enviando para ${contact.name} (${contact.phone})...`);

          const result = await this.sendSingleMessage(contact, personalizedMessage, imageBase64);
          stats.results.push(result);

          if (result.success) {
            logger.info(`✅ ${contact.name} - Enviado com sucesso`);
            stats.sent++;
          } else {
            logger.error(`❌ ${contact.name} - Falha: ${result.error}`);
            stats.failed++;
          }

          // Delay anti-ban (exceto no último da lista)
          if (stats.sent + stats.failed < contacts.length) {
            const delay = this.getRandomDelay();
            logger.info(`⏳ Aguardando ${(delay/1000).toFixed(1)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Pausa entre lotes (exceto no último)
        if (batchIndex < totalBatches - 1) {
          logger.info(`\n🛑 PAUSA ESTRATÉGICA: ${this.antiBreachConfig.batchBreak/60000} minutos`);
          logger.info(`💤 Aguardando para continuar com lote ${batchIndex + 2}...`);
          await new Promise(resolve => setTimeout(resolve, this.antiBreachConfig.batchBreak));
        }
      }

      // 5. Relatório final
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000 / 60);
      const successRate = ((stats.sent / stats.total) * 100).toFixed(1);

      logger.info('\n' + '=' .repeat(60));
      logger.info('📊 RELATÓRIO FINAL - BROADCAST IMPÉRIO');
      logger.info('=' .repeat(60));
      logger.info(`✅ Enviados com sucesso: ${stats.sent}`);
      logger.info(`❌ Falharam: ${stats.failed}`);
      logger.info(`📈 Taxa de sucesso: ${successRate}%`);
      logger.info(`⏱️ Tempo total: ${duration} minutos`);
      logger.info(`📱 Velocidade média: ${(stats.sent / Math.max(duration, 1)).toFixed(1)} msgs/min`);
      logger.info(`🎯 Instância usada: ${this.instanceName}`);
      logger.info('=' .repeat(60));

      return {
        success: true,
        stats: stats,
        duration: duration,
        successRate: parseFloat(successRate)
      };

    } catch (error) {
      logger.error('💥 Erro no broadcast:', error);
      throw error;
    }
  }

  // Template padrão para Império
  static getDefaultTemplate() {
    return `🎯 Olá *{PRIMEIRO_NOME}*!

🏆 Temos uma **OPORTUNIDADE EXCLUSIVA** para você!

💰 *Condições especiais* disponíveis apenas hoje
🎁 Não perca esta chance única de participar
📞 Entre em contato para conhecer todos os detalhes

✨ *Império Premiações - Realizando Sonhos* ✨

_Responda SAIR para não receber mais mensagens_`;
  }
}

// Export para uso externo
export default EvolutionCSVBroadcast;