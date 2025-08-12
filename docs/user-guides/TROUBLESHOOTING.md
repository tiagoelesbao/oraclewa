# 🔧 TROUBLESHOOTING - ORACLEWA IMPÉRIO

## 🎯 GUIA DE SOLUÇÃO DE PROBLEMAS

Soluções para os problemas mais comuns do sistema OracleWA Império.

---

## 🚨 PROBLEMAS CRÍTICOS

### ❌ **SISTEMA TOTALMENTE OFFLINE**

**Sintomas:**
- Webhook retorna erro 500
- Railway não responde
- Instâncias desconectadas

**Diagnóstico:**
```bash
# 1. Testar Railway
curl -I https://oraclewa-imperio-production.up.railway.app/health

# 2. Testar Hetzner  
curl -I http://128.140.7.154:8080

# 3. SSH no servidor
ssh root@128.140.7.154
```

**Soluções:**
```bash
# Se Railway down:
1. Aguardar restauração (geralmente <5min)
2. Verificar status.railway.app
3. Redeploy manual se necessário

# Se Hetzner down:
1. Reiniciar Evolution API
docker restart evolution-imperio-container

2. Se não resolver, recriar container
docker stop evolution-imperio-container && \
docker rm -f evolution-imperio-container && \
docker run -d --name evolution-imperio-container \
  --network oraclewa-network -p 8080:8080 \
  -e PORT=8080 -e LOG_LEVEL=warn \
  -e AUTHENTICATION_API_KEY="Imperio2024@EvolutionSecure" \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_URL="postgresql://postgres:password@postgres:5432/oraclewa?schema=evolution" \
  -v evolution_store:/evolution/store \
  evoapicloud/evolution-api:latest
```

---

## 📱 PROBLEMAS DE INSTÂNCIA

### ❌ **INSTÂNCIA DESCONECTADA**

**Sintomas:**
- Status: "connecting" ou "close" 
- Mensagens não enviam
- QR Code necessário

**Diagnóstico:**
```bash
# Verificar status
curl -X GET "http://128.140.7.154:8080/instance/connectionState/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

**Soluções:**
```bash
# 1. Gerar novo QR Code
curl -X GET "http://128.140.7.154:8080/instance/connect/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"

# 2. Escanear com WhatsApp
# Use o WhatsApp oficial do Império

# 3. Se persistir, recriar instância
curl -X DELETE "http://128.140.7.154:8080/instance/delete/imperio1" \
  -H "apikey: Imperio2024@EvolutionSecure"

curl -X POST "http://128.140.7.154:8080/instance/create" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "imperio1", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
```

### ❌ **LOOP INFINITO DE RECONEXÃO**

**Sintomas:**
- Logs spam: "CONNECTED TO WHATSAPP"
- CPU alta no servidor
- Instabilidade geral

**Solução:**
```bash
# Parar e recriar container completamente
ssh root@128.140.7.154
docker stop evolution-imperio-container
docker rm -f evolution-imperio-container

# Aguardar 30 segundos
sleep 30

# Recriar limpo
docker run -d --name evolution-imperio-container \
  --network oraclewa-network -p 8080:8080 \
  -e PORT=8080 -e LOG_LEVEL=warn \
  -e AUTHENTICATION_API_KEY="Imperio2024@EvolutionSecure" \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_URL="postgresql://postgres:password@postgres:5432/oraclewa?schema=evolution" \
  -v evolution_store:/evolution/store \
  evoapicloud/evolution-api:latest

# Aguardar estabilizar
sleep 30

# Criar nova instância
curl -X POST "http://128.140.7.154:8080/instance/create" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "imperio-main", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
```

---

## 📤 PROBLEMAS DE ENVIO

### ❌ **MENSAGENS NÃO CHEGAM**

**Sintomas:**
- API retorna sucesso
- Mas mensagens não aparecem no WhatsApp
- Status "PENDING" permanente

**Diagnóstico:**
```bash
# 1. Verificar status da instância
curl -X GET "http://128.140.7.154:8080/instance/connectionState/broadcast-imperio" \
  -H "apikey: Imperio2024@EvolutionSecure"

# 2. Testar com seu próprio número
curl -X POST "http://128.140.7.154:8080/message/sendText/broadcast-imperio" \
  -H "Content-Type: application/json" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -d '{"number": "5511959761948", "text": "Teste", "delay": 1000}'
```

**Soluções:**
1. **Formato do número:** Usar 55 + DDD + número (sem espaços)
2. **Shadowban:** Reduzir velocidade de envio
3. **Instância:** Reconectar se necessário
4. **Delay:** Aumentar para 5-10 segundos

### ❌ **ERRO 413 (PAYLOAD TOO LARGE)**

**Sintomas:**
- Erro ao enviar imagens
- "Request Entity Too Large"
- Falha em envio com mídia

**Solução:**
```bash
# 1. Reduzir tamanho da imagem (<500KB)
# 2. Usar URL externa ao invés de base64
# 3. Comprimir imagem antes de enviar

# Exemplo correto:
curl -X POST "http://128.140.7.154:8080/message/sendMedia/broadcast-imperio" \
  -H "Content-Type: application/json" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -d '{
    "number": "5511959761948",
    "mediatype": "image", 
    "mimetype": "image/jpeg",
    "media": "https://example.com/small-image.jpg",
    "caption": "Legenda"
  }'
```

---

## 🔄 PROBLEMAS DE WEBHOOK

### ❌ **WEBHOOK RETORNA ERRO 500**

**Sintomas:**
- Confirmações não funcionam
- Railway logs mostram erro
- Clientes não recebem confirmação

**Diagnóstico:**
```bash
# Testar webhook manualmente
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/temp-order-paid" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.paid",
    "timestamp": "2025-08-07T12:00:00.000Z", 
    "data": {
      "user": {"name": "Teste", "phone": "5511999999999"},
      "product": {"title": "Teste"},
      "quantity": 1,
      "total": 10.50,
      "id": "TEST"
    }
  }'
```

**Soluções:**
1. **Verificar logs no Railway** - Erro específico
2. **Validar formato JSON** - Estrutura correta  
3. **Testar conexão instância** - WhatsApp conectado
4. **Redeploy se necessário** - Último recurso

### ❌ **VALORES R$ ,00 EM VEZ DE VALORES REAIS**

**✅ PROBLEMA JÁ CORRIGIDO**

Este problema foi identificado e corrigido em 07/08/2025. As causas eram:

1. **Templates com ",00" hardcoded** ✅ Corrigido
2. **Variações com valores fixos** ✅ Corrigido  
3. **messageProcessor usando metadata incompleto** ✅ Corrigido

**Se ainda aparecer:**
```bash
# 1. Verificar se deploy foi feito
git log --oneline -5

# 2. Redeploy forçado
cd oraclewa
git add .
git commit -m "Force redeploy"  
git push

# 3. Testar novamente
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/temp-order-paid" [...]
```

---

## 📊 PROBLEMAS DE PERFORMANCE

### ⚠️ **SISTEMA LENTO**

**Sintomas:**
- Mensagens demoram >10s para enviar
- Webhook timeout
- Logs com atraso

**Diagnóstico:**
```bash
# 1. CPU e memória do servidor
ssh root@128.140.7.154
top
free -h

# 2. Status dos containers  
docker stats

# 3. Conexão de rede
ping google.com
```

**Soluções:**
1. **Reduzir carga:** Menos mensagens simultâneas
2. **Reiniciar serviços:** Docker + Railway
3. **Upgrade servidor:** Se necessário
4. **Otimizar queries:** Banco de dados

### ⚠️ **MUITOS ERROS NOS LOGS**

**Sintomas:**  
- Logs cheios de warnings
- Erros de conexão frequentes
- Performance degradada

**Solução:**
```bash
# 1. Verificar logs específicos
ssh root@128.140.7.154
docker logs evolution-imperio-container --tail 100

# 2. Limpar logs antigos
docker system prune -f

# 3. Ajustar nível de log
# Modificar LOG_LEVEL=warn para error se necessário
```

---

## 🛡️ PROBLEMAS DE SEGURANÇA

### 🚨 **POSSÍVEL BAN/SHADOWBAN**

**Sintomas:**
- Taxa de entrega <70%
- Mensagens marcadas como spam
- Números bloqueando automaticamente

**Prevenção:**
```javascript
// Configurações anti-ban seguras:
{
  delayMin: 5000,        // 5s mínimo
  delayMax: 15000,       // 15s máximo  
  batchSize: 5,          // 5 msgs por lote
  batchPause: 300000,    // 5min entre lotes
  maxPerHour: 30,        // 30 msgs/hora máximo
  maxPerDay: 200         // 200 msgs/dia máximo
}
```

**Recuperação:**
1. **Parar envios** por 24-48h
2. **Trocar instância** se necessário
3. **Aplicar limites mais rígidos**
4. **Testar com números pequenos**

---

## 🔍 FERRAMENTAS DE DIAGNÓSTICO

### 📊 **HEALTH CHECK COMPLETO**

```bash
cd tools/
node health-check.js
```

### 📋 **COMANDOS DE DEBUG**

```bash
# Status Evolution API
curl "http://128.140.7.154:8080" -H "apikey: Imperio2024@EvolutionSecure"

# Listar instâncias
curl "http://128.140.7.154:8080/instance/fetchInstances" -H "apikey: Imperio2024@EvolutionSecure"  

# Status Railway
curl -I "https://oraclewa-imperio-production.up.railway.app/health"

# Logs em tempo real
# Railway Dashboard → Deployments → View Logs
```

---

## 📞 PROCESSO DE SUPORTE

### 🆘 **QUANDO CONTACTAR SUPORTE**

1. **Problema crítico** que afeta produção
2. **Soluções testadas** sem sucesso  
3. **Logs coletados** e analisados
4. **Impacto financeiro** significativo

### 📋 **INFORMAÇÕES PARA SUPORTE**

1. **Descrição do problema**
2. **Quando começou**
3. **Logs relevantes** 
4. **Passos já tentados**
5. **Impacto no negócio**

---

## ✅ CHECKLIST DE RESOLUÇÃO

### 📝 **ANTES DE REPORTAR PROBLEMA**

- [ ] Tentei reiniciar a instância
- [ ] Verifiquei logs no Railway
- [ ] Testei conexão SSH no Hetzner
- [ ] Consultei este guia de troubleshooting
- [ ] Documentei passos reproduzir problema

### 🔄 **APÓS RESOLVER PROBLEMA**

- [ ] Documentei a solução
- [ ] Testei para garantir funcionamento
- [ ] Atualizei monitoramento se necessário
- [ ] Planejei prevenção futura

---

**🎯 Na dúvida, sempre consulte os logs primeiro - eles contêm 90% das respostas!**

*Última atualização: 07/08/2025*