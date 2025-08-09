import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuração
const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://oraclewa-imperio-production.up.railway.app';
const API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
const INSTANCE_NAME = 'broadcast-imperio-hoje';

// Carregar imagem base64
function loadImageBase64() {
    try {
        const base64Path = path.join(__dirname, '..', '..', '..', 'oraclewa-logo-base64.txt');
        return fs.readFileSync(base64Path, 'utf8');
    } catch (error) {
        console.error('❌ Erro ao carregar imagem:', error.message);
        return null;
    }
}

// Processar CSV
function processCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) { // Pular cabeçalho
        const columns = lines[i].split(',');
        if (columns.length >= 2) {
            contacts.push({
                name: columns[0]?.trim().replace(/"/g, ''),
                phone: columns[1]?.trim().replace(/"/g, '').replace(/\D/g, ''), // Só números
            });
        }
    }
    
    return contacts.filter(contact => contact.name && contact.phone && contact.phone.length >= 10);
}

// Estratégia anti-ban
const ANTI_BAN_CONFIG = {
    minDelay: 5000,    // 5 segundos mínimo
    maxDelay: 12000,   // 12 segundos máximo
    batchSize: 10,     // 10 mensagens por lote
    batchBreak: 300000 // 5 minutos entre lotes
};

function getRandomDelay() {
    return Math.floor(Math.random() * (ANTI_BAN_CONFIG.maxDelay - ANTI_BAN_CONFIG.minDelay)) + ANTI_BAN_CONFIG.minDelay;
}

// Personalizar mensagem
function personalizeMessage(template, contact) {
    return template
        .replace('{NOME}', contact.name)
        .replace('{nome}', contact.name.toLowerCase())
        .replace('{NOME_PRIMEIRO}', contact.name.split(' ')[0]);
}

// Enviar broadcast
async function sendCSVBroadcast(csvFilePath, messageTemplate, useImage = true) {
    console.log('🚀 INICIANDO BROADCAST CSV - IMPÉRIO');
    console.log('=' .repeat(50));
    
    // Carregar CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const contacts = processCSV(csvContent);
    
    console.log(`📋 Contatos carregados: ${contacts.length}`);
    
    if (contacts.length === 0) {
        console.log('❌ Nenhum contato válido encontrado no CSV');
        return;
    }
    
    // Carregar imagem se necessário
    let imageBase64 = null;
    if (useImage) {
        imageBase64 = loadImageBase64();
        if (!imageBase64) {
            console.log('⚠️  Continuando sem imagem...');
            useImage = false;
        }
    }
    
    // Estatísticas
    const stats = {
        total: contacts.length,
        sent: 0,
        failed: 0,
        startTime: new Date()
    };
    
    console.log(`📤 Iniciando envios em lotes de ${ANTI_BAN_CONFIG.batchSize}`);
    console.log(`⏱️  Delay entre mensagens: ${ANTI_BAN_CONFIG.minDelay/1000}s - ${ANTI_BAN_CONFIG.maxDelay/1000}s`);
    console.log('=' .repeat(50));
    
    // Processar em lotes
    for (let batchIndex = 0; batchIndex < Math.ceil(contacts.length / ANTI_BAN_CONFIG.batchSize); batchIndex++) {
        const startIdx = batchIndex * ANTI_BAN_CONFIG.batchSize;
        const endIdx = Math.min(startIdx + ANTI_BAN_CONFIG.batchSize, contacts.length);
        const batch = contacts.slice(startIdx, endIdx);
        
        console.log(`\n📦 LOTE ${batchIndex + 1}/${Math.ceil(contacts.length / ANTI_BAN_CONFIG.batchSize)}`);
        console.log(`📱 Contatos: ${startIdx + 1} - ${endIdx}`);
        
        for (let i = 0; i < batch.length; i++) {
            const contact = batch[i];
            const personalizedMessage = personalizeMessage(messageTemplate, contact);
            
            try {
                console.log(`📤 Enviando para ${contact.name} (${contact.phone})...`);
                
                const payload = useImage ? {
                    number: contact.phone,
                    media: imageBase64,
                    caption: personalizedMessage,
                    fileName: 'imperio-promocao.png'
                } : {
                    number: contact.phone,
                    message: personalizedMessage
                };
                
                const endpoint = useImage ? 
                    `${EVOLUTION_URL}/message/sendMedia/${INSTANCE_NAME}` :
                    `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`;
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'apikey': API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    console.log(`✅ ${contact.name} - Sucesso`);
                    stats.sent++;
                } else {
                    console.log(`❌ ${contact.name} - Erro: ${response.status}`);
                    stats.failed++;
                }
                
            } catch (error) {
                console.log(`❌ ${contact.name} - Erro: ${error.message}`);
                stats.failed++;
            }
            
            // Delay anti-ban entre mensagens
            if (i < batch.length - 1) {
                const delay = getRandomDelay();
                console.log(`⏳ Aguardando ${(delay/1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // Pausa entre lotes (exceto no último)
        if (batchIndex < Math.ceil(contacts.length / ANTI_BAN_CONFIG.batchSize) - 1) {
            console.log(`\n🛑 PAUSA ENTRE LOTES: ${ANTI_BAN_CONFIG.batchBreak/60000} minutos`);
            console.log('💤 Aguardando para continuar...');
            await new Promise(resolve => setTimeout(resolve, ANTI_BAN_CONFIG.batchBreak));
        }
    }
    
    // Relatório final
    const endTime = new Date();
    const duration = Math.round((endTime - stats.startTime) / 1000 / 60);
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RELATÓRIO FINAL - BROADCAST IMPÉRIO');
    console.log('=' .repeat(50));
    console.log(`✅ Enviados com sucesso: ${stats.sent}`);
    console.log(`❌ Falharam: ${stats.failed}`);
    console.log(`📈 Taxa de sucesso: ${((stats.sent / stats.total) * 100).toFixed(1)}%`);
    console.log(`⏱️  Tempo total: ${duration} minutos`);
    console.log(`📱 Velocidade média: ${(stats.sent / duration).toFixed(1)} msgs/min`);
    console.log('=' .repeat(50));
}

// Template de mensagem padrão
const DEFAULT_MESSAGE_TEMPLATE = `🎯 Olá *{NOME}*!

🏆 Temos uma **OPORTUNIDADE EXCLUSIVA** para você!

💰 *Condições especiais* disponíveis apenas hoje
📞 Entre em contato para conhecer os detalhes
🎁 Não perca esta chance única!

*Império - Sempre pensando em você!*

_Responda SAIR para não receber mais mensagens_`;

// Exemplo de uso
export { sendCSVBroadcast, DEFAULT_MESSAGE_TEMPLATE };

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('📋 Para usar este script:');
    console.log('1. Prepare seu CSV com colunas: nome,telefone');
    console.log('2. Rode: node csv-broadcast.js caminho/para/arquivo.csv');
    console.log('\n⚠️  LEMBRE-SE: Substitua os números de teste pelos reais!');
}