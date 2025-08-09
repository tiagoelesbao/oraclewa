#!/bin/bash

# EXECUTE ESTE COMANDO DIRETO NO SERVIDOR HETZNER
# ssh root@148.113.20.71

echo "🔧 INICIANDO CORREÇÃO AUTOMÁTICA..."

# 1. Para o container
echo "1️⃣ Parando container Evolution..."
docker stop evolution-imperio-container

# 2. Remove instância corrompida
echo "2️⃣ Removendo instância imperio1 corrompida..."
docker rm -f evolution-imperio-container

# 3. Recria container limpo
echo "3️⃣ Recriando container Evolution limpo..."
docker run -d \
  --name evolution-imperio-container \
  -p 8080:8080 \
  -e PORT=8080 \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_URL="postgresql://postgres:password@postgres:5432/oraclewa?schema=evolution" \
  -e AUTHENTICATION_API_KEY="Imperio2024@EvolutionSecure" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e CONFIG_SESSION_PHONE_CLIENT="OracleWA - Imperio" \
  -e LOG_LEVEL=warn \
  -e DEL_INSTANCE=false \
  -v evolution_store:/evolution/store \
  evoapicloud/evolution-api:latest

# 4. Aguarda container iniciar
echo "4️⃣ Aguardando 20 segundos para estabilizar..."
sleep 20

# 5. Cria nova instância para recuperação
echo "5️⃣ Criando instância imperio-recovery..."
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: Imperio2024@EvolutionSecure" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "imperio-recovery",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

echo ""
echo "✅ CORREÇÃO APLICADA!"
echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo "1. Leia o QR Code da nova instância"
echo "2. Configure webhook no Railway"
echo "3. Teste envio de mensagem"
echo ""
echo "Para ver o QR Code:"
echo "curl http://localhost:8080/instance/connect/imperio-recovery -H 'apikey: Imperio2024@EvolutionSecure'"