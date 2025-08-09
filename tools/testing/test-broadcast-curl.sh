#!/bin/bash

# Teste de broadcast com imagem - OracleWA Império
# Substitua o número abaixo pelo seu número de teste

EVOLUTION_URL="https://oraclewa-imperio-production.up.railway.app"
API_KEY="Imperio2024@EvolutionSecure"
INSTANCE="broadcast-imperio-hoje"
TEST_NUMBER="5511959761948"  # ⚠️  SUBSTITUA pelo seu número de teste

# Ler base64 da imagem
BASE64_IMAGE=$(cat oraclewa-logo-base64.txt)

echo "🚀 Testando broadcast com imagem..."
echo "📱 Enviando para: $TEST_NUMBER"
echo "🖼️  Imagem: OracleWA Logo ($(echo "$BASE64_IMAGE" | wc -c) caracteres)"

# Enviar mensagem com imagem
curl -X POST "$EVOLUTION_URL/message/sendMedia/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$TEST_NUMBER\",
    \"media\": \"$BASE64_IMAGE\",
    \"caption\": \"🎯 *TESTE BROADCAST IMPÉRIO*\n\n🏆 Sistema funcionando perfeitamente!\n\n💰 Imagem carregada via base64\n📞 Pronto para disparos em massa\n\n*OracleWA™ - Recuperação de Vendas*\",
    \"fileName\": \"oraclewa-logo.png\"
  }" \
  --max-time 30 \
  --show-error \
  --silent

echo -e "\n✅ Teste concluído!"
echo "📋 Verifique o WhatsApp para confirmar o recebimento"