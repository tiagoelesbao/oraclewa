# 🚀 GUIA DE DEPLOYMENT ESCALÁVEL - OracleWA SaaS v3.0

## 🎯 OVERVIEW

Este guia detalha como fazer deploy e configurar novos clientes no **Sistema OracleWA SaaS v3.0 Escalável**, que suporta clientes ilimitados com isolamento total.

---

## 📋 PRÉ-REQUISITOS

### ✅ **INFRAESTRUTURA ATUAL**
- 🖥️ **Hetzner VPS:** 128.140.7.154 (Evolution API v2.3.1)
- 🚂 **Railway App:** oraclewa-imperio-production
- 📱 **Instâncias ativas:** imperio_main + broadcast-imperio-*
- 🔐 **API Key:** Imperio2024@EvolutionSecure

### 🛠️ **FERRAMENTAS NECESSÁRIAS**
```bash
# SSH Access
ssh root@128.140.7.154

# Git repo
https://github.com/tiagoelesbao/oraclewa

# Railway CLI (opcional)
npm install -g @railway/cli
```

---

## 🆕 ADICIONAR NOVO CLIENTE

### 1️⃣ **CRIAR ESTRUTURA DO CLIENTE**

**Estrutura necessária:**
```bash
mkdir -p clients/{novo_cliente}/{data/broadcast,templates/messages,templates/variations}
```

**Exemplo para cliente "loja_xyz":**
```bash
clients/loja_xyz/
├── config.json                    # Configuração principal
├── data/
│   └── broadcast/                 # CSVs para broadcast
├── templates/
│   ├── messages/                  # Templates .hbs
│   └── variations/                # Variações anti-spam
```

### 2️⃣ **CONFIGURAR CLIENT CONFIG.JSON**

**Criar:** `/clients/loja_xyz/config.json`
```json
{
  "id": "loja_xyz",
  "name": "Loja XYZ E-commerce",
  "description": "Sistema de recuperação para Loja XYZ",
  "status": "active",
  "provider": "evolution-baileys",
  "services": ["webhooks", "broadcast"],
  
  "features": {
    "buttons": true,
    "media": true,
    "typing": true,
    "presence": true
  },
  
  "limits": {
    "messagesPerDay": 3000,
    "messagesPerHour": 300,
    "instances": 3
  },
  
  "webhooks": {
    "orderExpired": {
      "enabled": true,
      "url": "https://oraclewa-imperio-production.up.railway.app/webhook/loja_xyz/order_expired",
      "template": "order_expired"
    },
    "orderPaid": {
      "enabled": true,
      "url": "https://oraclewa-imperio-production.up.railway.app/webhook/loja_xyz/order_paid",
      "template": "order_paid"
    }
  },
  
  "broadcast": {
    "enabled": true,
    "instances": [
      "broadcast-loja_xyz-1",
      "broadcast-loja_xyz-2"  
    ],
    "antibanStrategy": "advanced",
    "delays": {
      "min": 90000,
      "max": 150000
    }
  },
  
  "instances": {
    "loja_xyz_main": {
      "type": "recovery",
      "provider": "evolution-baileys",
      "status": "pending",
      "description": "Instância principal webhooks"
    },
    "broadcast-loja_xyz-1": {
      "type": "broadcast",
      "provider": "evolution-baileys", 
      "status": "pending",
      "description": "Broadcast 1/2"
    }
  },
  
  "webhookConfig": {
    "payloadTransformers": {
      "order_expired": {
        "userPhone": "data.customer.phone",
        "userName": "data.customer.name",
        "productTitle": "data.product.name",
        "orderTotal": "data.total"
      }
    }
  },
  
  "infrastructure": {
    "servers": {
      "hetzner": {
        "ip": "128.140.7.154",
        "port": 8080
      }
    }
  }
}
```

### 3️⃣ **CRIAR TEMPLATES PERSONALIZADOS**

**Template Order Expired:**
`/clients/loja_xyz/templates/messages/loja_xyz_order_expired.hbs`
```handlebars
🛍️ *Olá {{customerName}}!*

Notamos que você não finalizou sua compra na *Loja XYZ*:

📦 *{{productName}}*
💰 *Total: R$ {{totalValue}}*

⏰ *Sua reserva expira em breve!*

Finalize agora com desconto especial:
🎯 *5% OFF* usando o código: *VOLTA5*

{{finalizeButton}}
```

**Variações Anti-Spam:**
`/clients/loja_xyz/templates/variations/loja_xyz-order-expired-variations.js`
```javascript
module.exports = {
  greetings: [
    "🛍️ Olá {{customerName}}!",
    "👋 Oi {{customerName}}!",
    "🌟 E aí {{customerName}}!"
  ],
  
  urgency: [
    "⏰ Sua reserva expira em breve!",
    "🚨 Últimas unidades disponíveis!",
    "⏳ Oferta válida por tempo limitado!"
  ],
  
  discounts: [
    "🎯 5% OFF com VOLTA5",
    "💥 Desconto especial te esperando",
    "🔥 Oferta exclusiva para você"
  ]
};
```

### 4️⃣ **AUTO-DISCOVERY DO SISTEMA**

O sistema **detecta automaticamente** novos clientes:

```javascript
// ClientManager auto-carrega /clients/loja_xyz/
async loadAllClients() {
  const clientDirs = await fs.readdir('/clients/', { withFileTypes: true });
  // Sistema detecta 'loja_xyz' automaticamente
}
```

**Verificar se foi carregado:**
```bash
# Via API Health Check
curl https://oraclewa-imperio-production.up.railway.app/health

# Response deve incluir:
{
  "system": {
    "totalClients": 2,
    "loadedConfigs": ["imperio", "loja_xyz"]
  }
}
```

### 5️⃣ **CRIAR INSTÂNCIAS HETZNER**

**Via API Management:**
```bash
# Criar todas instâncias do cliente
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances/loja_xyz/create"

# Verificar criação
curl "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances"
```

**Ou diretamente no Hetzner:**
```bash
ssh root@128.140.7.154

# Usar script escalável (se disponível)
./evo-instances create loja_xyz 2

# Ou criar manualmente via Evolution API
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "loja_xyz_main",
    "token": "loja_xyz_main_token"
  }'
```

### 6️⃣ **CONECTAR INSTÂNCIAS WHATSAPP**

**Obter QR Codes:**
```bash
# Via API
curl "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances/loja_xyz_main/qrcode"

# Ou diretamente no Hetzner  
curl "http://128.140.7.154:8080/instance/connect/loja_xyz_main" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

**Conectar WhatsApp:**
1. Abrir WhatsApp Web
2. Escanear QR Code
3. Aguardar confirmação conexão

### 7️⃣ **TESTAR SISTEMA COMPLETO**

**Teste Webhook:**
```bash
# Debug endpoint (não envia WhatsApp)
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/debug/webhook/loja_xyz/order_expired" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "customer": {
        "name": "João Silva",
        "phone": "5511999999999"
      },
      "product": {
        "name": "Produto Teste"
      },
      "total": 99.90
    }
  }'
```

**Teste Real:**
```bash
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/loja_xyz/order_expired" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "customer": {
        "name": "João Teste",
        "phone": "SEU_NUMERO_TESTE"
      }
    }
  }'
```

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### 🛡️ **ANTI-BAN POR CLIENTE**

**Configurar delays específicos:**
```json
{
  "broadcast": {
    "antibanStrategy": "conservative", // conservative, balanced, aggressive
    "delays": {
      "min": 120000,  // 2 minutos mínimo
      "max": 300000   // 5 minutos máximo
    },
    "warmup": {
      "enabled": true,
      "messagesPerDay": 30,
      "daysRequired": 10
    }
  }
}
```

### 📱 **MÚLTIPLAS INSTÂNCIAS**

**Load balancing automático:**
```json
{
  "broadcast": {
    "instances": [
      "broadcast-loja_xyz-1",
      "broadcast-loja_xyz-2",
      "broadcast-loja_xyz-3"
    ],
    "loadBalancing": {
      "strategy": "round-robin",
      "maxPerInstance": 300,
      "dailyLimit": 900
    }
  }
}
```

### 🔄 **WEBHOOK PAYLOAD CUSTOMIZADO**

**Transformadores específicos:**
```json
{
  "webhookConfig": {
    "payloadTransformers": {
      "order_expired": {
        "userPhone": "customer.telefone",        // Campo customizado
        "userName": "customer.nome_completo",    // Campo customizado  
        "productTitle": "item.titulo",           // Campo customizado
        "orderTotal": "pedido.valor_total"       // Campo customizado
      }
    },
    "validation": {
      "requiredFields": ["userPhone", "userName"],
      "phoneFormat": "international"  // brazilian, international
    }
  }
}
```

---

## 📊 MONITORAMENTO E GESTÃO

### 📈 **APIS DE MANAGEMENT**

**Status do Cliente:**
```bash
curl "https://oraclewa-imperio-production.up.railway.app/api/management/clients/loja_xyz"
```

**Listar Arquivos Broadcast:**
```bash  
curl "https://oraclewa-imperio-production.up.railway.app/api/management/clients/loja_xyz/broadcast/files"
```

**Dashboard Geral:**
```bash
curl "https://oraclewa-imperio-production.up.railway.app/api/management/dashboard"
```

### 🔄 **RELOAD CONFIGURAÇÕES**

**Recarregar cliente específico:**
```bash
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/management/reload/clients"
```

**Recarregar templates:**
```bash
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/management/reload/templates"
```

---

## 🚨 TROUBLESHOOTING

### ❌ **CLIENTE NÃO CARREGOU**

**Verificar estrutura:**
```bash
# Estrutura deve existir:
clients/novo_cliente/config.json ✅
clients/novo_cliente/data/ ✅
clients/novo_cliente/templates/ ✅
```

**Verificar logs Railway:**
```bash
# Procurar por:
"✅ Client loaded: novo_cliente"
# ou  
"❌ Failed to load client: novo_cliente"
```

### ❌ **WEBHOOK NÃO FUNCIONA**

**1. Verificar URL:**
```bash
# URL deve seguir padrão:
https://oraclewa-imperio-production.up.railway.app/webhook/{clientId}/{type}
```

**2. Testar payload:**
```bash
curl -X POST "{URL}" -H "Content-Type: application/json" -d '{
  "data": {"customer": {"name": "Teste", "phone": "11999999999"}}
}'
```

**3. Verificar logs:**
```bash
# Logs Railway devem mostrar:
"📥 Processing webhook: novo_cliente/order_expired"
"✅ Webhook processed successfully"
```

### ❌ **INSTÂNCIA NÃO CONECTA**

**Verificar status:**
```bash
curl "http://128.140.7.154:8080/instance/fetchInstances" \
  -H "apikey: Imperio2024@EvolutionSecure" | grep "novo_cliente"
```

**Reconectar:**
```bash
curl "http://128.140.7.154:8080/instance/connect/novo_cliente_main" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

---

## ✅ CHECKLIST DE DEPLOY

### 📋 **PRÉ-DEPLOY**
- [ ] Estrutura `/clients/{cliente}/` criada
- [ ] `config.json` configurado e validado
- [ ] Templates personalizados criados  
- [ ] Variações anti-spam preparadas
- [ ] URLs webhook definidas

### 📋 **DEPLOY**
- [ ] Cliente auto-descoberto pelo sistema
- [ ] Instâncias Hetzner criadas
- [ ] QR Codes gerados e conectados
- [ ] Webhooks testados (debug + real)
- [ ] Templates carregados corretamente

### 📋 **PÓS-DEPLOY**
- [ ] Monitoramento configurado
- [ ] Logs funcionando
- [ ] Health check OK
- [ ] Backup configurações
- [ ] Documentação cliente atualizada

---

## 🎯 EXEMPLOS REAIS

### 🛒 **E-COMMERCE PADRÃO**

**Config para loja online típica:**
```json
{
  "id": "minha_loja",
  "name": "Minha Loja Online",
  "limits": {
    "messagesPerDay": 2000,
    "messagesPerHour": 200
  },
  "webhookConfig": {
    "payloadTransformers": {
      "order_expired": {
        "userPhone": "billing.phone",
        "userName": "billing.first_name",
        "productTitle": "line_items[0].name",
        "orderTotal": "total"
      }
    }
  }
}
```

### 🏢 **EMPRESA SERVIÇOS**

**Config para prestação de serviços:**
```json
{
  "id": "consultoria_xyz",  
  "name": "Consultoria XYZ",
  "limits": {
    "messagesPerDay": 500,
    "messagesPerHour": 50
  },
  "broadcast": {
    "antibanStrategy": "conservative",
    "delays": {
      "min": 180000,  // 3 minutos
      "max": 600000   // 10 minutos
    }
  }
}
```

### 🎯 **MARKETING DIGITAL**

**Config para agência:**
```json
{
  "id": "agencia_marketing",
  "name": "Agência Marketing Digital", 
  "limits": {
    "messagesPerDay": 5000,
    "messagesPerHour": 500
  },
  "broadcast": {
    "instances": [
      "broadcast-agencia_marketing-1",
      "broadcast-agencia_marketing-2", 
      "broadcast-agencia_marketing-3",
      "broadcast-agencia_marketing-4"
    ],
    "antibanStrategy": "aggressive"
  }
}
```

---

## 🚀 CONCLUSÃO

O **Sistema de Deploy Escalável** permite:

### ✅ **VANTAGENS**
- 🆕 **Novos clientes em <30 minutos**
- 🔄 **Zero downtime** - Sem interrupção outros clientes  
- 🛡️ **Isolamento total** - Configurações independentes
- 📊 **Monitoramento individual** - Métricas por cliente
- ⚡ **Auto-scaling** - Sistema cresce automaticamente

### 🎯 **PRÓXIMOS PASSOS**
1. Configurar primeiro novo cliente de teste
2. Validar todo fluxo de deploy
3. Criar automação adicional se necessário
4. Documentar procedimentos específicos por cliente
5. Estabelecer processo de onboarding

---

*📅 Guia criado: 11/08/2025*  
*✍️ Autor: Claude Code*  
*🚀 Versão: Sistema Escalável v3.0*  
*🎯 Status: Pronto para deploy ilimitado de clientes*