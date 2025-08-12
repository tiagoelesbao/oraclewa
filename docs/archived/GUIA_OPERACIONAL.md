# 🚀 GUIA OPERACIONAL - ORACLEWA IMPÉRIO

## 🎯 COMO USAR O SISTEMA COMPLETO

Este guia ensina como operar todos os componentes do sistema OracleWA Império.

---

## 📱 ACESSO AOS SISTEMAS

### 🖥️ **SERVIDOR HETZNER**
```bash
# Conectar ao servidor
ssh root@128.140.7.154
# Senha: KtwppRMpJfi3
# Diretório: /opt/whatsapp-imperio
```

### 🌐 **EVOLUTION API**
- **URL:** http://128.140.7.154:8080
- **API Key:** Imperio2024@EvolutionSecure
- **Instâncias:** imperio1, broadcast-imperio

### 🚂 **RAILWAY (APLICAÇÃO)**
- **URL:** https://railway.app/project/oraclewa-imperio
- **Deploy:** Automático via GitHub
- **Logs:** Tempo real disponível

---

## 🔄 SISTEMA DE RECUPERAÇÃO

### ✅ **STATUS E MONITORAMENTO**

**Verificar saúde das instâncias:**
```bash
# Imperio1 (Principal)
curl -X GET "http://128.140.7.154:8080/instance/connectionState/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"

# Broadcast
curl -X GET "http://128.140.7.154:8080/instance/connectionState/broadcast-imperio" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

**Testar webhook de recuperação:**
```bash
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/temp-order-paid" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.paid",
    "timestamp": "2025-08-07T12:00:00.000Z",
    "data": {
      "user": {
        "name": "Cliente Teste",
        "phone": "5511999999999",
        "email": "teste@email.com"
      },
      "product": {
        "title": "Rapidinha R$ 200.000,00"
      },
      "quantity": 5,
      "total": 25.50,
      "id": "TEST-001",
      "createdAt": "2025-08-07T12:00:00.000Z"
    }
  }'
```

### 🔧 **RESOLUÇÃO DE PROBLEMAS**

**Se instância desconectar:**
```bash
# Gerar novo QR Code
curl -X GET "http://128.140.7.154:8080/instance/connect/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"

# Escanear QR com WhatsApp do Império
```

**Se webhook não funcionar:**
1. Verificar logs no Railway
2. Testar conectividade da instância
3. Validar formato do payload
4. Verificar se Railway está online

---

## 📢 SISTEMA DE BROADCAST

### 🚀 **ENVIO SIMPLES**

**Mensagem de texto:**
```bash
curl -X POST "http://128.140.7.154:8080/message/sendText/broadcast-imperio" \
  -H "Content-Type: application/json" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -d '{
    "number": "5511999999999",
    "text": "Sua mensagem aqui",
    "delay": 1000
  }'
```

### 📋 **ENVIO EM MASSA VIA CSV**

**1. Preparar CSV:**
```csv
Nome,Telefone
João Silva,5511999999999
Maria Santos,5511888888888
Pedro Costa,5511777777777
```

**2. Executar broadcast:**
```bash
cd tools/
node test-broadcast.js
```

**3. Monitorar progresso:**
- Acompanhar logs no Railway
- Verificar taxa de entrega
- Observar possíveis erros

### 🛡️ **BOAS PRÁTICAS ANTI-BAN**

**✅ CONFIGURAÇÕES SEGURAS:**
- **Delay entre msgs:** 2-5 segundos
- **Lote máximo:** 10 mensagens
- **Pausa entre lotes:** 30-60 segundos
- **Máximo diário:** 300 mensagens/instância
- **Horário:** 9h-18h apenas

**❌ EVITAR:**
- Intervalos menores que 2 segundos
- Mais de 50 mensagens seguidas
- Mensagens idênticas
- Envios noturnos (22h-7h)
- Mais de 500 mensagens/dia

---

## 🧪 TESTE DE LIMITES DE CHIPS

### 📊 **EXECUTAR DESCOBERTA**

**Testar capacidade de chip R$ 120:**
```bash
cd tools/
node test-chip-limits.js
```

**O teste irá:**
- Simular 7 dias de envio gradual
- Descobrir limite máximo seguro
- Gerar relatório de capacidade
- Calcular ROI real do investimento

### 📈 **INTERPRETAR RESULTADOS**

**Cenários possíveis:**
```javascript
// Excelente (>150 msgs/hora)
ROI: 5 chips = R$ 600 para 1000/hora

// Bom (100-150 msgs/hora)  
ROI: 8 chips = R$ 960 para 1000/hora

// Regular (70-100 msgs/hora)
ROI: 12 chips = R$ 1.440 para 1000/hora

// Ruim (<70 msgs/hora)
ROI: Buscar alternativas
```

---

## 📊 MONITORAMENTO E MÉTRICAS

### 📈 **DASHBOARDS DISPONÍVEIS**

**1. Railway Logs:**
```
https://railway.app/project/oraclewa-imperio
→ Deployments → View Logs
```

**2. Evolution API Status:**
```
http://128.140.7.154:8080/manager
```

**3. Health Check:**
```bash
cd tools/
node health-check.js
```

### 🔍 **MÉTRICAS IMPORTANTES**

**Taxa de Entrega:**
- ✅ >95% = Excelente
- ⚠️ 85-95% = Bom
- ❌ <85% = Problema

**Tempo de Resposta:**
- ✅ <3s = Excelente  
- ⚠️ 3-8s = Aceitável
- ❌ >8s = Lento

**Conexões:**
- ✅ "open" = Conectado
- ⚠️ "connecting" = Reconectando
- ❌ "close" = Desconectado

---

## 🚨 SITUAÇÕES DE EMERGÊNCIA

### ⚡ **SISTEMA OFFLINE**

**1. Verificar Railway:**
```bash
# Se Railway estiver down
1. Aguardar restauração automática
2. Verificar status em status.railway.app
3. Fazer redeploy se necessário
```

**2. Verificar Hetzner:**
```bash
# Se servidor não responder
ssh root@128.140.7.154
# Se não conectar, problema de infraestrutura
```

**3. Evolution API problema:**
```bash
# Reiniciar container
docker restart evolution-imperio-container

# Recriar se necessário
docker stop evolution-imperio-container
docker rm evolution-imperio-container
# ... executar comando completo de criação
```

### 📱 **INSTÂNCIA BANIDA**

**Sintomas:**
- Mensagens não entregam
- Erro "account banned"
- QR Code não gera

**Solução:**
1. Criar nova instância com nome diferente
2. Usar novo chip/número
3. Aguardar 24-48h antes de ativar
4. Aplicar estratégias anti-ban mais rigorosas

---

## 🔄 ROTINA DE MANUTENÇÃO

### 📅 **DIÁRIA**
- [ ] Verificar status das instâncias
- [ ] Monitorar logs no Railway
- [ ] Confirmar entregas de webhooks
- [ ] Validar conexões WhatsApp

### 📅 **SEMANAL** 
- [ ] Analisar métricas de performance
- [ ] Backup de configurações
- [ ] Atualizar documentação se necessário
- [ ] Testar recuperação de desastres

### 📅 **MENSAL**
- [ ] Revisar estratégias anti-ban
- [ ] Analisar ROI do sistema
- [ ] Planejar melhorias
- [ ] Atualizar dependências

---

## 📚 COMANDOS ÚTEIS

### 🔧 **DESENVOLVIMENTO**
```bash
# Deploy manual
cd oraclewa
git add .
git commit -m "Update"
git push

# Logs locais
tail -f oraclewa/logs/combined.log

# Teste de conectividade
curl -I https://oraclewa-imperio-production.up.railway.app/health
```

### 📱 **WhatsApp**
```bash
# Listar instâncias
curl "http://128.140.7.154:8080/instance/fetchInstances" \
  -H "apikey: Imperio2024@EvolutionSecure"

# Buscar conversas
curl "http://128.140.7.154:8080/chat/findChats/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

---

## 🎯 CHECKLIST DE USO DIÁRIO

### ✅ **MANHÃ (9h)**
- [ ] Status das instâncias: OK
- [ ] Railway online: OK  
- [ ] Logs sem erros: OK
- [ ] Teste de envio: OK

### ✅ **TARDE (14h)**
- [ ] Monitorar broadcasts em andamento
- [ ] Verificar recuperações do dia
- [ ] Analisar métricas

### ✅ **NOITE (18h)**
- [ ] Relatório do dia
- [ ] Backup se necessário
- [ ] Planejar próximo dia

---

**🎯 Com este guia você tem controle total sobre o sistema OracleWA Império!**

*Última atualização: 07/08/2025*