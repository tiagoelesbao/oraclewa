#!/bin/bash

# 🚀 TESTE DIRETO DE BROADCAST - SERVIDOR HETZNER
# Execute este comando direto no servidor

echo "🧪 TESTE DE BROADCAST DIRETO - HETZNER"
echo "======================================"
echo "📱 Enviando para: Tiago (5511959761948)"
echo ""

# Configurações
EVOLUTION_URL="http://localhost:8080"
API_KEY="Imperio2024@EvolutionSecure"
INSTANCE_NAME="imperio1"  # Ajuste para sua instância ativa
PHONE="5511959761948"

# Ler imagem base64 (se existir)
if [ -f "oraclewa-logo-base64.txt" ]; then
    IMAGE_BASE64=$(cat oraclewa-logo-base64.txt)
    echo "✅ Imagem carregada"
else
    echo "⚠️  Arquivo de imagem não encontrado, enviando só texto"
    IMAGE_BASE64=""
fi

# Mensagem de teste
MESSAGE="🧪 *TESTE BROADCAST HETZNER*

Olá Tiago! 👋

✅ Teste executado direto do servidor
🖼️ Evolution API funcionando
📱 Instância: $INSTANCE_NAME
⏰ Horário: $(date '+%H:%M:%S')

*OracleWA™ - Sistema Império*"

# Função para enviar mensagem com imagem
send_with_image() {
    echo "📤 Enviando mensagem COM imagem..."
    
    curl -X POST "$EVOLUTION_URL/message/sendMedia/$INSTANCE_NAME" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"number\": \"$PHONE\",
            \"media\": \"$IMAGE_BASE64\",
            \"caption\": \"$MESSAGE\",
            \"fileName\": \"oraclewa-logo.png\"
        }" \
        --silent --show-error \
        -w "\n\nHTTP Status: %{http_code}\n"
}

# Função para enviar só texto
send_text_only() {
    echo "📤 Enviando mensagem SÓ TEXTO..."
    
    curl -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE_NAME" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"number\": \"$PHONE\",
            \"text\": \"$MESSAGE\"
        }" \
        --silent --show-error \
        -w "\n\nHTTP Status: %{http_code}\n"
}

# Verificar se instância existe e está conectada
echo "🔍 Verificando instância $INSTANCE_NAME..."
STATUS=$(curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")

if [[ "$STATUS" == *"open"* ]]; then
    echo "✅ Instância conectada e pronta"
    echo ""
    
    # Enviar mensagem
    if [ -n "$IMAGE_BASE64" ]; then
        send_with_image
    else
        send_text_only
    fi
    
    echo ""
    echo "✅ Teste concluído! Verifique o WhatsApp"
else
    echo "❌ Instância não está conectada ou não existe"
    echo "Status: $STATUS"
    echo ""
    echo "💡 Tente listar instâncias disponíveis:"
    echo "curl -X GET \"$EVOLUTION_URL/instance/fetchInstances\" -H \"apikey: $API_KEY\""
fi