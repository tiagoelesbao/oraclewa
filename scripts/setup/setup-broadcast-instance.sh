#!/bin/bash

# Script para configurar instância Evolution dedicada ao Broadcast
# Uso: ./setup-broadcast-instance.sh

echo "🚀 Configuração de Instância Broadcast - OracleWA"
echo "================================================="

# Variáveis de configuração
EVOLUTION_API_URL="${EVOLUTION_API_URL:-http://localhost:8080}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY}"
INSTANCE_NAME="broadcast-dedicado"
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/broadcast/webhook}"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}📱 Configurando instância: ${INSTANCE_NAME}${NC}"

# 1. Criar instância
echo -e "\n${GREEN}1. Criando instância...${NC}"
CREATE_RESPONSE=$(curl -s -X POST \
  "${EVOLUTION_API_URL}/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -d '{
    "instanceName": "'${INSTANCE_NAME}'",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }')

echo "Resposta: ${CREATE_RESPONSE}"

# 2. Configurar webhooks
echo -e "\n${GREEN}2. Configurando webhooks...${NC}"
WEBHOOK_RESPONSE=$(curl -s -X POST \
  "${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -d '{
    "url": "'${WEBHOOK_URL}'",
    "webhook_by_events": false,
    "events": [
      "MESSAGES_UPDATE",
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED"
    ]
  }')

echo "Webhooks configurados: ${WEBHOOK_RESPONSE}"

# 3. Gerar QR Code
echo -e "\n${GREEN}3. Gerando QR Code...${NC}"
echo -e "${YELLOW}⚠️  IMPORTANTE: Escaneie o QR Code com o WhatsApp dedicado ao broadcast${NC}"

QR_RESPONSE=$(curl -s -X GET \
  "${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}")

# Extrair QR Code da resposta
QR_CODE=$(echo ${QR_RESPONSE} | grep -o '"qrcode":"[^"]*' | sed 's/"qrcode":"//')

if [ ! -z "${QR_CODE}" ]; then
  echo -e "\n${GREEN}📱 QR Code gerado com sucesso!${NC}"
  echo -e "${YELLOW}Escaneie este QR Code no WhatsApp:${NC}\n"
  
  # Salvar QR Code em arquivo
  echo ${QR_CODE} > broadcast_qrcode.txt
  echo -e "QR Code salvo em: broadcast_qrcode.txt"
  
  # Tentar exibir QR Code no terminal (se qrencode estiver instalado)
  if command -v qrencode &> /dev/null; then
    echo ${QR_CODE} | qrencode -t UTF8
  else
    echo -e "\n${QR_CODE}\n"
  fi
else
  echo -e "${RED}❌ Erro ao gerar QR Code${NC}"
fi

# 4. Verificar status
echo -e "\n${GREEN}4. Verificando status da conexão...${NC}"
sleep 5

STATUS_RESPONSE=$(curl -s -X GET \
  "${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}")

echo "Status: ${STATUS_RESPONSE}"

# 5. Salvar configuração
echo -e "\n${GREEN}5. Salvando configuração...${NC}"
cat > broadcast_config.json << EOF
{
  "instanceName": "${INSTANCE_NAME}",
  "apiUrl": "${EVOLUTION_API_URL}",
  "webhookUrl": "${WEBHOOK_URL}",
  "createdAt": "$(date -Iseconds)",
  "status": "configured"
}
EOF

echo -e "${GREEN}✅ Configuração salva em: broadcast_config.json${NC}"

echo -e "\n${GREEN}🎉 Instância broadcast configurada com sucesso!${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Escaneie o QR Code com o WhatsApp dedicado"
echo "2. Aguarde a conexão ser estabelecida"
echo "3. Execute: npm run test:broadcast"
echo ""
echo "Para verificar status: curl ${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME} -H 'apikey: ${EVOLUTION_API_KEY}'"