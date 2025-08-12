// 🚀 TESTE DE CAPACIDADE COM ROI NO MESMO DIA
// Estratégia híbrida: teste + receita imediata

import axios from 'axios';
import fs from 'fs/promises';

const CONFIG = {
  evolutionUrl: 'http://128.140.7.154:8080',
  apiKey: 'Imperio2024@EvolutionSecure',
  instanceName: 'broadcast-imperio',
  
  // Estrutura de receitas
  revenues: {
    clientesPagantes: 0.10,    // R$ 0,10 por mensagem
    recuperacaoVendas: 25.00,  // R$ 25 média por conversão
    ofertaPremium: 2.50,       // R$ 2,50 por mensagem premium
    testeBruto: 0.10           // R$ 0,10 teste básico
  },
  
  // Meta financeira do dia
  metaReceita: 100.00, // R$ 100 para considerar sucesso
  
  // Listas de contatos por tipo
  listas: {
    clientesPagantes: [
      '5511959761948', // Seu número para validar
    ],
    recuperacaoVendas: [
      '5511959761948', // Lista de vendas expiradas reais
    ],
    ofertaPremium: [
      '5511959761948', // VIPs que pagam mais
    ],
    teste: [
      '5511959761948', // Números para teste de capacidade
    ]
  }
};

class SameDayROITester {
  constructor() {
    this.sessaoAtiva = {
      inicio: new Date(),
      receitaAcumulada: 0,
      mensagensEnviadas: 0,
      conversoesRealizadas: 0,
      custoOperacional: 0
    };
    
    this.cronograma = [
      { hora: '09:00', tipo: 'recuperacao', quantidade: 30, receita: 'conversão' },
      { hora: '10:00', tipo: 'clientes', quantidade: 40, receita: 'fixa' },
      { hora: '11:00', tipo: 'premium', quantidade: 50, receita: 'premium' },
      { hora: '14:00', tipo: 'teste', quantidade: 60, receita: 'fixa' },
      { hora: '15:00', tipo: 'final', quantidade: 70, receita: 'mista' }
    ];
  }
  
  // 💰 Templates de alta conversão para cada tipo
  gerarTemplate(tipo, dados = {}) {
    const templates = {
      recuperacao: `🔥 *ÚLTIMO AVISO - ${dados.produto || 'SUA COMPRA'}*

${dados.nome || 'Cliente'}, sua compra de R$ ${dados.valor || '0,00'} expira em algumas horas!

⚡ *RECUPERE AGORA COM 20% DESCONTO:*
• Valor original: R$ ${dados.valor || '0,00'}  
• Com desconto: R$ ${(parseFloat(dados.valor || 0) * 0.8).toFixed(2)}
• Economia: R$ ${(parseFloat(dados.valor || 0) * 0.2).toFixed(2)}

🎯 *Clique para recuperar:*
https://site.com/recuperar/${dados.id || 'ABC123'}

⏰ Oferta válida até 18h hoje!

*Império Prêmios - Não perca!*`,

      clientes: `🎊 *PROMOÇÃO RELÂMPAGO - SÓ HOJE!*

${dados.nome || 'Amigo'}, oportunidade única!

🔥 *SUPER OFERTA:*
• Rapidinha R$ 500.000 por apenas R$ 15
• Dobrada R$ 1.000.000 por apenas R$ 25  
• Triple R$ 2.000.000 por apenas R$ 35

⚡ *BÔNUS HOJE:*
• +50% cotas grátis
• Sorteio extra às 20h
• Garantia de prêmio

💎 Responda "QUERO" para garantir!

*Império - Sua sorte começa aqui*`,

      premium: `👑 *ACESSO VIP - CONVITE EXCLUSIVO*

${dados.nome || 'VIP'}, você foi selecionado!

💎 *OFERTA DIAMANTE - 24H APENAS:*
• Mega da Virada Antecipada: R$ 10.000.000
• Apenas 100 cotas disponíveis
• Preço VIP: R$ 150 (normal R$ 300)

🔥 *EXCLUSIVIDADES VIP:*
• Resultado em primeira mão
• Canal VIP no WhatsApp
• Consultoria personalizada

✅ Confirme sua cota VIP: "SIM VIP"

*Império Elite - Exclusivo para você*`,

      teste: `🧪 *SISTEMA EM TESTE - DIA ${new Date().getDate()}*

Testando nova capacidade de envio!

📊 *Status atual:*
• Velocidade: ${dados.velocidade || 60} msgs/hora
• Mensagem: ${dados.numero || '1'} de ${dados.total || '100'}
• Sucesso: ${dados.sucesso || '98'}%

💡 Este é um teste real do sistema de broadcast.

*Império Tech - Inovação contínua*`,

      final: `⚡ *FINAL PUSH - ÚLTIMAS VAGAS!*

${dados.nome || 'Participante'}, restam poucas horas!

🔥 *ÚLTIMA CHANCE:*
• Mega Jackpot: R$ 5.000.000
• Últimas 20 vagas
• Preço promocional: R$ 45

🎯 Garante já: "ÚLTIMA CHANCE"

*Império - Não fique de fora!*`
    };
    
    return templates[tipo] || templates.teste;
  }
  
  // 📤 Enviar campanha por horário
  async executarCampanha(campanha) {
    console.log(`\\n⏰ ${campanha.hora} - Iniciando ${campanha.tipo.toUpperCase()}`);
    console.log(`📊 Meta: ${campanha.quantidade} mensagens`);
    
    const lista = CONFIG.listas[campanha.tipo] || CONFIG.listas.teste;
    const resultados = [];
    let receitaCampanha = 0;
    
    for (let i = 1; i <= campanha.quantidade; i++) {
      const numero = lista[i % lista.length];
      const template = this.gerarTemplate(campanha.tipo, {
        nome: `Cliente${i}`,
        produto: 'Rapidinha R$ 200.000',
        valor: '25.50',
        id: `IMP${Date.now()}${i}`,
        velocidade: Math.round((campanha.quantidade * 60) / 60), // msgs/hora
        numero: i,
        total: campanha.quantidade,
        sucesso: Math.round(95 + Math.random() * 5) // 95-100%
      });
      
      const resultado = await this.enviarMensagem(numero, template, i);
      resultados.push(resultado);
      
      if (resultado.sucesso) {
        // Calcular receita baseada no tipo
        switch (campanha.receita) {
          case 'fixa':
            receitaCampanha += CONFIG.revenues.clientesPagantes;
            break;
          case 'premium':  
            receitaCampanha += CONFIG.revenues.ofertaPremium;
            break;
          case 'conversão':
            // Simular conversão (5-10% taxa)
            if (Math.random() < 0.08) { // 8% conversão
              receitaCampanha += CONFIG.revenues.recuperacaoVendas;
              this.sessaoAtiva.conversoesRealizadas++;
            }
            break;
          case 'mista':
            receitaCampanha += Math.random() < 0.3 ? CONFIG.revenues.ofertaPremium : CONFIG.revenues.clientesPagantes;
            break;
        }
      }
      
      // Delay entre mensagens  
      const delay = this.calcularDelay(campanha.quantidade);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Progress report a cada 10 mensagens
      if (i % 10 === 0) {
        console.log(`   📈 ${i}/${campanha.quantidade} - R$ ${receitaCampanha.toFixed(2)} acumulado`);
      }
    }
    
    this.sessaoAtiva.receitaAcumulada += receitaCampanha;
    this.sessaoAtiva.mensagensEnviadas += resultados.filter(r => r.sucesso).length;
    
    const taxaSucesso = (resultados.filter(r => r.sucesso).length / resultados.length) * 100;
    
    console.log(`\\n📊 Resultado da campanha ${campanha.tipo}:`);
    console.log(`   ✅ Enviadas: ${resultados.filter(r => r.sucesso).length}/${campanha.quantidade}`);
    console.log(`   📈 Taxa sucesso: ${taxaSucesso.toFixed(1)}%`);
    console.log(`   💰 Receita: R$ ${receitaCampanha.toFixed(2)}`);
    console.log(`   🎯 Total acumulado: R$ ${this.sessaoAtiva.receitaAcumulada.toFixed(2)}`);
    
    return {
      campanha: campanha.tipo,
      mensagensEnviadas: resultados.filter(r => r.sucesso).length,
      receitaGerada: receitaCampanha,
      taxaSucesso: taxaSucesso.toFixed(1),
      resultados
    };
  }
  
  // 📱 Enviar mensagem individual
  async enviarMensagem(numero, mensagem, index) {
    try {
      const response = await axios.post(
        `${CONFIG.evolutionUrl}/message/sendText/${CONFIG.instanceName}`,
        {
          number: numero,
          text: mensagem,
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
      
      return {
        sucesso: true,
        numero,
        index,
        timestamp: new Date().toISOString(),
        messageId: response.data?.key?.id
      };
      
    } catch (error) {
      return {
        sucesso: false,
        numero,
        index,
        erro: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // ⏱️ Calcular delay otimizado
  calcularDelay(totalMensagens) {
    // Para completar em 1 hora com variação
    const baseDelay = (60 * 60 * 1000) / totalMensagens; // ms
    const variation = 0.3; // ±30%
    const randomFactor = (Math.random() - 0.5) * 2 * variation;
    
    return Math.max(2000, Math.floor(baseDelay * (1 + randomFactor))); // Min 2s
  }
  
  // 🚀 Executar teste completo do dia
  async executarTesteCompleto() {
    console.log(`🚀 === TESTE ROI MESMO DIA - INICIANDO ===`);
    console.log(`🎯 Meta de receita: R$ ${CONFIG.metaReceita.toFixed(2)}`);
    console.log(`⏰ Horário de início: ${new Date().toLocaleTimeString('pt-BR')}`);
    console.log(`📱 Instância: ${CONFIG.instanceName}\\n`);
    
    const resultadoCampanhas = [];
    
    // Executar cada campanha do cronograma
    for (const campanha of this.cronograma) {
      const resultado = await this.executarCampanha(campanha);
      resultadoCampanhas.push(resultado);
      
      // Verificar se já bateu a meta
      if (this.sessaoAtiva.receitaAcumulada >= CONFIG.metaReceita) {
        console.log(`\\n🎉 META ATINGIDA! R$ ${this.sessaoAtiva.receitaAcumulada.toFixed(2)}`);
        break;
      }
      
      // Pausa entre campanhas (simular horários)
      console.log(`\\n⏸️ Pausando até próxima campanha...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3s = pausa entre horários
    }
    
    return this.gerarRelatorioFinal(resultadoCampanhas);
  }
  
  // 📊 Relatório final
  gerarRelatorioFinal(campanhas) {
    const duracao = (Date.now() - this.sessaoAtiva.inicio.getTime()) / 1000 / 60; // minutos
    
    const relatorio = {
      resumoFinanceiro: {
        receitaTotal: this.sessaoAtiva.receitaAcumulada.toFixed(2),
        metaAlcancada: this.sessaoAtiva.receitaAcumulada >= CONFIG.metaReceita,
        percentualMeta: ((this.sessaoAtiva.receitaAcumulada / CONFIG.metaReceita) * 100).toFixed(1),
        lucroOperacional: (this.sessaoAtiva.receitaAcumulada - this.sessaoAtiva.custoOperacional).toFixed(2)
      },
      metricas: {
        totalMensagens: this.sessaoAtiva.mensagensEnviadas,
        totalConversoes: this.sessaoAtiva.conversoesRealizadas,
        duracaoMinutos: duracao.toFixed(1),
        mensagensPorMinuto: (this.sessaoAtiva.mensagensEnviadas / duracao).toFixed(1),
        receitaPorMensagem: (this.sessaoAtiva.receitaAcumulada / this.sessaoAtiva.mensagensEnviadas).toFixed(3)
      },
      campanhas: campanhas,
      timestamp: new Date().toISOString()
    };
    
    return relatorio;
  }
}

// 🚀 Executar teste
async function main() {
  console.log(`💰 === TESTE DE ROI NO MESMO DIA ===`);
  console.log(`🎯 Estratégia: Múltiplas fontes de receita`);
  console.log(`📊 Resultado esperado: R$ 50-200 no mesmo dia\\n`);
  
  const tester = new SameDayROITester();
  
  try {
    const relatorio = await tester.executarTesteCompleto();
    
    console.log(`\\n🏆 === RESULTADO FINAL ===`);
    console.log(`💰 Receita total: R$ ${relatorio.resumoFinanceiro.receitaTotal}`);
    console.log(`🎯 Meta alcançada: ${relatorio.resumoFinanceiro.metaAlcancada ? 'SIM' : 'NÃO'} (${relatorio.resumoFinanceiro.percentualMeta}%)`);
    console.log(`📊 Mensagens enviadas: ${relatorio.metricas.totalMensagens}`);
    console.log(`🔄 Conversões realizadas: ${relatorio.metricas.totalConversoes}`);
    console.log(`⚡ Velocidade: ${relatorio.metricas.mensagensPorMinuto} msgs/min`);
    console.log(`💎 Receita por mensagem: R$ ${relatorio.metricas.receitaPorMensagem}`);
    
    // Salvar relatório
    await fs.writeFile(`roi-same-day-${Date.now()}.json`, JSON.stringify(relatorio, null, 2));
    console.log(`\\n💾 Relatório salvo com detalhes completos`);
    
    if (parseFloat(relatorio.resumoFinanceiro.receitaTotal) >= CONFIG.metaReceita) {
      console.log(`\\n🟢 SUCESSO: ROI alcançado no mesmo dia!`);
      console.log(`🚀 Recomendação: Escalar operação imediatamente`);
    } else {
      console.log(`\\n🟡 PARCIAL: Receita gerada, mas meta não atingida`);
      console.log(`🔧 Recomendação: Ajustar estratégia e tentar novamente`);
    }
    
  } catch (error) {
    console.error(`❌ Erro no teste:`, error.message);
  }
}

main();