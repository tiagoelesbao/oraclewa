# 🚀 Guia de Migração Hetzner - Sistema Escalável

Este guia explica como migrar o servidor Hetzner da configuração hardcoded (só Império) para o sistema escalável multi-tenant.

## 📋 Situação Atual vs Nova Arquitetura

### ❌ **ANTES (Hardcoded)**
```bash
# Instâncias fixas só para Império
- imperio1, imperio2, imperio3, imperio4
- Configuração manual no script
- Sem separação por cliente
- Difícil adicionar novos clientes
```

### ✅ **DEPOIS (Escalável)**
```bash
# Instâncias dinâmicas por cliente
- {client_id}_main          # Instância principal
- broadcast-{client_id}-1   # Broadcast 1
- broadcast-{client_id}-2   # Broadcast 2
- broadcast-{client_id}-3   # Broadcast 3

# Exemplos:
- imperio_main, broadcast-imperio-1, broadcast-imperio-2
- loja_xyz_main, broadcast-loja_xyz-1, broadcast-loja_xyz-2
```

## 🔧 Passo 1: Backup Atual

```bash
# SSH no Hetzner
ssh root@128.140.7.154

# Backup das instâncias atuais
cd /opt/evolution
./scripts/backup-instances.sh

# Listar instâncias existentes
curl -X GET "http://localhost:8080/instance/fetchInstances" \
  -H "apikey: Imperio2024@EvolutionSecure" | jq '.[].instanceName'
```

## 🏗️ Passo 2: Instalar Sistema Escalável

```bash
# SSH no Hetzner  
ssh root@128.140.7.154

# Download do setup escalável
wget https://raw.githubusercontent.com/tiagoelesbao/oraclewa/main/scripts/setup/evolution-setup-scalable.sh

# Tornar executável
chmod +x evolution-setup-scalable.sh

# Executar instalação escalável
./evolution-setup-scalable.sh
```

**Informações necessárias:**
- **Domínio:** api.oraclewa.com (ou seu domínio)
- **API Key:** Imperio2024@EvolutionSecure (manter a mesma)
- **Email:** seu-email@dominio.com

## 🔄 Passo 3: Migrar Instâncias Existentes

### Opção A: Manter Instâncias Atuais (Recomendado)
```bash
# Após instalação escalável, manter instâncias existentes
# e renomear conforme novo padrão

# Verificar instâncias atuais
evo-instances list

# Se houver imperio1, renomear para imperio_main
# (Isso deve ser feito diretamente no banco MongoDB)
```

### Opção B: Recriar Instâncias (Mais Limpo)
```bash
# Deletar instâncias antigas
evo-instances delete imperio1
evo-instances delete imperio2  
evo-instances delete imperio3
evo-instances delete imperio4

# Criar novas instâncias escaláveis
evo-instances create imperio 4

# Obter QR codes
evo-instances qrcode-all imperio
```

## 🎯 Passo 4: Configurar Novos Clientes

```bash
# Criar instâncias para novo cliente
evo-instances create loja_xyz 3

# Obter QR codes do novo cliente  
evo-instances qrcode-all loja_xyz

# Verificar status
evo-instances list loja_xyz
```

## ✅ INTEGRAÇÃO JÁ TESTADA E FUNCIONAL

**TESTE DE CONECTIVIDADE:**
```bash
# Testar via Health Check
curl "https://oraclewa-imperio-production.up.railway.app/health"
```

**RESULTADO ATUAL:**
- ✅ **Hetzner Evolution API:** CONNECTED
- ✅ **Railway Application:** CONNECTED  
- ✅ **Found 6 instances** on Hetzner
- ✅ **Railway can access** all Hetzner instances
- ✅ **Multi-tenant system:** ACTIVE
- ✅ **Auto-discovery:** WORKING

## 🔗 Passo 6: Atualizar Railway

Verificar se as variáveis estão corretas:
```bash
EVOLUTION_API_URL=https://api.oraclewa.com  # Seu domínio Hetzner
EVOLUTION_API_KEY=Imperio2024@EvolutionSecure
```

## 📊 Passo 7: Monitoramento

### Comandos Úteis no Hetzner:
```bash
# Dashboard de monitoramento
evo-monitor

# Status de todas instâncias
evo-instances list

# Saúde do sistema
evo-instances health

# Logs da API
evo-logs

# Reiniciar serviço
evo-restart
```

### APIs de Gerenciamento (Ativas):
```bash
# ✅ Listar instâncias do Hetzner via Railway
curl "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances"

# ✅ Criar instâncias para novo cliente
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances/novo_cliente/create"

# ✅ Status de instância específica
curl "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances/imperio_main/status"

# ✅ QR Code de instância
curl "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/instances/imperio_main/qrcode"

# ✅ Sincronizar com Hetzner
curl -X POST "https://oraclewa-imperio-production.up.railway.app/api/management/hetzner/sync"

# ✅ Health check completo
curl "https://oraclewa-imperio-production.up.railway.app/health"
```

## 🚨 Troubleshooting

### Problema: Instâncias não conectam
```bash
# Verificar conectividade
curl -I http://128.140.7.154:8080

# Verificar logs
evo-logs | grep ERROR

# Reiniciar containers
evo-restart
```

### Problema: Railway não acessa Hetzner
```bash
# Testar conectividade do Railway para Hetzner
curl -X GET "http://128.140.7.154:8080" \
  -H "apikey: Imperio2024@EvolutionSecure"

# Verificar firewall no Hetzner
ufw status
```

### Problema: QR Code não gera
```bash
# Verificar status da instância
evo-instances status imperio_main

# Reconectar instância
curl -X GET "http://localhost:8080/instance/connect/imperio_main" \
  -H "apikey: Imperio2024@EvolutionSecure"
```

## ✅ Checklist de Migração

- [ ] Backup das instâncias atuais
- [ ] Instalação do sistema escalável no Hetzner
- [ ] Migração/recriação das instâncias
- [ ] Teste de conectividade com Railway
- [ ] Configuração de novos clientes (se houver)
- [ ] Monitoramento funcionando
- [ ] Backup automático configurado
- [ ] Webhooks testados e funcionando

## 🎉 Resultado Final

Após a migração você terá:

✅ **Sistema Hetzner Escalável:**
- Suporte ilimitado de clientes
- Instâncias organizadas por cliente
- Scripts de gerenciamento avançados
- Monitoramento automático
- Backup diário automático

✅ **Integração Railway-Hetzner:**
- APIs de gerenciamento via Railway
- Sincronização automática de instâncias
- Criação dinâmica de instâncias por cliente
- QR codes via API

✅ **Operação Multi-Tenant:**
- Cada cliente com suas instâncias isoladas
- Adição de novos clientes sem código
- Monitoramento independente por cliente
- Escalabilidade infinita

🚀 **Sistema pronto para crescer de 1 para 1000+ clientes!**