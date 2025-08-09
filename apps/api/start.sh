#!/bin/bash

echo "🚀 Iniciando OracleWA - Recuperação Império"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Copiando .env.example para .env..."
    cp .env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas configurações antes de continuar."
    exit 1
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir e iniciar os serviços
echo "🔨 Construindo imagens..."
docker-compose build

echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker-compose ps

# Mostrar logs da aplicação
echo "📋 Logs da aplicação (últimas 20 linhas):"
docker-compose logs --tail=20 app

echo ""
echo "✅ Sistema iniciado!"
echo ""
echo "📱 Para conectar as instâncias WhatsApp:"
echo "   1. Acesse http://localhost:3000/api/instances/status"
echo "   2. Gere o QR Code para cada instância em /api/instances/{instanceId}/qrcode"
echo ""
echo "🔍 Para verificar os logs:"
echo "   docker-compose logs -f [serviço]"
echo ""
echo "🛑 Para parar o sistema:"
echo "   docker-compose down"