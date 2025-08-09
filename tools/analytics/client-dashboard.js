// 📊 DASHBOARD PARA APRESENTAR RESULTADOS AO CLIENTE
// Gera relatório visual e profissional

import fs from 'fs/promises';

class ClientDashboard {
  constructor(reportData) {
    this.data = reportData;
    this.timestamp = new Date().toLocaleString('pt-BR');
  }
  
  // 📊 Gerar dashboard em HTML
  generateHTML() {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Broadcast - Império Prêmios</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 10px; padding: 25px; text-align: center; border-left: 5px solid #3498db; }
        .metric-card.success { border-left-color: #27ae60; }
        .metric-card.warning { border-left-color: #f39c12; }
        .metric-card.info { border-left-color: #9b59b6; }
        .metric-value { font-size: 2.2em; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
        .metric-label { font-size: 0.9em; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; }
        .section { padding: 30px; border-top: 1px solid #ecf0f1; }
        .section h2 { color: #2c3e50; margin-bottom: 20px; font-size: 1.8em; }
        .progress-bar { background: #ecf0f1; border-radius: 10px; height: 20px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); border-radius: 10px; }
        .status-good { color: #27ae60; font-weight: bold; }
        .status-warning { color: #f39c12; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
        .recommendation { background: #e8f8f5; border: 1px solid #27ae60; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .recommendation h3 { color: #27ae60; margin-bottom: 10px; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .timestamp { font-size: 0.9em; opacity: 0.8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #3498db; color: white; }
        tr:nth-child(even) { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📡 Relatório de Broadcast</h1>
            <p>Sistema WhatsApp Broadcasting - Império Prêmios</p>
            <p class="timestamp">Gerado em: ${this.timestamp}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card success">
                <div class="metric-value">${this.data.resumo.mensagensEnviadas}</div>
                <div class="metric-label">Mensagens Enviadas</div>
            </div>
            <div class="metric-card success">
                <div class="metric-value">${this.data.resumo.taxaSuccesso}</div>
                <div class="metric-label">Taxa de Sucesso</div>
            </div>
            <div class="metric-card info">
                <div class="metric-value">${this.data.resumo.velocidadeReal}</div>
                <div class="metric-label">Velocidade Real</div>
            </div>
            <div class="metric-card warning">
                <div class="metric-value">${this.data.metricas.receitaEstimada}</div>
                <div class="metric-label">Receita Estimada</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Performance Detalhada</h2>
            
            <div style="margin: 20px 0;">
                <strong>Progresso do Envio:</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(this.data.resumo.mensagensEnviadas/this.data.resumo.totalLeads)*100}%"></div>
                </div>
                <p>${this.data.resumo.mensagensEnviadas} de ${this.data.resumo.totalLeads} mensagens (${((this.data.resumo.mensagensEnviadas/this.data.resumo.totalLeads)*100).toFixed(1)}%)</p>
            </div>
            
            <table>
                <tr>
                    <th>Métrica</th>
                    <th>Resultado</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>✅ Mensagens Entregues</td>
                    <td>${this.data.resumo.sucessos}</td>
                    <td><span class="status-good">EXCELENTE</span></td>
                </tr>
                <tr>
                    <td>❌ Falhas</td>
                    <td>${this.data.resumo.falhas}</td>
                    <td><span class="${this.data.resumo.falhas < this.data.resumo.sucessos * 0.1 ? 'status-good' : 'status-warning'}">
                        ${this.data.resumo.falhas < this.data.resumo.sucessos * 0.1 ? 'BAIXO' : 'ACEITÁVEL'}
                    </span></td>
                </tr>
                <tr>
                    <td>⏱️ Tempo de Execução</td>
                    <td>${this.data.resumo.duracaoMinutos} minutos</td>
                    <td><span class="status-good">EFICIENTE</span></td>
                </tr>
                <tr>
                    <td>🎯 Conversões Esperadas</td>
                    <td>${this.data.metricas.conversaoEsperada}</td>
                    <td><span class="status-good">PROMISSOR</span></td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>💰 Análise Financeira</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <h4>📈 Receita</h4>
                    <p><strong>Estimada:</strong> ${this.data.metricas.receitaEstimada}</p>
                    <p><strong>Por mensagem:</strong> R$ ${(parseFloat(this.data.metricas.receitaEstimada.replace('R$ ', '')) / this.data.resumo.sucessos).toFixed(3)}</p>
                </div>
                <div>
                    <h4>💸 Custos</h4>
                    <p><strong>Operacional:</strong> ${this.data.metricas.custoOperacional}</p>
                    <p><strong>Lucro líquido:</strong> ${this.data.metricas.lucroEstimado}</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚀 Próximos Passos</h2>
            
            <div class="recommendation">
                <h3>🔧 Otimização</h3>
                <p>${this.data.proximosPassos.otimizacao}</p>
            </div>
            
            <div class="recommendation">
                <h3>📈 Escalonamento</h3>
                <p>${this.data.proximosPassos.escalonamento}</p>
            </div>
            
            <div class="recommendation">
                <h3>💸 Investimento</h3>
                <p>${this.data.proximosPassos.investimento}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Resumo Executivo</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6;">
                <p><strong>Resultado:</strong> ${this.getOverallStatus()}</p>
                <p><strong>Performance:</strong> O sistema demonstrou ${this.getPerformanceLevel()} com taxa de sucesso de ${this.data.resumo.taxaSuccesso}.</p>
                <p><strong>Escalabilidade:</strong> ${this.getScalabilityAdvice()}</p>
                <p><strong>ROI:</strong> ${this.getROIAnalysis()}</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Império Prêmios - Sistema WhatsApp Broadcasting</strong></p>
            <p>Relatório gerado automaticamente pelo sistema OracleWA</p>
            <p class="timestamp">📅 ${this.timestamp}</p>
        </div>
    </div>
</body>
</html>`;
  }
  
  // 📊 Analisar status geral
  getOverallStatus() {
    const successRate = parseFloat(this.data.resumo.taxaSuccesso.replace('%', ''));
    if (successRate >= 90) return "EXCELENTE - Sistema operando no nível ideal";
    if (successRate >= 80) return "MUITO BOM - Performance acima da média";
    if (successRate >= 70) return "BOM - Performance satisfatória";
    return "ATENÇÃO - Performance abaixo do esperado";
  }
  
  // 📈 Nível de performance
  getPerformanceLevel() {
    const successRate = parseFloat(this.data.resumo.taxaSuccesso.replace('%', ''));
    if (successRate >= 95) return "performance excepcional";
    if (successRate >= 85) return "alta performance";
    if (successRate >= 75) return "performance sólida";
    return "performance moderada";
  }
  
  // 🚀 Conselho de escalabilidade
  getScalabilityAdvice() {
    const successRate = parseFloat(this.data.resumo.taxaSuccesso.replace('%', ''));
    const sent = this.data.resumo.sucessos;
    
    if (successRate >= 90 && sent >= 800) {
      return "Sistema pronto para escalar para 2000-5000 mensagens/dia com confiança.";
    } else if (successRate >= 80 && sent >= 600) {
      return "Pode escalar gradualmente para 1500-2000 mensagens/dia.";
    } else {
      return "Recomenda-se otimizar primeiro antes de escalar massivamente.";
    }
  }
  
  // 💰 Análise de ROI
  getROIAnalysis() {
    const receita = parseFloat(this.data.metricas.receitaEstimada.replace('R$ ', ''));
    const custo = parseFloat(this.data.metricas.custoOperacional.replace('R$ ', ''));
    const roi = ((receita - custo) / custo * 100).toFixed(1);
    
    if (roi > 100) return `ROI excelente de ${roi}% - operação muito lucrativa.`;
    if (roi > 50) return `ROI positivo de ${roi}% - operação rentável.`;
    if (roi > 0) return `ROI de ${roi}% - operação com margem pequena.`;
    return "ROI negativo - revisar estratégia.";
  }
  
  // 💾 Salvar dashboard
  async save(filename) {
    const html = this.generateHTML();
    await fs.writeFile(filename, html);
    return filename;
  }
}

// 🚀 Função para gerar dashboard a partir de arquivo JSON
async function generateDashboardFromReport(reportFile) {
  try {
    const reportData = JSON.parse(await fs.readFile(reportFile, 'utf-8'));
    const dashboard = new ClientDashboard(reportData);
    
    const htmlFile = reportFile.replace('.json', '-dashboard.html');
    await dashboard.save(htmlFile);
    
    console.log(`📊 Dashboard gerado: ${htmlFile}`);
    console.log(`🌐 Abra no navegador para apresentar ao cliente`);
    
    return htmlFile;
  } catch (error) {
    console.error('❌ Erro ao gerar dashboard:', error.message);
  }
}

// Exportar para uso
export { ClientDashboard, generateDashboardFromReport };

// Se executado diretamente, processar arquivo
if (process.argv[2]) {
  generateDashboardFromReport(process.argv[2]);
}