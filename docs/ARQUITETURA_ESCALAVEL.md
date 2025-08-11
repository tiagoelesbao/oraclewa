# 🏗️ ARQUITETURA ESCALÁVEL - OracleWA SaaS v3.0

## 🎯 VISÃO GERAL

O **OracleWA SaaS v3.0** implementa uma arquitetura **multi-tenant verdadeira** com separação total entre clientes, permitindo escalabilidade ilimitada sem modificações de código.

---

## 🏛️ ARQUITETURA MULTI-TENANT

### 📋 **COMPONENTES PRINCIPAIS**

```mermaid
graph TB
    subgraph "RAILWAY (oraclewa-imperio-production)"
        A[index-scalable.js<br/>🎯 Entry Point]
        B[ClientManager<br/>👥 Auto-discovery]
        C[WebhookHandler<br/>🔗 Processamento]
        D[TemplateManager<br/>📝 Templates]
        E[HetznerManager<br/>🖥️ Instâncias]
    end
    
    subgraph "CLIENTES ISOLADOS"
        F[/clients/imperio/<br/>📁 Config + Data]
        G[/clients/loja_xyz/<br/>📁 Config + Data]
        H[/clients/_template/<br/>📁 Template]
    end
    
    subgraph "HETZNER SERVER (128.140.7.154)"
        I[Evolution API<br/>📱 WhatsApp]
        J[PostgreSQL<br/>🗄️ Database]
        K[Instâncias Dinâmicas<br/>⚡ {client}_main, broadcast-{client}-*]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    B --> F
    B --> G
    B --> H
    E --> I
    E --> J
    E --> K
```

### 🔧 **FLUXO DE PROCESSAMENTO**

1. **📥 Webhook Recebido** → `POST /webhook/{clientId}/{type}`
2. **👥 Client Discovery** → `ClientManager.getClient(clientId)`
3. **🔍 Data Extraction** → `WebhookHandler.extractPayloadData()`
4. **✅ Validation** → `WebhookHandler.validatePayloadData()`
5. **📝 Template Loading** → `TemplateManager.generateMessage()`
6. **📱 WhatsApp Send** → `SimpleWhatsAppManager.sendMessage()`
7. **📊 Logging** → Logs centralizados Railway

---

## 👥 SISTEMA CLIENT MANAGER

### 📁 **ESTRUTURA POR CLIENTE**

```
/clients/
├── imperio/                    # Cliente Império
│   ├── config.json            # ✅ Configuração completa
│   ├── data/                  # 📊 Dados isolados
│   │   └── broadcast/         # 📢 CSVs específicos
│   └── templates/             # 📝 Templates personalizados
├── loja_xyz/                  # Novo cliente exemplo
│   ├── config.json            # 🆕 Config personalizada
│   ├── data/broadcast/        # 📊 Dados separados
│   └── templates/             # 📝 Templates únicos
└── _template/                 # 📋 Template base
```

### ⚙️ **AUTO-DISCOVERY DE CLIENTES**

**`/apps/api/src/core/client-manager.js:35`**
```javascript
async loadAllClients() {
  const clientDirs = await fs.readdir(this.clientsPath, { withFileTypes: true });
  for (const dir of clientDirs) {
    if (dir.isDirectory() && !dir.name.startsWith('_')) {
      await this.loadClient(dir.name);  // Auto-carrega clientes
    }
  }
}
```

**Benefícios:**
- ✅ **Zero configuração** - Sistema detecta automaticamente novos clientes
- 🔄 **Hot reload** - Adiciona clientes sem restart
- 🛡️ **Isolamento total** - Cada cliente completamente separado
- 📊 **Monitoramento independente** - Métricas por cliente

---

## 🔗 WEBHOOK HANDLER ESCALÁVEL

### 📥 **ENDPOINTS DISPONÍVEIS**

**Webhook Escalável (Recomendado):**
```bash
POST /webhook/{clientId}/{type}
# Exemplo: POST /webhook/imperio/order_expired
```

**Backward Compatibility (Império):**
```bash
POST /api/webhook/temp-order-paid
POST /api/webhook/temp-order-expired
```

**Debug & Testing:**
```bash
POST /api/debug/webhook/{clientId}/{type}
```

### 🔍 **PAYLOAD TRANSFORMATION**

**Configuração por cliente (`config.json`):**
```json
{
  "webhookConfig": {
    "payloadTransformers": {
      "order_expired": {
        "userPhone": "data.user.phone",
        "userName": "data.user.name", 
        "productTitle": "data.product.title",
        "orderTotal": "data.total"
      }
    },
    "validation": {
      "requiredFields": ["phone", "customerName"],
      "phoneFormat": "brazilian"
    }
  }
}
```

**Extração Dinâmica (`webhook-handler.js:119`):**
```javascript
extractPayloadData(client, webhookType, payload) {
  const transformers = client.webhookConfig?.payloadTransformers?.[webhookType];
  if (!transformers) return this.extractStandardPayload(payload);
  
  // Aplicar transformers configurados
  const extracted = {};
  for (const [outputKey, jsonPath] of Object.entries(transformers)) {
    extracted[outputKey] = this.getValueFromPath(payload, jsonPath);
  }
  return extracted;
}
```

---

## 📝 TEMPLATE MANAGER

### 🎨 **TEMPLATES DINÂMICOS POR CLIENTE**

**Estrutura:**
```
/clients/{clientId}/templates/
├── messages/
│   ├── {client}_order_expired.hbs    # Template específico
│   └── {client}_order_paid.hbs       # Template específico
└── variations/
    ├── {client}-order-expired-variations.js  # Variações
    └── {client}-order-paid-variations.js     # Variações
```

### 🔄 **CARREGAMENTO AUTOMÁTICO**

**`template-manager.js:42`**
```javascript
async loadClientTemplates(clientId) {
  const clientTemplatesPath = path.join(this.clientsPath, clientId, 'templates');
  if (await fs.access(clientTemplatesPath).then(() => true).catch(() => false)) {
    // Carregar templates específicos do cliente
    await this.loadTemplatesFromDirectory(clientTemplatesPath, clientId);
  }
}
```

**Benefícios:**
- 🎨 **Personalização total** - Templates únicos por cliente
- 🔄 **Fallback inteligente** - Template padrão se específico não existe
- 📊 **Variações anti-spam** - Múltiplas versões por template
- ⚡ **Performance** - Cache por cliente

---

## 🛡️ SISTEMA ANTI-BAN AVANÇADO

### ⏰ **DELAY MANAGER**

**`/apps/api/src/services/antiban/delay-manager.js:22`**
```javascript
const MIN_DELAY = 90000;        // 90 segundos mínimo
const RANDOM_DELAY_MAX = 60000; // +0-60s variação
const LONG_PAUSE_CHANCE = 0.15; // 15% chance pausa longa

calculateDelay() {
  let delay = MIN_DELAY + Math.random() * RANDOM_DELAY_MAX;
  
  // Pausas longas aleatórias (2-5 minutos)
  if (Math.random() < LONG_PAUSE_CHANCE) {
    delay += 120000 + Math.random() * 180000;
  }
  
  return delay;
}
```

### 🎭 **SIMULAÇÃO HUMANA**

**Recursos Implementados:**
- ✅ **Typing Simulation** - Simula digitação humana
- ✅ **Presence Updates** - Atualiza status "online"
- ✅ **Random Delays** - Intervalos humanizados
- ✅ **Long Pauses** - Pausas naturais aleatórias
- ✅ **Per-Client Config** - Configuração independente

**Configuração por cliente:**
```json
{
  "features": {
    "typing": true,
    "presence": true
  },
  "antibanStrategy": "advanced",
  "delays": {
    "min": 90000,
    "max": 150000
  }
}
```

---

## 🖥️ HETZNER MANAGER

### 🔧 **INSTÂNCIAS ESCALÁVEIS**

**Nomenclatura Dinâmica:**
```
ANTES (Hardcoded):          DEPOIS (Escalável):
- imperio1                  - imperio_main
- imperio2                  - broadcast-imperio-1  
- imperio3                  - broadcast-imperio-2
- imperio4                  - broadcast-imperio-3

NOVO CLIENTE:
- loja_xyz_main
- broadcast-loja_xyz-1
- broadcast-loja_xyz-2
```

### 🚀 **CRIAÇÃO AUTOMÁTICA VIA API**

**Endpoint Management:**
```bash
# Criar todas instâncias de um cliente
POST /api/management/hetzner/instances/{clientId}/create

# Listar instâncias do servidor
GET /api/management/hetzner/instances

# Status de instância específica  
GET /api/management/hetzner/instances/{instanceName}/status

# QR Code para conexão
GET /api/management/hetzner/instances/{instanceName}/qrcode
```

### 🔄 **SINCRONIZAÇÃO AUTOMÁTICA**

**`hetzner-manager.js:156`**
```javascript
async syncInstances() {
  const serverInstances = await this.fetchServerInstances();
  const clients = clientManager.getActiveClients();
  
  for (const client of clients) {
    await this.ensureClientInstances(client.id, serverInstances);
  }
}
```

---

## 📊 APIS DE MANAGEMENT

### 🎯 **ENDPOINTS ESCALÁVEIS**

**Health Check Completo:**
```bash
GET /health
# Retorna: system, templates, webhooks, hetzner stats
```

**Gestão de Clientes:**
```bash
GET /api/management/clients                    # Lista todos
GET /api/management/clients/{clientId}         # Cliente específico
GET /api/management/clients/{clientId}/broadcast/files  # Arquivos broadcast
```

**Dashboard Sistema:**
```bash
GET /api/management/dashboard                  # Visão geral
POST /api/management/reload/clients            # Recarregar clientes
POST /api/management/reload/templates          # Recarregar templates
```

### 📈 **ESTATÍSTICAS EM TEMPO REAL**

**Exemplo Response `/health`:**
```json
{
  "status": "ok",
  "version": "3.0.0-scalable",
  "architecture": "multi-tenant-scalable",
  "system": {
    "totalClients": 2,
    "activeClients": 2,
    "loadedConfigs": ["imperio", "loja_xyz"]
  },
  "templates": {
    "totalTemplates": 8,
    "clientTemplates": {
      "imperio": 4,
      "loja_xyz": 4
    }
  },
  "hetzner": {
    "totalInstances": 6,
    "connectedInstances": 4,
    "instancesByClient": {
      "imperio": 3,
      "loja_xyz": 3
    }
  }
}
```

---

## 🚀 DEPLOYMENT E ESCALABILIDADE

### 📦 **ADICIONAR NOVO CLIENTE**

**1. Criar estrutura:**
```bash
mkdir -p /clients/novo_cliente/{data/broadcast,templates/messages,templates/variations}
```

**2. Configurar `config.json`:**
```json
{
  "id": "novo_cliente",
  "name": "Novo Cliente LTDA",
  "webhooks": {
    "orderExpired": {
      "url": "https://oraclewa-imperio-production.up.railway.app/webhook/novo_cliente/order_expired"
    }
  }
}
```

**3. Sistema auto-detecta:**
```bash
# ClientManager detecta automaticamente
# Templates carregados dinamicamente  
# Instâncias Hetzner criadas via API
```

### ⚡ **ZERO-DOWNTIME SCALING**

**Recursos:**
- ✅ **Hot reload** - Novos clientes sem restart
- ✅ **Isolamento total** - Erro de um não afeta outros
- ✅ **Load balancing** - Distribuição automática
- ✅ **Health monitoring** - Monitoramento independente
- ✅ **Auto-recovery** - Recuperação automática falhas

---

## 🔐 SEGURANÇA E ISOLAMENTO

### 🛡️ **SEPARAÇÃO POR CLIENTE**

**Dados:**
- ✅ Configurações isoladas (`/clients/{id}/config.json`)
- ✅ Templates únicos (`/clients/{id}/templates/`)
- ✅ Dados broadcast (`/clients/{id}/data/`)
- ✅ Logs separados por cliente

**Instâncias WhatsApp:**
- ✅ Instâncias dedicadas por cliente
- ✅ Tokens únicos e isolados
- ✅ Rate limiting independente
- ✅ Anti-ban por cliente

**Processamento:**
- ✅ Webhooks isolados por cliente
- ✅ Filas separadas
- ✅ Error handling independente
- ✅ Rollback por cliente

### 🔒 **VALIDAÇÃO E SEGURANÇA**

**Webhook Validation:**
```javascript
validatePayloadData(client, data) {
  const essentialFields = ['phone', 'customerName'];
  for (const field of essentialFields) {
    if (!data[field] || data[field] === 'N/A') {
      throw new Error(`Required field missing: ${field}`);
    }
  }
}
```

**Rate Limiting por cliente:**
```json
{
  "limits": {
    "messagesPerDay": 5000,
    "messagesPerHour": 500,
    "instances": 3
  }
}
```

---

## 📊 MONITORAMENTO E OBSERVABILIDADE

### 📈 **MÉTRICAS POR CLIENTE**

**Dashboard Stats:**
```javascript
getSystemStats() {
  return {
    totalClients: this.clients.size,
    activeClients: Array.from(this.clients.values())
      .filter(c => c.status === 'active').length,
    clientBreakdown: this.getClientBreakdown(),
    resourceUsage: this.getResourceUsage()
  };
}
```

### 🔍 **DEBUG E TROUBLESHOOTING**

**Debug Endpoint:**
```bash
POST /api/debug/webhook/{clientId}/{type}
# Testa payload sem enviar WhatsApp
# Logs detalhados de transformação
# Validação step-by-step
```

**Logs Estruturados:**
```javascript
logger.info(`📥 Processing webhook: ${clientId}/${webhookType}`);
logger.debug(`📦 Raw payload:`, JSON.stringify(payload));
logger.debug(`🔍 Extracted data:`, extractedData);
logger.info(`✅ Webhook processed: ${clientId}/${webhookType}`);
```

---

## 🎯 CONCLUSÃO

A **Arquitetura Escalável OracleWA SaaS v3.0** implementa:

### ✅ **IMPLEMENTADO**
- 🏗️ **Multi-tenant verdadeiro** com isolamento total
- 👥 **Auto-discovery** de clientes sem configuração manual
- 🔗 **Webhook escalável** processamento dinâmico por cliente
- 📝 **Templates dinâmicos** carregamento automático personalizado
- 🖥️ **Hetzner integrado** criação automática instâncias
- 🛡️ **Anti-ban avançado** delays 90s+ com simulação humana
- 📊 **APIs management** gestão completa via Railway

### 🚀 **BENEFÍCIOS**
- **Escalabilidade ilimitada** - 1 para 1000+ clientes sem código
- **Isolamento total** - Falha de um não afeta outros
- **Deploy instantâneo** - Novos clientes em minutos
- **Manutenção zero** - Sistema auto-gerenciável
- **Performance otimizada** - Resources dedicados por cliente

---

*📅 Documentação criada: 11/08/2025*  
*✍️ Autor: Claude Code*  
*🏗️ Versão: OracleWA SaaS v3.0 SCALABLE*  
*🎯 Status: ✅ IMPLEMENTADO E FUNCIONAL*