# 👤 OracleWA SaaS - Operação Diária

> **Guia completo para usar o sistema no dia a dia**

## 🎯 Acesso ao Sistema

### URLs Principais
- **🎨 Dashboard:** http://localhost:3001 
- **🔧 API:** http://localhost:3000
- **📊 Health:** http://localhost:3000/health

### Login e Navegação
1. Acesse o dashboard em http://localhost:3001
2. Navegue pelas seções no menu lateral
3. Use o painel principal para visão geral

## 📊 Dashboard Principal

### **Métricas em Tempo Real**
- 📈 **Mensagens hoje** - Total de mensagens enviadas
- 📱 **Instâncias ativas** - Números WhatsApp conectados  
- 👥 **Clientes ativos** - Clientes com campanhas
- 💰 **ROI atual** - Retorno sobre investimento

### **Status das Instâncias**
```
🟢 Conectado    - Pronto para enviar
🟡 Aquecendo    - Em processo de maturação  
🔴 Desconectado - Precisa reconectar
⚠️  Atenção     - Taxa de erro alta
```

## 📱 Gestão de Instâncias

### **Verificar Status**
1. Acesse **Instâncias** no menu
2. Veja status de cada número
3. Clique em uma instância para detalhes

### **Conectar Nova Instância**
```bash
# Via linha de comando
cd scripts
node connect-new-instances.js
```

### **Reconectar Instância**
1. No dashboard, clique na instância
2. Clique em "Reconectar"
3. Escaneie o QR code no WhatsApp

### **Monitorar Saúde**
```bash
# Verificação rápida
./start.sh health

# Ou via API
curl http://localhost:3000/health
```

## 📡 Sistema de Broadcast

### **Criar Campanha**
1. Acesse **Broadcast** no menu
2. Clique em "Nova Campanha"
3. Faça upload do arquivo CSV
4. Selecione template de mensagem
5. Configure delay entre mensagens
6. Inicie a campanha

### **Formato do CSV**
```csv
nome,telefone,email
João Silva,5511999999999,joao@email.com
Maria Santos,5511888888888,maria@email.com
```

### **Templates de Mensagem**
- Acesse **Templates** no menu
- Crie templates reutilizáveis
- Use variáveis: `{nome}`, `{telefone}`
- Teste antes de usar em campanha

### **Monitorar Campanha**
- 📊 **Progresso** - Mensagens enviadas/total
- 📈 **Taxa de sucesso** - Entregas confirmadas
- ⏱️ **Tempo estimado** - Conclusão da campanha
- 🚨 **Erros** - Falhas e motivos

## 🔗 Webhooks e Integrações

### **Webhook de Carrinho Abandonado**
Quando um cliente abandona o carrinho:
```
E-commerce → Webhook → Sistema → Mensagem WhatsApp
```

**URL do Webhook:**
```
POST http://localhost:3000/webhook/order-expired
```

### **Webhook de Pagamento**
Quando um pagamento é confirmado:
```
Gateway → Webhook → Sistema → Mensagem de confirmação
```

### **Testar Webhooks**
```bash
# Teste carrinho abandonado
curl -X POST http://localhost:3000/webhook/order-expired \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "12345",
    "customerPhone": "5511999999999",
    "customerName": "João Silva",
    "orderValue": 299.90
  }'
```

## 🔥 Chip Maturation (Aquecimento)

### **Processo de Aquecimento**
```
Dia 0:    Standby (24h sem envios)
Dias 1-7: 10-30 mensagens/dia
Dias 8-14: 30-50 mensagens/dia  
Dias 15+: 70-100 mensagens/dia (maduro)
```

### **Adicionar Chip ao Pool**
```bash
# Via linha de comando
./add-chips.sh

# Ou manualmente
cd scripts/chip-maturation
node add-chips-to-pool.js
```

### **Monitorar Aquecimento**
1. Acesse **Chip Maturation** no menu
2. Veja status de cada chip
3. Acompanhe progresso diário

## 📈 Analytics e Relatórios

### **Métricas Principais**
- 📊 **Mensagens por dia** - Gráfico temporal
- 🎯 **Taxa de conversão** - Efetividade das campanhas
- 💰 **ROI por cliente** - Retorno financeiro
- 📱 **Performance por instância** - Qual número rende mais

### **Exportar Relatórios**
1. Acesse **Analytics** no menu
2. Selecione período desejado
3. Escolha métricas específicas
4. Clique em "Exportar PDF/CSV"

## 📋 Logs e Monitoramento

### **Visualizar Logs em Tempo Real**
```bash
# Todos os logs
./start.sh logs

# Logs específicos
tail -f logs/api/combined.log
tail -f logs/broadcast/broadcast.log
```

### **Tipos de Log**
- **INFO** - Operações normais
- **WARN** - Situações de atenção
- **ERROR** - Erros que precisam correção
- **DEBUG** - Informações técnicas

### **Filtrar Logs no Dashboard**
1. Acesse **Logs** no menu
2. Use filtros por:
   - Nível (INFO, WARN, ERROR)
   - Data/hora
   - Módulo (broadcast, webhook, etc)
   - Cliente específico

## ⚙️ Configurações

### **Configurar Evolution API**
1. Acesse **Settings** no menu
2. Aba "API"
3. Configure URL e API Key
4. Teste conexão

### **Configurar Anti-ban**
1. Aba "Segurança"
2. Configure delays entre mensagens
3. Defina limites diários
4. Ative verificações automáticas

### **Backup e Manutenção**
```bash
# Backup automático
cd scripts/backup
node create-backup.js

# Limpeza de logs antigos
cd scripts/maintenance  
node cleanup-logs.js
```

## 🚨 Rotina de Monitoramento

### **Diária (5 minutos)**
- [ ] Verificar dashboard principal
- [ ] Status das instâncias ativas
- [ ] Campanhas em andamento
- [ ] Alertas de erro

### **Semanal (15 minutos)**
- [ ] Revisar analytics da semana
- [ ] Verificar aquecimento de chips novos
- [ ] Limpar logs antigos
- [ ] Backup de configurações

### **Mensal (30 minutos)**
- [ ] Análise completa de ROI
- [ ] Otimização de templates
- [ ] Revisão de estratégia anti-ban
- [ ] Planejamento de novas campanhas

## 🆘 Solução Rápida de Problemas

### **Instância Desconectada**
```bash
# 1. Verificar status
./start.sh status

# 2. Tentar reconectar
curl -X POST http://localhost:3000/instance/connect/NOME_INSTANCIA

# 3. Se não funcionar, reiniciar
./start.sh restart
```

### **Mensagens não Entregam**
1. Verificar status da instância
2. Confirmar número está conectado
3. Testar com mensagem manual
4. Verificar logs de erro

### **Dashboard não Carrega**
```bash
# Verificar se frontend está rodando
curl http://localhost:3001

# Reiniciar se necessário
./start.sh restart
```

### **API não Responde**
```bash
# Testar health check
curl http://localhost:3000/health

# Ver logs de erro
./start.sh logs | grep ERROR

# Reiniciar sistema
./start.sh restart
```

## 📞 Escalação de Problemas

### **Nível 1 - Operador**
- Instâncias desconectadas
- Campanhas pausadas
- Erros de entrega

### **Nível 2 - Técnico**  
- Sistema não inicia
- Erros de API
- Problemas de integração

### **Nível 3 - Desenvolvedor**
- Bugs no código
- Performance degradada
- Arquitetura

## 💡 Dicas de Produtividade

### **Atalhos Úteis**
- `Ctrl + R` - Recarregar dashboard
- `F12` - Abrir ferramentas de desenvolvimento
- `Ctrl + Shift + I` - Logs do navegador

### **Comandos Rápidos**
```bash
# Status geral
./start.sh status

# Saúde do sistema  
./start.sh health

# Ver erros recentes
tail -n 50 logs/api/error.log
```

### **Bookmarks Recomendados**
- Dashboard: http://localhost:3001
- API Health: http://localhost:3000/health
- Evolution API: http://128.140.7.154:8080

---

**🎯 Este guia cobre 95% das operações diárias. Para problemas específicos, consulte o [Troubleshooting](./TROUBLESHOOTING.md)!**

*📅 Atualizado: 12/08/2025*