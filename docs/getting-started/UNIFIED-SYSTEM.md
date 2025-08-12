# 🏗️ OracleWA SaaS - Sistema Unificado

> **Visão geral completa da arquitetura e funcionalidades do sistema v3.1**

## 🎯 Visão Geral

O **OracleWA SaaS v3.1** é uma plataforma completa de automação WhatsApp com:
- 🎨 **Frontend moderno** (Next.js 14 + TypeScript)
- 🔧 **Backend robusto** (Node.js + Express)
- 📱 **Integração WhatsApp** (Evolution API)
- 🛡️ **Sistema anti-ban** (Estratégias profissionais)

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │  EVOLUTION API  │
│   Next.js 14    │◄──►│   Node.js       │◄──►│   WhatsApp      │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DASHBOARD     │    │    DATABASE     │    │    WEBHOOKS     │
│   UI/UX Modern  │    │   PostgreSQL    │    │   E-commerce    │
│   Analytics     │    │   Redis Cache   │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 Frontend - Dashboard Moderno

### **Tecnologias**
- **Next.js 14** - Framework React moderno
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling responsivo
- **Heroicons** - Ícones profissionais

### **Páginas Implementadas**
```
Dashboard/
├── 📊 /dashboard          # Métricas e visão geral
├── 👥 /clients           # Gestão de clientes
├── 📱 /instances         # Status WhatsApp
├── 📡 /broadcast         # Campanhas em massa
├── 🔗 /webhooks          # Eventos e integrações
├── 📝 /templates         # Modelos de mensagem
├── 🔥 /chip-maturation   # Aquecimento de números
├── 📈 /analytics         # Relatórios avançados
├── 📋 /logs              # Logs do sistema
└── ⚙️  /settings         # Configurações
```

### **Funcionalidades**
- ✅ **Responsivo** - Funciona em desktop e mobile
- ✅ **Real-time** - Dados atualizados em tempo real
- ✅ **Dark/Light** - Temas adaptativos
- ✅ **Performance** - Otimizado para velocidade

## 🔧 Backend - API Robusta

### **Arquitetura Multi-Tenant**
```javascript
// Estrutura modular
src/
├── controllers/         # Lógica de negócio
├── modules/            # Funcionalidades específicas
│   ├── broadcast/      # Sistema de campanhas
│   ├── chip-maturation/ # Aquecimento de chips
│   └── webhooks/       # Processamento de eventos
├── providers/          # Integrações (Evolution, ZAPI)
├── services/           # Serviços compartilhados
└── utils/              # Utilitários
```

### **APIs Principais**
```bash
# Sistema
GET  /health                    # Status do sistema
GET  /status                    # Métricas gerais

# Instâncias
GET  /instance/fetchInstances   # Listar instâncias
POST /instance/create           # Criar instância
GET  /instance/:name/status     # Status específico

# Mensagens
POST /message/sendText          # Enviar texto
POST /message/sendMedia         # Enviar mídia
POST /broadcast/csv             # Campanha CSV

# Webhooks
POST /webhook/order-expired     # Carrinho abandonado
POST /webhook/order-paid        # Pagamento confirmado
```

## 📱 Integração WhatsApp

### **Evolution API**
- **Servidor:** http://128.140.7.154:8080
- **Versão:** 2.3.1
- **Protocolo:** Baileys (oficial WhatsApp)

### **Funcionalidades**
- ✅ **Multi-instância** - Múltiplos números simultâneos
- ✅ **Webhooks** - Eventos em tempo real
- ✅ **Mídia** - Imagens, vídeos, documentos
- ✅ **Grupos** - Gestão de grupos WhatsApp

## 🛡️ Sistema Anti-Ban

### **Estratégia Conti Chips**
```
Fase 1: Standby (24h)     →  0 mensagens
Fase 2: Aquecimento (7d)  →  10-30 mensagens/dia
Fase 3: Crescimento (7d)  →  30-50 mensagens/dia
Fase 4: Maduro (∞)        →  70-100 mensagens/dia
```

### **Proteções Implementadas**
- ⏱️ **Delays humanizados** - 30-120s entre mensagens
- 🔄 **Rotação de instâncias** - Distribuição inteligente
- 📊 **Monitoramento** - Alertas de risco
- 🚨 **Auto-pause** - Parada automática em problemas

## 📡 Sistema de Broadcast

### **Funcionalidades**
- 📝 **Templates** - Modelos de mensagem reutilizáveis
- 📋 **CSV Import** - Listas de contatos
- 📊 **Analytics** - Métricas de entrega
- ⚡ **Performance** - Até 10k mensagens/hora

### **Fluxo de Trabalho**
```
1. Upload CSV → 2. Selecionar Template → 3. Configurar Campanha → 4. Executar → 5. Monitorar
```

## 🔗 Sistema de Webhooks

### **E-commerce Integration**
```javascript
// Carrinho abandonado
POST /webhook/order-expired
{
  "orderId": "12345",
  "customerPhone": "5511999999999",
  "customerName": "João Silva",
  "orderValue": 299.90,
  "products": [...]
}

// Pagamento confirmado  
POST /webhook/order-paid
{
  "orderId": "12345",
  "status": "paid",
  "paymentMethod": "pix"
}
```

## 📊 Monitoramento e Analytics

### **Métricas Principais**
- 📈 **Mensagens enviadas** - Total e por período
- 📊 **Taxa de entrega** - Sucesso vs falhas
- 🎯 **Conversões** - ROI de campanhas
- 🔥 **Saúde dos chips** - Status de aquecimento

### **Alertas Automáticos**
- 🚨 **Instância offline** - Notificação imediata
- ⚠️ **Taxa de erro alta** - Acima de 5%
- 🔥 **Chip em risco** - Comportamento suspeito

## 🚀 Script de Gerenciamento Unificado

### **Comandos Principais**
```bash
./start.sh                  # Desenvolvimento (padrão)
./start.sh production       # Produção otimizada
./start.sh status          # Verificar status
./start.sh health          # Teste de saúde
./start.sh logs            # Logs em tempo real
./start.sh stop            # Parar sistema
./start.sh restart         # Reiniciar
./start.sh help            # Ajuda completa
```

### **Funcionalidades Avançadas**
- 🔄 **Auto-restart** - Reinício automático em falhas
- 📊 **Monitoramento** - Acompanhamento de processos
- 🎨 **Interface colorida** - Output amigável
- ⚡ **Build automático** - Compilação inteligente

## 🗂️ Estrutura de Arquivos

```
OracleWA-SaaS/
├── apps/
│   ├── api/              # Backend Node.js
│   │   ├── src/
│   │   │   ├── modules/  # Funcionalidades
│   │   │   ├── providers/ # Integrações
│   │   │   └── utils/    # Utilitários
│   │   └── package.json
│   └── dashboard/        # Frontend Next.js
│       ├── src/
│       │   ├── app/      # Páginas (App Router)
│       │   ├── components/ # Componentes UI
│       │   └── lib/      # Bibliotecas
│       └── package.json
├── clients/              # Configurações de clientes
├── config/               # Configurações globais
├── docs/                # Documentação
├── infrastructure/      # Docker & K8s
├── scripts/             # Scripts utilitários
├── start.sh            # Script principal
└── stop.sh             # Script de parada
```

## 🎯 Cases de Uso

### **1. E-commerce (Recuperação de Carrinho)**
```
Cliente abandona carrinho → Webhook disparado → Mensagem automática → Conversão
```

### **2. Broadcast Marketing**
```
Lista de leads → Template personalizado → Campanha em massa → Analytics
```

### **3. Atendimento Multi-canal**
```
WhatsApp + Site + App → Centralização no dashboard → Gestão unificada
```

## 📈 Métricas de Performance

### **Capacidade do Sistema**
- **10.000 mensagens/hora** por instância madura
- **Múltiplas instâncias** simultâneas
- **Latência < 2s** para webhooks
- **99.9% uptime** com monitoramento

### **Escalabilidade**
- **Horizontal** - Adicionar mais instâncias
- **Vertical** - Mais recursos por servidor
- **Multi-tenant** - Múltiplos clientes isolados

## 🛠️ Próximos Passos

1. **📖 Operação:** [Como usar diariamente](../user-guides/DAILY-OPERATIONS.md)
2. **📡 Broadcast:** [Configurar campanhas](../user-guides/BROADCAST-GUIDE.md)
3. **🔧 Técnico:** [Arquitetura detalhada](../technical/ARCHITECTURE.md)

---

**🎯 O OracleWA SaaS v3.1 é uma solução completa e profissional para automação WhatsApp em escala empresarial!**

*📅 Documento atualizado: 12/08/2025*