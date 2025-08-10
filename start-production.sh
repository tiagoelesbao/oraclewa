#!/bin/bash

# ================================================
# ORACLEWA SAAS v3.0 - INICIALIZAÇÃO PRODUÇÃO
# ================================================

echo "🚀 Iniciando OracleWA SaaS v3.0 em Produção..."

# Verificar diretório
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

# Configurar ambiente
export NODE_ENV=production
export APP_PORT=3000
export SKIP_DB=true
export SKIP_REDIS=true

# Evolution API - Hetzner
export EVOLUTION_API_URL=http://128.140.7.154:8080
export EVOLUTION_API_KEY=Imperio2024@EvolutionSecure

# Número de teste
export TEST_PHONE_NUMBER=5511959761948

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar conexão com Evolution API
echo "🔍 Verificando conexão com Evolution API..."
curl -s -H "apikey: $EVOLUTION_API_KEY" $EVOLUTION_API_URL/instance/fetchInstances > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Evolution API conectada!"
else
    echo "⚠️  Aviso: Evolution API pode estar inacessível"
fi

# Iniciar aplicação
echo "🌟 Iniciando aplicação na porta $APP_PORT..."
echo "📍 URL Local: http://localhost:$APP_PORT"
echo "📍 Health Check: http://localhost:$APP_PORT/health"
echo "📍 Dashboard: http://localhost:$APP_PORT/api/management/dashboard"
echo ""
echo "========================================="
echo "INSTÂNCIAS CONFIGURADAS:"
echo "========================================="
echo "✅ imperio1 (Baileys) - ATIVA - Webhooks"
echo "⏳ imperio-zapi (Z-API) - PENDENTE - Webhooks alternativo"
echo "⏳ broadcast-imperio-1 (Baileys) - PENDENTE"
echo "⏳ broadcast-imperio-2 (Baileys) - PENDENTE"
echo "⏳ broadcast-imperio-3 (Baileys) - PENDENTE"
echo "========================================="
echo ""

# Iniciar Node.js
node apps/api/src/index.js