# 🔗 API REFERENCE - OracleWA SaaS v3.0

## 🎯 OVERVIEW

Documentação completa das **APIs escaláveis** do OracleWA SaaS v3.0, incluindo webhooks multi-tenant, management APIs e endpoints de monitoramento.

**Base URL:** `https://oraclewa-imperio-production.up.railway.app`

---

## 📥 WEBHOOK APIS

### 🔗 **Webhook Escalável (Recomendado)**

**Endpoint para qualquer cliente:**
```http
POST /webhook/{clientId}/{type}
Content-Type: application/json
```

**Parâmetros:**
- `clientId`: ID do cliente (ex: `imperio`, `loja_xyz`)
- `type`: Tipo do webhook (ex: `order_expired`, `order_paid`)

**Exemplo Request:**
```bash
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/imperio/order_expired" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "user": {
        "name": "João Silva",
        "phone": "5511999999999",
        "email": "joao@email.com"
      },
      "product": {
        "title": "Produto Premium",
        "id": "123"
      },
      "total": 299.90,
      "id": "order_456"
    }
  }'
```

**Response Success:**
```json
{
  "success": true,
  "client": "imperio",
  "type": "order_expired",
  "customer": "João Silva",
  "phone": "5511999999999",
  "total": 299.90,
  "messageResult": {
    "status": "sent",
    "messageId": "msg_789"
  },
  "timestamp": "2025-08-11T15:30:00Z"
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "Required field missing: phone",
  "timestamp": "2025-08-11T15:30:00Z"
}
```

---

### 🔙 **Webhooks Backward Compatibility**

**Endpoints específicos para Império:**
```http
POST /api/webhook/temp-order-paid
POST /api/webhook/temp-order-expired
Content-Type: application/json
```

Estes endpoints redirecionam automaticamente para `/webhook/imperio/{type}`.

---

### 🧪 **Debug Webhook**

**Testar payloads sem enviar WhatsApp:**
```http
POST /api/debug/webhook/{clientId}/{type}
Content-Type: application/json
```

**Response Debug:**
```json
{
  "success": true,
  "debug": true,
  "clientId": "imperio",
  "type": "order_expired",
  "rawPayload": { /* payload original */ },
  "extractedData": {
    "customerName": "João Silva",
    "phone": "5511999999999",
    "productName": "Produto Premium",
    "total": 299.90
  },
  "message": "Debug completed - no WhatsApp sent"
}
```

---

## 🛠️ MANAGEMENT APIS

### 📊 **Health Check**

**Status completo do sistema:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-11T15:30:00Z",
  "uptime": 86400,
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
  "webhooks": {
    "totalClients": 2,
    "activeManagers": [
      {
        "clientId": "imperio",
        "stats": {
          "totalSent": 150,
          "successRate": 0.96
        }
      }
    ]
  },
  "hetzner": {
    "totalInstances": 6,
    "connectedInstances": 4,
    "instancesByClient": {
      "imperio": 3,
      "loja_xyz": 3
    }
  },
  "features": {
    "trueMultiTenant": true,
    "clientSeparation": true,
    "dynamicTemplates": true,
    "scalableWebhooks": true,
    "antibanDelays": true,
    "typingSimulation": true,
    "autoClientDiscovery": true,
    "hetznerIntegration": true
  }
}
```

---

### 👥 **Client Management**

**Listar todos os clientes:**
```http
GET /api/management/clients
```

**Response:**
```json
{
  "success": true,
  "clients": [
    {
      "id": "imperio",
      "name": "Império Prêmios",
      "status": "active",
      "instances": 3,
      "lastActivity": "2025-08-11T15:25:00Z"
    },
    {
      "id": "loja_xyz", 
      "name": "Loja XYZ E-commerce",
      "status": "active",
      "instances": 2,
      "lastActivity": "2025-08-11T14:30:00Z"
    }
  ]
}
```

**Detalhes de cliente específico:**
```http
GET /api/management/clients/{clientId}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "imperio",
    "name": "Império Prêmios",
    "status": "active",
    "provider": "evolution-baileys",
    "limits": {
      "messagesPerDay": 5000,
      "messagesPerHour": 500
    },
    "instances": {
      "imperio_main": {
        "status": "active",
        "type": "recovery",
        "phone": "+5511982661537"
      }
    }
  },
  "templates": {
    "imperio_order_expired": "loaded",
    "imperio_order_paid": "loaded"
  },
  "antiban": {
    "totalSent": 150,
    "successRate": 0.96,
    "averageDelay": 95000,
    "lastSent": "2025-08-11T15:25:00Z"
  }
}
```

**Arquivos de broadcast do cliente:**
```http
GET /api/management/clients/{clientId}/broadcast/files
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "leads_agosto.csv",
      "path": "/clients/imperio/data/broadcast/leads_agosto.csv", 
      "size": 15420,
      "records": 342,
      "lastModified": "2025-08-11T10:00:00Z"
    }
  ]
}
```

---

### 📈 **Dashboard**

**Visão geral do sistema:**
```http
GET /api/management/dashboard
```

**Response:**
```json
{
  "system": "OracleWA SaaS v3.0 - Scalable Multi-Tenant",
  "status": "running",
  "timestamp": "2025-08-11T15:30:00Z",
  "architecture": {
    "type": "multi-tenant-scalable",
    "clientSeparation": true,
    "dataIsolation": true,
    "dynamicLoading": true
  },
  "stats": {
    "system": {
      "totalClients": 2,
      "activeClients": 2,
      "totalInstances": 6
    },
    "templates": {
      "totalTemplates": 8,
      "loadedPerClient": {
        "imperio": 4,
        "loja_xyz": 4
      }
    },
    "webhooks": {
      "totalProcessed": 1250,
      "successRate": 0.97,
      "averageResponseTime": 1200
    }
  }
}
```

---

## 🖥️ HETZNER MANAGEMENT

### 📱 **Instâncias**

**Listar todas instâncias do servidor:**
```http
GET /api/management/hetzner/instances
```

**Response:**
```json
{
  "success": true,
  "instances": [
    {
      "instanceName": "imperio_main",
      "status": "open",
      "profileName": "default",
      "profileStatus": "open",
      "owner": "+5511982661537",
      "serverUrl": "http://128.140.7.154:8080"
    },
    {
      "instanceName": "broadcast-imperio-1", 
      "status": "close",
      "profileName": "default",
      "profileStatus": "close"
    }
  ]
}
```

**Criar instâncias para cliente:**
```http
POST /api/management/hetzner/instances/{clientId}/create
```

**Response:**
```json
{
  "success": true,
  "results": {
    "created": [
      {
        "instanceName": "loja_xyz_main",
        "status": "created",
        "type": "recovery"
      },
      {
        "instanceName": "broadcast-loja_xyz-1",
        "status": "created", 
        "type": "broadcast"
      }
    ],
    "errors": []
  }
}
```

**QR Code de instância:**
```http
GET /api/management/hetzner/instances/{instanceName}/qrcode
```

**Response:**
```json
{
  "success": true,
  "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Status de instância específica:**
```http
GET /api/management/hetzner/instances/{instanceName}/status  
```

**Response:**
```json
{
  "success": true,
  "status": {
    "instanceName": "imperio_main",
    "status": "open",
    "profileStatus": "open", 
    "owner": "+5511982661537",
    "connected": true,
    "lastSeen": "2025-08-11T15:25:00Z"
  }
}
```

**Sincronizar com Hetzner:**
```http
POST /api/management/hetzner/sync
```

**Response:**
```json
{
  "success": true,
  "syncResult": {
    "instancesFound": 6,
    "clientsMatched": 2,
    "newInstancesDetected": 0,
    "syncedAt": "2025-08-11T15:30:00Z"
  }
}
```

---

## 🔄 RELOAD & MAINTENANCE

### 🔄 **Reload Clientes**

**Recarregar todos os clientes:**
```http
POST /api/management/reload/clients
```

**Response:**
```json
{
  "success": true,
  "message": "All clients reloaded",
  "reloadedClients": ["imperio", "loja_xyz"],
  "timestamp": "2025-08-11T15:30:00Z"
}
```

**Reload Templates:**
```http
POST /api/management/reload/templates
```

**Response:**
```json
{
  "success": true,
  "message": "All templates reloaded",
  "templatesLoaded": 8,
  "timestamp": "2025-08-11T15:30:00Z"
}
```

---

## ⚠️ ERROR HANDLING

### 🚨 **Códigos de Erro HTTP**

| Status | Descrição | Exemplo |
|--------|-----------|---------|
| `200` | Sucesso | Webhook processado |
| `400` | Bad Request | Campo obrigatório ausente |
| `404` | Not Found | Cliente não encontrado |
| `500` | Internal Server Error | Erro interno do sistema |

### 📋 **Estrutura de Erro**

```json
{
  "success": false,
  "error": "Required field missing: phone",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-08-11T15:30:00Z",
  "clientId": "imperio",
  "type": "order_expired"
}
```

### 🔍 **Tipos de Erro Comuns**

**Cliente não encontrado:**
```json
{
  "success": false,
  "error": "Client not found: invalid_client",
  "code": "CLIENT_NOT_FOUND"
}
```

**Instância WhatsApp offline:**
```json
{
  "success": false,
  "error": "WhatsApp Manager not found for client: imperio",
  "code": "WHATSAPP_OFFLINE"
}
```

**Campo obrigatório ausente:**
```json
{
  "success": false,
  "error": "Required field missing: phone",
  "code": "VALIDATION_ERROR"
}
```

**Erro de formato de telefone:**
```json
{
  "success": false,
  "error": "Invalid Brazilian phone format",
  "code": "PHONE_FORMAT_ERROR"
}
```

---

## 🔐 AUTHENTICATION

### 🗝️ **API Key (Hetzner)**

Para endpoints que interagem com Hetzner:
```http
Headers:
apikey: Imperio2024@EvolutionSecure
```

### 🛡️ **Rate Limiting**

**Limites por cliente (configurável no `config.json`):**
```json
{
  "limits": {
    "messagesPerDay": 5000,
    "messagesPerHour": 500,
    "requestsPerMinute": 60
  }
}
```

**Headers de resposta:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1691768400
```

---

## 📊 WEBHOOK PAYLOAD EXAMPLES

### 🛒 **E-commerce Padrão**

**WooCommerce Order Expired:**
```json
{
  "id": 12345,
  "status": "expired",
  "total": "299.90",
  "currency": "BRL",
  "billing": {
    "first_name": "João",
    "last_name": "Silva", 
    "phone": "11999999999",
    "email": "joao@email.com"
  },
  "line_items": [
    {
      "id": 1,
      "name": "Produto Premium",
      "quantity": 1,
      "price": "299.90"
    }
  ],
  "date_created": "2025-08-11T14:00:00",
  "date_modified": "2025-08-11T15:30:00"
}
```

### 📦 **Formato Customizado**

**Payload personalizado:**
```json
{
  "data": {
    "customer": {
      "nome_completo": "Maria Santos",
      "telefone": "5511888888888",
      "email": "maria@email.com"
    },
    "pedido": {
      "id": "PED-456", 
      "valor_total": 149.90,
      "status": "expirado"
    },
    "item": {
      "titulo": "Curso Online Premium",
      "categoria": "educacao"
    }
  }
}
```

**Configuração correspondente (`config.json`):**
```json
{
  "webhookConfig": {
    "payloadTransformers": {
      "order_expired": {
        "userPhone": "data.customer.telefone",
        "userName": "data.customer.nome_completo",
        "productTitle": "data.item.titulo",
        "orderTotal": "data.pedido.valor_total",
        "orderId": "data.pedido.id"
      }
    }
  }
}
```

---

## 🚀 SDKs E INTEGRAÇÕES

### 📱 **JavaScript/Node.js**

```javascript
// Cliente básico
class OracleWAClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async sendWebhook(clientId, type, payload) {
    const response = await fetch(`${this.baseUrl}/webhook/${clientId}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
  
  async getClientStatus(clientId) {
    const response = await fetch(`${this.baseUrl}/api/management/clients/${clientId}`);
    return response.json();
  }
}

// Uso
const client = new OracleWAClient('https://oraclewa-imperio-production.up.railway.app');
const result = await client.sendWebhook('imperio', 'order_expired', payload);
```

### 🐍 **Python**

```python
import requests
import json

class OracleWAClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def send_webhook(self, client_id, webhook_type, payload):
        url = f"{self.base_url}/webhook/{client_id}/{webhook_type}"
        response = requests.post(url, json=payload)
        return response.json()
    
    def get_health(self):
        url = f"{self.base_url}/health"
        response = requests.get(url)
        return response.json()

# Uso
client = OracleWAClient('https://oraclewa-imperio-production.up.railway.app')
result = client.send_webhook('imperio', 'order_expired', {
    'data': {
        'user': {'name': 'João', 'phone': '11999999999'},
        'product': {'title': 'Produto'}, 
        'total': 99.90
    }
})
```

### 🌐 **WordPress/PHP**

```php
<?php
class OracleWAClient {
    private $base_url;
    
    public function __construct($base_url) {
        $this->base_url = $base_url;
    }
    
    public function sendWebhook($client_id, $type, $payload) {
        $url = "{$this->base_url}/webhook/{$client_id}/{$type}";
        
        $response = wp_remote_post($url, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($payload),
            'timeout' => 30
        ]);
        
        return json_decode(wp_remote_retrieve_body($response), true);
    }
}

// Hook WooCommerce
add_action('woocommerce_order_status_expired', function($order_id) {
    $order = wc_get_order($order_id);
    $client = new OracleWAClient('https://oraclewa-imperio-production.up.railway.app');
    
    $client->sendWebhook('minha_loja', 'order_expired', [
        'data' => [
            'user' => [
                'name' => $order->get_billing_first_name(),
                'phone' => $order->get_billing_phone(),
            ],
            'product' => [
                'title' => $order->get_items()[0]->get_name()
            ],
            'total' => $order->get_total(),
            'id' => $order_id
        ]
    ]);
});
?>
```

---

## 📚 EXEMPLOS DE USO

### 🎯 **Recuperação de Carrinho**

```bash
# Enviar recuperação de carrinho abandonado
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/minha_loja/cart_abandoned" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "customer": {
        "name": "Ana Silva",
        "phone": "5511987654321",
        "email": "ana@email.com"
      },
      "cart": {
        "total": 189.90,
        "items": [
          {"name": "Produto A", "price": 89.90},
          {"name": "Produto B", "price": 100.00}
        ]
      },
      "abandonedAt": "2025-08-11T14:30:00Z"
    }
  }'
```

### 🎉 **Confirmação de Pagamento**

```bash
# Confirmar pagamento recebido
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/minha_loja/payment_confirmed" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "customer": {
        "name": "Carlos Lima",
        "phone": "5511876543210"
      },
      "order": {
        "id": "ORD-789",
        "total": 299.90,
        "paymentMethod": "pix"
      },
      "paidAt": "2025-08-11T15:45:00Z"
    }
  }'
```

### 📢 **Broadcast Personalizado**

```javascript
// Usar API para envio em massa personalizado
const leads = [
  {name: "João", phone: "11999999999", product: "Curso A"},
  {name: "Maria", phone: "11888888888", product: "Curso B"}
];

for (const lead of leads) {
  await fetch('https://oraclewa-imperio-production.up.railway.app/webhook/escola_online/promotional_message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      data: {
        customer: {name: lead.name, phone: lead.phone},
        product: {title: lead.product},
        campaign: "volta_as_aulas_2025"
      }
    })
  });
  
  // Respeitar anti-ban delay
  await new Promise(resolve => setTimeout(resolve, 120000)); // 2 min
}
```

---

## 🔍 MONITORING & DEBUGGING

### 📊 **Health Monitoring**

```bash
# Script de monitoramento contínuo
#!/bin/bash
while true; do
  curl -s "https://oraclewa-imperio-production.up.railway.app/health" | jq '.status'
  sleep 30
done
```

### 🐛 **Debug Workflow**

```bash
# 1. Testar conectividade
curl -I "https://oraclewa-imperio-production.up.railway.app/health"

# 2. Verificar cliente específico
curl "https://oraclewa-imperio-production.up.railway.app/api/management/clients/imperio"

# 3. Testar payload sem envio
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/debug/webhook/imperio/order_expired" \
  -H "Content-Type: application/json" \
  -d '{"data": {"user": {"name": "Teste", "phone": "11999999999"}}}'

# 4. Envio real de teste
curl -X POST "https://oraclewa-imperio-production.up.railway.app/webhook/imperio/order_expired" \
  -H "Content-Type: application/json" \
  -d '{"data": {"user": {"name": "Teste", "phone": "SEU_NUMERO"}}}'
```

---

## 📋 CHANGELOG

### v3.0.0-scalable (2025-08-11)
- ✅ **Multi-tenant architecture** implementada
- ✅ **Webhook escalável** `/webhook/{clientId}/{type}`
- ✅ **Management APIs** completas
- ✅ **Hetzner integration** dinâmica
- ✅ **Auto-discovery** de clientes
- ✅ **Anti-ban avançado** 90s+ delays
- ✅ **Debug endpoints** para desenvolvimento

### v2.1.0 (2025-08-07)
- Webhook específico Império
- Templates básicos
- Hetzner hardcoded

---

*📅 API Reference criada: 11/08/2025*  
*✍️ Autor: Claude Code*  
*🔗 Versão: OracleWA SaaS v3.0 SCALABLE*  
*📊 Status: APIs totalmente documentadas e funcionais*