# 🎨 Frontend Dashboard - Guia Completo

> **Versão:** 1.0.0  
> **Stack:** Next.js 14 + TypeScript + Tailwind CSS  
> **Status:** ✅ Implementado e Funcional

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Páginas Implementadas](#páginas-implementadas)
5. [Componentes UI](#componentes-ui)
6. [Integração com Backend](#integração-com-backend)
7. [Como Usar](#como-usar)
8. [Desenvolvimento](#desenvolvimento)

## 🎯 Visão Geral

O Frontend Dashboard é uma interface moderna e responsiva para gerenciar o sistema OracleWA SaaS. Desenvolvido com as tecnologias mais recentes, oferece uma experiência de usuário profissional e intuitiva.

### Características Principais
- ✅ **Design Moderno:** Interface limpa e profissional
- ✅ **Responsivo:** Funciona em desktop e mobile
- ✅ **Type-Safe:** TypeScript para desenvolvimento seguro
- ✅ **Performance:** Otimizado com Next.js 14
- ✅ **Real-time Ready:** Preparado para dados em tempo real

## 🛠️ Tecnologias Utilizadas

### Core
- **Next.js 14.2.31** - Framework React com SSR/SSG
- **React 18.2** - Biblioteca UI
- **TypeScript 5.3** - Type safety

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **Headless UI** - Componentes acessíveis
- **Heroicons** - Ícones SVG otimizados

### State & Data
- **React Query** - Cache e sincronização
- **Axios** - Cliente HTTP
- **React Hook Form** - Gestão de formulários
- **Zod** - Validação de schemas

### Visualização
- **Recharts** - Gráficos e charts
- **Date-fns** - Manipulação de datas

## 📁 Estrutura do Projeto

```
apps/dashboard/
├── src/
│   ├── app/                  # Páginas e rotas (App Router)
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── clients/          # Gestão de clientes
│   │   ├── instances/        # Painel de instâncias
│   │   ├── layout.tsx        # Layout principal
│   │   └── page.tsx          # Home (redirect)
│   │
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── dashboard/       # Componentes específicos
│   │       └── StatsCard.tsx
│   │
│   ├── lib/                 # Utilitários e configurações
│   │   ├── api.ts          # Cliente API
│   │   └── utils.ts        # Funções auxiliares
│   │
│   └── types/              # TypeScript types
│       └── index.ts        # Definições de tipos
│
├── public/                 # Assets estáticos
├── tailwind.config.js     # Configuração Tailwind
├── next.config.js         # Configuração Next.js
└── package.json           # Dependências
```

## 📱 Páginas Implementadas

### 1. Dashboard (`/dashboard`)
**Status:** ✅ Completo

Visão geral do sistema com:
- Cards de estatísticas (clientes, instâncias, mensagens)
- Atividade recente
- Status das instâncias
- Ações rápidas

**Componentes:**
- `StatsCard` - Cards de métricas
- `RecentActivity` - Lista de atividades
- `InstanceStatus` - Status em tempo real

### 2. Clientes (`/clients`)
**Status:** ✅ Completo

Gestão completa de clientes:
- Lista de clientes com filtros
- Informações detalhadas
- Estatísticas por cliente
- Ações de gerenciamento

**Features:**
- Busca em tempo real
- Filtros por status
- Cards expandidos com detalhes

### 3. Instâncias (`/instances`)
**Status:** ✅ Completo

Painel de instâncias WhatsApp:
- Status de conexão
- Informações de perfil
- Métricas de uso
- Gestão de QR Code

**Dados Exibidos:**
- Nome e telefone
- Status (online/offline/conectando)
- Mensagens processadas
- Última atividade

## 🧩 Componentes UI

### Componentes Base

#### Button
```tsx
<Button 
  variant="primary|secondary|outline|ghost|danger"
  size="sm|md|lg"
  loading={false}
  leftIcon={<Icon />}
>
  Click me
</Button>
```

#### Card
```tsx
<Card variant="default|border|shadow|elevated">
  <Card.Header>Title</Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

#### Badge
```tsx
<Badge 
  variant="default|success|warning|error|info"
  size="sm|md|lg"
>
  Status
</Badge>
```

### Sistema de Cores

```javascript
// Paleta Principal
oracle: {
  500: '#0ea5e9',  // Cor principal
  600: '#0284c7',  // Hover
  700: '#0369a1',  // Active
}

success: '#22c55e'  // Verde
warning: '#f59e0b'  // Amarelo
error: '#ef4444'    // Vermelho
```

## 🔌 Integração com Backend

### API Client (`lib/api.ts`)

O cliente API está configurado com:
- **Base URL:** http://localhost:3000
- **Interceptors:** Auth e error handling
- **TypeScript:** Types completos

### Endpoints Configurados

```typescript
// Sistema
api.getSystemHealth()
api.getSystemDashboard()

// Clientes
api.getClients()
api.getClient(clientId)
api.createClient(data)
api.updateClient(clientId, data)

// Instâncias
api.getInstances()
api.getInstance(instanceName)
api.getInstanceQRCode(instanceName)

// Broadcast
api.getBroadcastCampaigns()
api.sendBroadcast(data)

// Templates
api.getTemplates()
api.createTemplate(data)
```

## 🚀 Como Usar

### Iniciar o Frontend

```bash
# Navegar para o diretório
cd apps/dashboard

# Instalar dependências (se necessário)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Acessar no Navegador
```
http://localhost:3001
```

### Build para Produção

```bash
# Criar build otimizada
npm run build

# Iniciar servidor de produção
npm start
```

## 💻 Desenvolvimento

### Adicionar Nova Página

1. Criar diretório em `src/app/[nome-pagina]/`
2. Adicionar `page.tsx`:

```tsx
export default function NovaPagina() {
  return (
    <div>
      <h1>Nova Página</h1>
    </div>
  );
}
```

3. Adicionar ao menu em `components/layout/Sidebar.tsx`

### Criar Novo Componente

```tsx
// components/ui/MeuComponente.tsx
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function MeuComponente({ className, children }: Props) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

### Adicionar Novo Endpoint

```typescript
// lib/api.ts
async getNewEndpoint(): Promise<DataType> {
  const response = await this.client.get<ApiResponse<DataType>>('/api/new-endpoint');
  return response.data.data!;
}
```

## 🐛 Troubleshooting

### Erro: "Cannot find module '@tailwindcss/forms'"
```bash
npm install @tailwindcss/forms @tailwindcss/typography
```

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Build falha
```bash
# Verificar TypeScript
npm run type-check

# Verificar ESLint
npm run lint
```

## 📈 Próximos Passos

### Em Desenvolvimento
- [ ] Página de Broadcast
- [ ] Página de Templates
- [ ] Sistema de Webhooks
- [ ] Analytics Dashboard

### Planejado
- [ ] Autenticação/Login
- [ ] Dark Mode
- [ ] Internacionalização (i18n)
- [ ] Testes E2E

## 📝 Notas de Versão

### v1.0.0 (12/12/2025)
- ✅ Implementação inicial
- ✅ Dashboard, Clientes, Instâncias
- ✅ Sistema de componentes UI
- ✅ Integração com API preparada
- ✅ Design responsivo completo

---

**Última atualização:** 12/12/2025  
**Maintainer:** OracleWA Team