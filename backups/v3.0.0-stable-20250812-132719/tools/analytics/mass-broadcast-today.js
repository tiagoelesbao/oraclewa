// 🚀 DISPARO EM MASSA - BASE DE 1000 LEADS HOJE
// Sistema otimizado para máxima entrega com chip atual

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const CONFIG = {
  // Instância para disparo
  evolutionUrl: 'http://128.140.7.154:8080',
  apiKey: 'Imperio2024@EvolutionSecure',
  instanceName: 'broadcast-imperio',
  
  // Arquivo CSV com leads
  csvPath: '../leads/leads-imperio-1000.csv',
  
  // Configuração de disparo (conservador para chip não aquecido)
  disparo: {
    mensagensPorHora: 30, // Começar conservador
    horasOperacao: 8, // 8h de trabalho (9h às 17h)
    intervaloPorMensagem: 2 * 60 * 1000, // 2 minutos entre mensagens
    loteSize: 10, // 10 mensagens por lote
    pausaEntreLotes: 5 * 60 * 1000, // 5 minutos entre lotes
  },
  
  // Templates de mensagens - focado em 90K
  templates: [
    `Fala {{nome}}! Você viu que o próximo título *está valendo 90K*? 🤑

Acabaram de reservar mas não foi pago ❌💸

Que tal fazer uma fézinha?
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`,

    `Boas Notícias {{nome}}! O *Título de 90k* acaba de ser reservado mas não foi pago ❌💸

Para garantir sua chance acesse nosso site agora mesmo:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`,

    `Para qual cidade será que vai o Título Premiado valendo 90k? 🤑

Para garantir sua chance acesse nosso site agora mesmo:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`,

    `{{nome}}, alguém acabou de desistir do *prêmio de 90K*! 💰

A vaga está aberta novamente! Corre que acaba rápido:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`,

    `⚡ URGENTE {{nome}}! Título de 90 MIL liberado há 5 minutos!

Última pessoa cancelou o pagamento. Aproveite:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`,

    `{{nome}}, imagina ganhar 90K ainda essa semana? 🤩

Tem vaga sobrando no título principal! Garanta já:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB`
  ]
};

class MassBroadcaster {
  constructor() {
    this.startTime = new Date();
    this.leads = [];
    this.progress = {
      total: 0,
      enviadas: 0,
      sucessos: 0,
      falhas: 0,
      taxaSucesso: 0
    };
    this.resultados = [];
    this.pausado = false;
  }
  
  // 📄 Carregar leads do CSV
  async carregarLeads() {
    try {
      console.log('📄 Carregando leads do CSV...');
      
      const csvPath = path.join(process.cwd(), CONFIG.csvPath);
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header
      const dataLines = lines.slice(1);
      
      this.leads = dataLines.map((line, index) => {
        const [nome, telefone] = line.split(';').map(item => item.trim()); // Mudança: split por ; ao invés de ,
        return {
          id: index + 1,
          nome: nome || `Lead ${index + 1}`,
          telefone: telefone || '',
          status: 'pendente'
        };
      }).filter(lead => lead.telefone); // Remove leads sem telefone
      
      this.progress.total = this.leads.length;
      
      console.log(`✅ ${this.leads.length} leads carregados com sucesso`);
      console.log(`📊 Exemplo: ${this.leads[0]?.nome} - ${this.leads[0]?.telefone}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar CSV:', error.message);
      return false;
    }
  }
  
  // 📱 Verificar instância
  async verificarInstancia() {
    try {
      console.log(`🔍 Verificando instância ${CONFIG.instanceName}...`);
      
      const response = await axios.get(
        `${CONFIG.evolutionUrl}/instance/connectionState/${CONFIG.instanceName}`,
        {
          headers: { apikey: CONFIG.apiKey },
          timeout: 10000
        }
      );
      
      const state = response.data?.instance?.state;
      
      if (state === 'open') {
        console.log(`✅ Instância conectada e pronta`);
        return true;
      } else {
        console.log(`❌ Instância não conectada: ${state}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar instância:', error.message);
      return false;
    }
  }
  
  // 📝 Gerar mensagem personalizada
  gerarMensagem(lead) {
    const template = CONFIG.templates[Math.floor(Math.random() * CONFIG.templates.length)];
    return template.replace(/\{\{nome\}\}/g, lead.nome);
  }
  
  // 📤 Enviar mensagem individual
  async enviarMensagem(lead) {
    try {
      const mensagem = this.gerarMensagem(lead);
      const startTime = Date.now();
      
      const response = await axios.post(
        `${CONFIG.evolutionUrl}/message/sendText/${CONFIG.instanceName}`,
        {
          number: lead.telefone,
          text: mensagem,
          delay: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.apiKey
          },
          timeout: 30000
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      const resultado = {
        leadId: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        sucesso: true,
        messageId: response.data?.key?.id,
        responseTime,
        timestamp: new Date().toISOString()
      };
      
      this.progress.sucessos++;
      lead.status = 'enviada';
      
      return resultado;
      
    } catch (error) {
      const resultado = {
        leadId: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        sucesso: false,
        erro: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.progress.falhas++;
      lead.status = 'falha';
      
      return resultado;
    }
  }
  
  // 📊 Atualizar progresso
  atualizarProgresso() {
    this.progress.enviadas = this.progress.sucessos + this.progress.falhas;
    this.progress.taxaSucesso = this.progress.enviadas > 0 ? 
      (this.progress.sucessos / this.progress.enviadas * 100).toFixed(1) : 0;
  }
  
  // 🛡️ Monitorar saúde do disparo
  monitorarSaude() {
    const ultimos20 = this.resultados.slice(-20);
    
    if (ultimos20.length < 10) return { ok: true };
    
    const falhasRecentes = ultimos20.filter(r => !r.sucesso).length;
    const taxaFalhas = (falhasRecentes / ultimos20.length) * 100;
    
    const tempoMedio = ultimos20
      .filter(r => r.sucesso && r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / ultimos20.filter(r => r.sucesso).length;
    
    return {
      ok: taxaFalhas < 30 && tempoMedio < 10000,
      taxaFalhas: taxaFalhas.toFixed(1),
      tempoMedio: Math.round(tempoMedio || 0),
      alerta: taxaFalhas >= 30 ? 'Alta taxa de falhas' : tempoMedio >= 10000 ? 'Resposta muito lenta' : null
    };
  }
  
  // 🚀 Executar disparo em massa
  async executarDisparo() {
    console.log(`🚀 === INICIANDO DISPARO EM MASSA ===`);
    console.log(`📊 Total de leads: ${this.progress.total}`);
    console.log(`⚡ Velocidade: ${CONFIG.disparo.mensagensPorHora} msgs/hora`);
    console.log(`⏱️ Intervalo: ${CONFIG.disparo.intervaloPorMensagem/1000}s entre mensagens`);
    console.log(`🎯 Meta: Disparar para todos hoje\\n`);
    
    let leadIndex = 0;
    let loteAtual = 0;
    
    while (leadIndex < this.leads.length && !this.pausado) {
      const lead = this.leads[leadIndex];
      
      console.log(`📤 [${leadIndex + 1}/${this.leads.length}] Enviando para ${lead.nome} (${lead.telefone.substring(0,8)}...)`);
      
      const resultado = await this.enviarMensagem(lead);
      this.resultados.push(resultado);
      
      if (resultado.sucesso) {
        console.log(`   ✅ Sucesso (${resultado.responseTime}ms)`);
      } else {
        console.log(`   ❌ Falha: ${resultado.erro.substring(0,50)}...`);
      }
      
      this.atualizarProgresso();
      leadIndex++;
      loteAtual++;
      
      // Progress report a cada 10 mensagens
      if (leadIndex % 10 === 0) {
        console.log(`\\n📊 === PROGRESS REPORT ===`);
        console.log(`📈 Enviadas: ${this.progress.enviadas}/${this.progress.total}`);
        console.log(`✅ Sucessos: ${this.progress.sucessos} (${this.progress.taxaSucesso}%)`);
        console.log(`❌ Falhas: ${this.progress.falhas}`);
        console.log(`⏱️ Tempo decorrido: ${Math.round((Date.now() - this.startTime) / 1000 / 60)}min\\n`);
        
        // Verificar saúde
        const saude = this.monitorarSaude();
        if (!saude.ok) {
          console.log(`🚨 ALERTA: ${saude.alerta}`);
          console.log(`📊 Taxa falhas: ${saude.taxaFalhas}%`);
          console.log(`⏱️ Tempo médio: ${saude.tempoMedio}ms`);
          
          if (saude.taxaFalhas > 50) {
            console.log(`\\n🛑 PAUSANDO DISPARO POR SEGURANÇA`);
            this.pausado = true;
            break;
          }
        }
      }
      
      // Pausa entre lotes
      if (loteAtual >= CONFIG.disparo.loteSize && leadIndex < this.leads.length) {
        console.log(`\\n⏸️ Pausa entre lotes (${CONFIG.disparo.pausaEntreLotes/1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.disparo.pausaEntreLotes));
        loteAtual = 0;
      } else if (leadIndex < this.leads.length) {
        // Pausa normal entre mensagens
        await new Promise(resolve => setTimeout(resolve, CONFIG.disparo.intervaloPorMensagem));
      }
    }
    
    return this.gerarRelatorioFinal();
  }
  
  // 📊 Relatório final
  gerarRelatorioFinal() {
    const duracaoMinutos = (Date.now() - this.startTime.getTime()) / 1000 / 60;
    const velocidadeReal = this.progress.enviadas / (duracaoMinutos / 60); // msgs/hora
    
    return {
      resumo: {
        totalLeads: this.progress.total,
        mensagensEnviadas: this.progress.enviadas,
        sucessos: this.progress.sucessos,
        falhas: this.progress.falhas,
        taxaSuccesso: `${this.progress.taxaSucesso}%`,
        duracaoMinutos: duracaoMinutos.toFixed(1),
        velocidadeReal: `${velocidadeReal.toFixed(1)} msgs/hora`,
        pausadoPorSeguranca: this.pausado
      },
      metricas: {
        conversaoEsperada: `${Math.round(this.progress.sucessos * 0.02)} leads interessados`,
        receitaEstimada: `R$ ${(this.progress.sucessos * 0.10).toFixed(2)}`,
        custoOperacional: `R$ ${(this.progress.enviadas * 0.05).toFixed(2)}`,
        lucroEstimado: `R$ ${(this.progress.sucessos * 0.05).toFixed(2)}`
      },
      proximosPassos: {
        otimizacao: velocidadeReal < 25 ? 'Aumentar velocidade' : 'Manter ritmo',
        escalonamento: this.progress.taxaSucesso > 85 ? 'Pode escalar para 1000+ leads' : 'Otimizar qualidade primeiro',
        investimento: this.progress.sucessos > 500 ? 'Considerar chip R$ 120' : 'Testar mais antes de investir'
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 🚀 Executar
async function main() {
  console.log(`🎯 === DISPARO EM MASSA - IMPÉRIO PRÊMIOS ===`);
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`);
  console.log(`🎯 Objetivo: Testar capacidade real com base de leads\\n`);
  
  const broadcaster = new MassBroadcaster();
  
  try {
    // Carregar leads
    const leadsOk = await broadcaster.carregarLeads();
    if (!leadsOk) {
      console.log(`\\n❌ Não foi possível carregar os leads do CSV`);
      console.log(`📄 Verifique o arquivo: ${CONFIG.csvPath}`);
      return;
    }
    
    // Verificar instância
    const instanciaOk = await broadcaster.verificarInstancia();
    if (!instanciaOk) {
      console.log(`\\n❌ Instância não está conectada`);
      console.log(`🔧 Conecte a instância ${CONFIG.instanceName} primeiro`);
      return;
    }
    
    console.log(`\\n✅ Tudo pronto para iniciar o disparo!`);
    console.log(`⚠️ ATENÇÃO: Mensagens reais serão enviadas!\\n`);
    
    // Executar disparo
    const relatorio = await broadcaster.executarDisparo();
    
    // Salvar relatório
    const filename = `mass-broadcast-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(relatorio, null, 2));
    
    console.log(`\\n🎉 === DISPARO CONCLUÍDO ===`);
    console.log(`📊 Total enviadas: ${relatorio.resumo.mensagensEnviadas}/${relatorio.resumo.totalLeads}`);
    console.log(`✅ Taxa de sucesso: ${relatorio.resumo.taxaSuccesso}`);
    console.log(`⚡ Velocidade real: ${relatorio.resumo.velocidadeReal}`);
    console.log(`💰 Receita estimada: ${relatorio.metricas.receitaEstimada}`);
    console.log(`🎯 Conversões esperadas: ${relatorio.metricas.conversaoEsperada}`);
    
    console.log(`\\n🚀 === PRÓXIMOS PASSOS ===`);
    console.log(`🔧 Otimização: ${relatorio.proximosPassos.otimizacao}`);
    console.log(`📈 Escalonamento: ${relatorio.proximosPassos.escalonamento}`);
    console.log(`💸 Investimento: ${relatorio.proximosPassos.investimento}`);
    
    console.log(`\\n💾 Relatório detalhado salvo: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Erro no disparo:`, error.message);
  }
}

main();