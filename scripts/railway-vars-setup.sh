#!/bin/bash

# Script para configurar todas as variáveis de ambiente no Railway
echo "🔧 Configurando variáveis de ambiente no Railway..."

# Verificar se railway CLI está disponível
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

# Configurar variáveis essenciais
echo "📡 Configurando Evolution API..."
railway variables set EVOLUTION_API_URL="http://128.140.7.154:8080"
railway variables set EVOLUTION_API_KEY="Imperio2024@EvolutionSecure"

echo "📱 Configurando instâncias WhatsApp..."
railway variables set WHATSAPP_INSTANCES="imperio1"
railway variables set EVOLUTION_BROADCAST_INSTANCE_1="broadcast-imperio-hoje"

echo "🔐 Configurando segurança..."
railway variables set JWT_SECRET="821c79a12ae3d39559406040127beb33a27bbe185fd3e3ba7dd340a5177bdeb6"
railway variables set NODE_ENV="production"

echo "⚙️ Configurando aplicação..."
railway variables set APP_PORT="3000"
railway variables set PORT="3000"
railway variables set LOG_LEVEL="info"

echo "🚀 Configurando limites e features..."
railway variables set RATE_LIMIT_PER_INSTANCE="600"
railway variables set BROADCAST_MODULE_ENABLED="true"
railway variables set SKIP_DB="true"

echo "🛡️ Configurando anti-ban..."
railway variables set ANTIBAN_ENABLED="true"
railway variables set ANTIBAN_DEFAULT_STRATEGY="conti_chips"
railway variables set ANTIBAN_DELAY_MIN="30"
railway variables set ANTIBAN_DELAY_MAX="120"

echo "🎯 Configurando features..."
railway variables set FEATURE_DASHBOARD="true"
railway variables set FEATURE_ANALYTICS="true"
railway variables set FEATURE_WEBHOOKS="true"
railway variables set FEATURE_BROADCAST="true"
railway variables set FEATURE_RECOVERY="true"
railway variables set FEATURE_TEMPLATES="true"

echo "🌐 Configurando CORS..."
railway variables set CORS_ORIGIN="*"
railway variables set CORS_CREDENTIALS="true"

echo "📊 Configurando limites de cliente..."
railway variables set DEFAULT_CLIENT_DAILY_LIMIT="500"
railway variables set DEFAULT_CLIENT_HOURLY_LIMIT="50"

echo "✅ Todas as variáveis configuradas!"
echo "🔄 O Railway fará redeploy automaticamente..."
echo ""
echo "🌐 Aguarde alguns minutos e teste:"
echo "   https://oraclewa-imperio-production.up.railway.app/health"