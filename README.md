# 🏆 OracleWA SaaS v3.0 - Multi-Tenant WhatsApp Business Platform

<div align="center">

![OracleWA Logo](docs/assets/logo.png)

**Plataforma SaaS multi-tenant escalável para automação WhatsApp Business**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/imperio-digital/oraclewa-saas)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/next.js-14+-black.svg)](https://nextjs.org)

[🚀 Demo](https://oraclewa-imperio-production.up.railway.app) • [📖 Docs](docs/) • [🐛 Issues](https://github.com/imperio-digital/oraclewa-saas/issues) • [💬 Discussions](https://github.com/imperio-digital/oraclewa-saas/discussions)

</div>

---

## 📋 Índice

- [✨ Visão Geral](#-visão-geral)
- [🚀 Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura](#️-arquitetura)
- [⚡ Quick Start](#-quick-start)
- [🔧 Instalação](#-instalação)
- [📊 Dashboard](#-dashboard)
- [🔗 Integrações](#-integrações)
- [🛡️ Anti-ban](#️-anti-ban)
- [📡 API Reference](#-api-reference)
- [🚢 Deploy](#-deploy)
- [🤝 Contributing](#-contributing)

---

## ✨ Visão Geral

OracleWA SaaS é uma plataforma **multi-tenant completa** para automação WhatsApp Business, projetada para agências e empresas que precisam gerenciar múltiplos clientes com **total separação de dados** e **estratégias anti-ban avançadas**.

### 🎯 Diferenciais

- **🏢 Multi-tenant verdadeiro** - Separação completa de clientes e dados
- **🤖 Anti-ban avançado** - Estratégias de maturação e humanização
- **⚡ Real-time** - Dashboard reativo com WebSocket
- **🔌 Multi-provider** - Evolution API, Z-API, Baileys
- **📊 Analytics completo** - Métricas detalhadas e logs
- **🐳 Docker ready** - Containerização completa
- **🚀 Railway/Hetzner** - Deploy automatizado

### 📈 Casos de Uso

- **Agências de Marketing** - Gestão de múltiplos clientes
- **E-commerce** - Recuperação de carrinho e atendimento
- **Infoprodutos** - Nurturing e suporte automatizado
- **Imobiliárias** - Qualificação de leads
- **Educação** - Comunicação com alunos

---

## 🚀 Funcionalidades

### 🏢 **Multi-Tenant System**
- ✅ Separação completa de clientes e dados
- ✅ Configurações isoladas por cliente
- ✅ Templates e webhooks independentes
- ✅ Billing e limites por cliente

### 📱 **Instance Management**
- ✅ Múltiplos providers (Evolution, Z-API, Baileys)
- ✅ QR Code management
- ✅ Status real-time
- ✅ Reconnection automática
- ✅ Load balancing
- ✅ **NOVO**: Exclusão de instâncias com confirmação

### 🎯 **Broadcast System**
- ✅ Campanhas em massa
- ✅ Pool de instâncias
- ✅ Anti-ban strategies
- ✅ CSV import/export
- ✅ Agendamento

### 🧠 **AI Anti-ban**
- ✅ Chip maturation (30 dias)
- ✅ **NOVO**: Typing simulation humanizada
- ✅ **NOVO**: Message variations automáticas
- ✅ **NOVO**: Delay humanization inteligente
- ✅ **NOVO**: Presence simulation

### 📊 **Analytics & Monitoring**
- ✅ Dashboard real-time
- ✅ Performance metrics
- ✅ Health checks
- ✅ Error tracking
- ✅ Usage analytics

### 🔗 **Webhook System**
- ✅ Multi-client handlers
- ✅ Payload transformation
- ✅ Retry logic
- ✅ Event routing
- ✅ Template responses

---

## 🏗️ Arquitetura

### 📦 **Stack Tecnológico**

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js 14] --> B[TypeScript]
        A --> C[TailwindCSS]
        A --> D[Socket.IO Client]
    end
    
    subgraph "Backend"
        E[Node.js 18] --> F[Express]
        E --> G[Socket.IO]
        E --> H[Bull Queue]
    end
    
    subgraph "Database"
        I[PostgreSQL] --> J[Redis]
    end
    
    subgraph "Providers"
        K[Evolution API] --> L[Z-API]
        K --> M[Baileys]
    end
    
    A --> E
    E --> I
    E --> K
```

### 🏭 **Arquitetura Multi-Tenant**

```bash
OracleWA-SaaS/
├── apps/
│   ├── api/                 # 🔧 Backend Node.js
│   │   ├── src/
│   │   │   ├── modules/     # 📦 Módulos principais
│   │   │   │   ├── broadcast/     # Sistema de broadcast
│   │   │   │   ├── webhooks/      # Webhook handlers
│   │   │   │   └── templates/     # Template engine
│   │   │   ├── providers/   # 🔌 Provider abstractions
│   │   │   │   ├── evolution-baileys/
│   │   │   │   ├── zapi/
│   │   │   │   └── base/
│   │   │   ├── services/    # 🛠️ Business logic
│   │   │   └── utils/       # 🔧 Utilities
│   │   └── clients/         # 👥 Client configurations
│   └── dashboard/           # 🎨 Frontend Next.js
│       ├── src/
│       │   ├── app/         # App Router (Next.js 14)
│       │   ├── components/  # React components
│       │   ├── contexts/    # React contexts
│       │   └── lib/         # Utilities
│       └── public/          # Static assets
├── config/                  # ⚙️ Environment configs
├── scripts/                 # 🤖 Automation scripts
└── infrastructure/          # 🐳 Docker, K8s, Terraform
```

---

## ⚡ Quick Start

### 🚀 **Docker (Recomendado)**

```bash
# Clone o repositório
git clone https://github.com/imperio-digital/oraclewa-saas.git
cd oraclewa-saas

# Copie as variáveis de ambiente
cp .env.example .env

# Configure as credenciais da Evolution API
nano .env

# Inicie com Docker
docker-compose up -d

# Acesse o dashboard
open http://localhost:3001
```

### 🛠️ **Desenvolvimento Local**

```bash
# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
nano .env

# Inicie o sistema
./start.sh dev

# URLs disponíveis
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:3333"
echo "Health:   http://localhost:3333/health"
```

---

## 🔧 Instalação

### 📋 **Pré-requisitos**

- **Node.js** 18+ ([Download](https://nodejs.org))
- **PostgreSQL** 14+ ([Download](https://postgresql.org))
- **Redis** 6+ ([Download](https://redis.io))
- **Docker** (opcional) ([Download](https://docker.com))

### 🔐 **Variáveis de Ambiente**

```bash
# Application
NODE_ENV=production
APP_PORT=3333
FRONTEND_URL=http://localhost:3001

# Evolution API
EVOLUTION_API_URL=http://your-evolution-server:8080
EVOLUTION_API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/oraclewa
REDIS_URL=redis://localhost:6379

# JWT & Security
JWT_SECRET=your-super-secret-key
WEBHOOK_SECRET=your-webhook-secret

# Features
FEATURE_DASHBOARD=true
FEATURE_ANALYTICS=true
FEATURE_WEBHOOKS=true
FEATURE_BROADCAST=true
```

### 📦 **Instalação Manual**

```bash
# 1. Clone o repositório
git clone https://github.com/imperio-digital/oraclewa-saas.git
cd oraclewa-saas

# 2. Instale dependências
npm install
cd apps/api && npm install
cd ../dashboard && npm install
cd ../..

# 3. Configure banco de dados
createdb oraclewa
npm run db:migrate

# 4. Configure cliente padrão
npm run setup:client imperio

# 5. Inicie os serviços
npm run dev
```

---

## 📊 Dashboard

### 🎨 **Interface Moderna**

O dashboard oferece uma experiência completa para gerenciamento:

#### 📱 **Instâncias WhatsApp**
- ✅ **NOVO**: Criação com wizard em 4 etapas
- ✅ **NOVO**: Configurações anti-ban avançadas no frontend
- ✅ **NOVO**: Indicadores de status dos provedores
- ✅ **NOVO**: Botão de exclusão com confirmação
- ✅ QR Code em tempo real
- ✅ Status monitoring

#### 📈 **Analytics & Métricas**
- Dashboard em tempo real
- Gráficos de performance
- Health checks das instâncias
- Logs detalhados

#### 🎯 **Sistema de Broadcast**
- Campanhas em massa
- Upload CSV
- Templates dinâmicos
- Agendamento de envios

#### ⚙️ **Configurações**
- Client management
- Template editor
- Webhook configuration
- Anti-ban strategies

### 🔐 **Multi-Tenant Interface**

Cada cliente possui:
- Dashboard isolado
- Configurações independentes
- Métricas separadas
- Templates exclusivos

---

## 🔗 Integrações

### 🚀 **Evolution API + Baileys**

```javascript
// Configuração automática
const provider = new EvolutionBaileysProvider({
  baseUrl: process.env.EVOLUTION_API_URL,
  apiKey: process.env.EVOLUTION_API_KEY
});

// Recursos disponíveis
- ✅ Mensagens de texto
- ✅ Mídia (imagem, vídeo, áudio)
- ✅ Documentos
- ✅ Localização
- ✅ Contatos
- ✅ Grupos
- ❌ Botões (limitação Baileys)
- ❌ Listas (limitação Baileys)
```

### 💎 **Z-API Premium**

```javascript
// Configuração Z-API
const provider = new ZAPIProvider({
  instanceId: 'your-instance-id',
  token: 'your-z-api-token'
});

// Recursos premium
- ✅ Todos os recursos Baileys
- ✅ Botões interativos
- ✅ Listas de opções
- ✅ Enquetes
- ✅ Catálogo de produtos
- ✅ Suporte oficial 24/7
```

### 🔧 **Provider Abstraction**

```typescript
interface WhatsAppProvider {
  createInstance(name: string): Promise<Instance>;
  sendMessage(to: string, message: string): Promise<void>;
  sendMedia(to: string, media: MediaData): Promise<void>;
  setWebhook(url: string): Promise<void>;
}
```

---

## 🛡️ Anti-ban

### 🧠 **Estratégias Implementadas**

#### 1. **Chip Maturation (Maturação)**
```javascript
const maturationLevels = {
  day1:   { min: 10,  max: 20   },  // Novo
  day2:   { min: 30,  max: 40   },  // Aquecendo
  day3:   { min: 50,  max: 60   },  // Crescendo
  day7:   { min: 70,  max: 100  },  // Forte
  mature: { min: 100, max: 150  }   // Maduro (1+ mês)
};
```

#### 2. **🆕 Humanization Features**
- **⌨️ Typing Simulation**: Simula digitação baseada no tamanho da mensagem
- **👀 Presence Simulation**: Aparece "online" naturalmente
- **📖 Reading Simulation**: Marca mensagens como lidas
- **🎭 Message Variations**: Prefixos e sufixos aleatórios

#### 3. **Smart Delays**
```javascript
const antibanConfig = {
  delays: {
    min: 15000,        // 15 segundos mínimo
    max: 45000,        // 45 segundos máximo
    typing: 3000       // 3 segundos digitando
  },
  limits: {
    messagesPerHour: 100,
    messagesPerDay: 1000,
    batchSize: 10,
    pauseBetweenBatches: 300000  // 5 minutos
  }
};
```

#### 4. **🆕 Frontend Anti-ban Configuration**
- Interface visual para todas as configurações
- Preview dos limites baseados na fase
- Controles avançados expostos no frontend
- Indicadores de saúde da instância

---

## 📡 API Reference

### 🔍 **Principais Endpoints**

#### Instance Management
```http
GET    /instance/fetchInstances
POST   /instance/create
DELETE /instance/delete/:name        # 🆕 Exclusão implementada
GET    /api/instances/:name/qrcode
GET    /api/instances/:name/status
```

#### Client Management
```http
GET    /api/management/clients
POST   /api/management/clients
GET    /api/management/clients/:id
PUT    /api/management/clients/:id
```

#### Templates
```http
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id
```

#### Broadcast
```http
GET    /api/broadcast/campaigns
POST   /api/broadcast/campaigns
POST   /api/broadcast/csv
```

#### Webhooks
```http
POST   /webhook/:clientId/:type
GET    /api/webhooks/events
```

### 📝 **Exemplo de Uso**

```javascript
// Criar instância com configurações avançadas
const response = await fetch('/instance/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instanceName: 'meu-cliente-001',
    clientId: 'meu-cliente',
    provider: 'evolution',
    functionType: 'broadcast',
    antibanSettings: {
      strategy: 'conti_chips',
      enableTypingSimulation: true,
      enablePresenceSimulation: true,
      warmupPhase: 'day1'
    }
  })
});

// Deletar instância
await fetch('/instance/delete/meu-cliente-001', {
  method: 'DELETE'
});
```

---

## 🚢 Deploy

### 🚄 **Railway (Recomendado)**

```bash
# 1. Instale Railway CLI
npm install -g @railway/cli

# 2. Login no Railway
railway login

# 3. Deploy
railway up

# 4. Configure variáveis
railway variables set EVOLUTION_API_URL=http://your-server:8080
railway variables set EVOLUTION_API_KEY=your-key

# 5. Deploy automático via Git
git push origin main
```

### 🐳 **Docker Production**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: oraclewa-saas:latest
    ports:
      - "3333:3333"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: oraclewa
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 🆕 Últimas Atualizações (v3.0)

### ✨ **Novas Funcionalidades**

1. **🎨 Interface Modernizada**
   - Modal de criação com wizard em 4 etapas
   - Indicadores visuais de status dos provedores
   - Botão de exclusão com confirmação

2. **🧠 Anti-ban Avançado**
   - Simulação de digitação humanizada
   - Simulação de presença online
   - Variações automáticas de mensagem
   - Interface frontend para todas as configurações

3. **🔧 Melhorias Técnicas**
   - Endpoint de exclusão de instâncias
   - Sincronização em tempo real com Evolution API
   - Tratamento de erros aprimorado
   - Logs detalhados

### 🐛 **Correções**

- ✅ Instâncias não sumindo mais do frontend
- ✅ Erro 500 na criação de instâncias corrigido
- ✅ Payload de criação otimizado para Evolution API
- ✅ TypeScript errors resolvidos

---

## 🤝 Contributing

### 🛠️ **Development Setup**

```bash
# Fork e clone
git clone https://github.com/your-username/oraclewa-saas.git
cd oraclewa-saas

# Instale dependências
npm install

# Configure pre-commit hooks
npm run setup:hooks

# Inicie desenvolvimento
npm run dev
```

### 📋 **Guidelines**

- **Code Style**: Prettier + ESLint
- **Commits**: Conventional Commits
- **Tests**: Jest + Testing Library
- **Docs**: Always update README

### 🐛 **Reportando Bugs**

Abra uma [issue](https://github.com/imperio-digital/oraclewa-saas/issues) com:
- Descrição detalhada
- Steps to reproduce
- Environment info
- Screenshots/logs

### 🚀 **Feature Requests**

Propostas de novas funcionalidades são sempre bem-vindas! Use as [discussions](https://github.com/imperio-digital/oraclewa-saas/discussions).

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Acknowledgments

- **Evolution API** - WhatsApp Web API
- **Baileys** - WhatsApp Web library
- **Z-API** - Premium WhatsApp API
- **Railway** - Deployment platform
- **Hetzner** - VPS infrastructure

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

[🐛 Reportar Bug](https://github.com/imperio-digital/oraclewa-saas/issues) • [💡 Sugerir Feature](https://github.com/imperio-digital/oraclewa-saas/discussions) • [📖 Documentação](docs/)

---

© 2024 Império Digital. Feito com ❤️ para a comunidade.

</div>