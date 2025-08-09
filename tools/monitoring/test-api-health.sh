#!/bin/bash

echo "🏥 TESTE DE SAÚDE DA API - Evolution"
echo "================================="

EVOLUTION_URL="https://oraclewa-imperio-production.up.railway.app"
API_KEY="Imperio2024@EvolutionSecure"

# Teste 1: API está viva?
echo "📡 1. Testando conectividade da API..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EVOLUTION_URL")
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 404 ]; then
    echo "✅ API está respondendo (HTTP: $STATUS)"
else
    echo "❌ API não está respondendo (HTTP: $STATUS)"
    exit 1
fi

# Teste 2: Listar instâncias
echo "📱 2. Testando endpoint de instâncias..."
INSTANCES=$(curl -s -X GET "$EVOLUTION_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json")

if [[ "$INSTANCES" == *"imperio"* ]] || [[ "$INSTANCES" == "[]" ]]; then
    echo "✅ Endpoint de instâncias funcionando"
    echo "📋 Instâncias encontradas: $(echo "$INSTANCES" | jq -r 'length // 0' 2>/dev/null || echo "N/A")"
else
    echo "❌ Endpoint de instâncias com problema"
    echo "Response: $INSTANCES"
fi

# Teste 3: Verificar se império1 ainda existe e está problemática
echo "🔍 3. Verificando status da instância problemática..."
IMPERIO_STATUS=$(curl -s -X GET "$EVOLUTION_URL/instance/connectionState/imperio1" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json")

if [[ "$IMPERIO_STATUS" == *"close"* ]] || [[ "$IMPERIO_STATUS" == *"open"* ]]; then
    echo "⚠️  Instância imperio1 ainda existe"
    echo "Status: $IMPERIO_STATUS"
    echo "💡 Recomendação: Deletar e recriar"
else
    echo "✅ Instância imperio1 não está mais ativa"
fi

echo ""
echo "📊 DIAGNÓSTICO FINAL:"
if [ "$STATUS" -eq 200 ] && [[ "$INSTANCES" != *"Cannot GET"* ]]; then
    echo "✅ Sistema ESTÁVEL - Pode prosseguir com recuperação e broadcast"
else
    echo "❌ Sistema INSTÁVEL - Necessário intervenção manual"
fi