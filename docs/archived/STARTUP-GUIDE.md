# 🚀 OracleWA SaaS v3.1 - Guia de Inicialização

## 📋 Scripts Disponíveis

### 🎯 **Script Principal (Recomendado)**
```bash
# Inicialização inteligente - detecta automaticamente o melhor modo
./start.sh

# Forçar modo produção (otimizado, build completo)
./start.sh production

# Modo desenvolvimento será usado automaticamente se não especificado
```

### 🏭 **Modo Produção Completo**
```bash
# Script otimizado para produção com build automatizado
./start-production.sh

# Parar serviços
./start-production.sh stop

# Reiniciar serviços
./start-production.sh restart
```

### 🔧 **Modo Desenvolvimento**
```bash
# Desenvolvimento com hot reload
./quick-start.sh

# Forçar modo development mesmo com build existente
./quick-start.sh dev
```

### 📱 **Script Específico do Frontend (Legado)**
```bash
# Apenas para compatibilidade - use os scripts acima
./start-frontend.sh
```

## 🌟 **Recomendação para Produção**

Para ambiente de produção, use sempre:
```bash
./start.sh production
```

Este comando irá:
- ✅ Fazer build otimizado do frontend
- ✅ Iniciar backend em modo produção
- ✅ Iniciar frontend com build otimizado
- ✅ Monitorar processos automaticamente
- ✅ Reiniciar serviços em caso de falha
- ✅ Mostrar informações detalhadas do sistema

## 📊 **URLs do Sistema**

- **Frontend Dashboard:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## 🔍 **Verificação de Status**

```bash
# Verificar se está funcionando
curl http://localhost:3000/health

# Ver processos rodando
ps aux | grep -E "(node|next)"

# Ver logs em tempo real (se configurado)
tail -f logs/combined.log
```

## 🛑 **Como Parar**

- **Ctrl+C** no terminal do script
- Ou use: `./start-production.sh stop`

## 💡 **Dicas**

1. **Primeira execução:** O script irá instalar dependências automaticamente
2. **Build automático:** O modo produção faz build automaticamente
3. **Monitoramento:** Os processos são monitorados e reiniciados automaticamente
4. **Logs:** PIDs são salvos em `/tmp/oraclewa-*.pid` para controle

## 🚨 **Resolução de Problemas**

Se algo der errado:

```bash
# Parar todos os processos relacionados
pkill -f "node.*apps"
pkill -f "next"

# Limpar PIDs
rm -f /tmp/oraclewa-*.pid

# Reiniciar
./start.sh production
```