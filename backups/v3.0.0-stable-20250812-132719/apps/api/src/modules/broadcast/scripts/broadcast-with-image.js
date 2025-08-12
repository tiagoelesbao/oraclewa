const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuração do Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://oraclewa-imperio-production.up.railway.app';
const API_KEY = process.env.EVOLUTION_API_KEY || 'Imperio2024@EvolutionSecure';
const INSTANCE_NAME = 'broadcast-imperio-hoje';

// Converter imagem para base64
function convertImageToBase64() {
    const imagePath = path.join(__dirname, '..', 'templates', 'images', 'ChatGPT Image 3 de jul. de 2025, 16_33_32.png');
    
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        return `data:image/png;base64,${base64Image}`;
    } catch (error) {
        console.error('Erro ao carregar imagem:', error.message);
        return null;
    }
}

// Função para enviar mensagem com imagem
async function sendBroadcastWithImage(phoneNumbers, message, caption) {
    const base64Image = convertImageToBase64();
    
    if (!base64Image) {
        console.error('Não foi possível carregar a imagem');
        return;
    }

    console.log('🚀 Iniciando broadcast com imagem...');
    console.log(`📱 Total de números: ${phoneNumbers.length}`);
    
    const results = [];
    
    for (let i = 0; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i];
        
        try {
            console.log(`📤 Enviando para ${phoneNumber} (${i + 1}/${phoneNumbers.length})`);
            
            const response = await axios.post(
                `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
                {
                    number: phoneNumber,
                    media: base64Image,
                    caption: caption,
                    fileName: 'oraclewa-logo.png'
                },
                {
                    headers: {
                        'apikey': API_KEY,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            if (response.data) {
                console.log(`✅ Enviado com sucesso para ${phoneNumber}`);
                results.push({ phone: phoneNumber, status: 'success', messageId: response.data.key?.id });
            }
            
            // Anti-ban: delay entre envios (3-7 segundos)
            const delay = Math.floor(Math.random() * 4000) + 3000;
            console.log(`⏳ Aguardando ${delay/1000}s antes do próximo envio...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
        } catch (error) {
            console.error(`❌ Erro ao enviar para ${phoneNumber}:`, error.response?.data?.message || error.message);
            results.push({ phone: phoneNumber, status: 'error', error: error.message });
            
            // Em caso de erro, aguardar mais tempo
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    // Relatório final
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`✅ Enviados com sucesso: ${successful}`);
    console.log(`❌ Falharam: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((successful / phoneNumbers.length) * 100).toFixed(1)}%`);
    
    return results;
}

// Função para teste com um número
async function testBroadcast() {
    const testMessage = `🎯 *OFERTA ESPECIAL IMPÉRIO*

🏆 Premiação exclusiva para você!

💰 Condições especiais disponíveis
📞 Entre em contato para mais detalhes

*Não perca esta oportunidade única!*`;

    // Substitua pelo seu número de teste
    const testNumbers = ['5511999999999']; // Formato: código país + DDD + número
    
    await sendBroadcastWithImage(testNumbers, testMessage, testMessage);
}

module.exports = {
    sendBroadcastWithImage,
    testBroadcast
};

// Se executado diretamente, roda o teste
if (require.main === module) {
    testBroadcast().catch(console.error);
}