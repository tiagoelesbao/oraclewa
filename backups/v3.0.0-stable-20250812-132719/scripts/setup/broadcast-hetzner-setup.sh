#!/bin/bash

# Script específico para o ambiente Hetzner do Império
# Para ser executado na VPS 128.140.7.154

echo "🚀 SETUP BROADCAST - HETZNER IMPÉRIO"
echo "===================================="

# Detectar configuração atual
cd /opt/whatsapp-imperio

# Verificar containers Evolution ativos
echo "📊 Verificando containers Evolution ativos..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep evolution

echo ""
echo "🔍 Verificando instâncias Evolution disponíveis..."

# Função para testar conectividade com instância
test_evolution_instance() {
    local instance_name=$1
    local port=$2
    
    echo "Testando ${instance_name} na porta ${port}..."
    
    # Teste básico de conectividade
    if curl -s --connect-timeout 5 "http://localhost:${port}/instance/list" \
       -H "apikey: ${EVOLUTION_API_KEY}" > /tmp/test_${instance_name}.json 2>/dev/null; then
        
        echo "✅ ${instance_name}: API respondendo"
        
        # Verificar se já existe instância broadcast
        if grep -q "broadcast-imperio" /tmp/test_${instance_name}.json 2>/dev/null; then
            echo "⚠️  ${instance_name}: Já possui instância broadcast"
        else
            echo "🎯 ${instance_name}: Disponível para nova instância"
        fi
        
        return 0
    else
        echo "❌ ${instance_name}: Não respondendo"
        return 1
    fi
}

# Testar todas as possíveis instâncias baseado no docker-compose
AVAILABLE_INSTANCES=()

# Verificar instâncias padrão do docker-compose
for i in {1..4}; do
    port=$((8080 + $i))
    if test_evolution_instance "evolution-${i}" "$port"; then
        AVAILABLE_INSTANCES+=("evolution-${i}:${port}")
    fi
done

# Se nenhuma instância padrão, testar as do código atual
if [ ${#AVAILABLE_INSTANCES[@]} -eq 0 ]; then
    echo "🔍 Testando instâncias do código atual..."
    
    if test_evolution_instance "imperio1" "8081"; then
        AVAILABLE_INSTANCES+=("imperio1:8081")
    fi
    
    if test_evolution_instance "imperio3" "8083"; then
        AVAILABLE_INSTANCES+=("imperio3:8083")
    fi
fi

echo ""
echo "📋 Instâncias disponíveis: ${#AVAILABLE_INSTANCES[@]}"

if [ ${#AVAILABLE_INSTANCES[@]} -eq 0 ]; then
    echo "❌ Nenhuma instância Evolution encontrada!"
    echo "Verifique se os containers estão rodando:"
    echo "  docker ps | grep evolution"
    exit 1
fi

# Selecionar primeira instância disponível
SELECTED_INSTANCE=(${AVAILABLE_INSTANCES[0]//:/ })
INSTANCE_CONTAINER=${SELECTED_INSTANCE[0]}
INSTANCE_PORT=${SELECTED_INSTANCE[1]}

echo "🎯 Usando instância: ${INSTANCE_CONTAINER} (porta ${INSTANCE_PORT})"
echo ""

# Configurar variáveis
BROADCAST_INSTANCE_NAME="broadcast-imperio-$(date +%Y%m%d)"
WEBHOOK_URL="https://oraclewa-imperio.up.railway.app/api/broadcast/webhook"

# Verificar se EVOLUTION_API_KEY está definido
if [ -z "$EVOLUTION_API_KEY" ]; then
    echo "⚠️  EVOLUTION_API_KEY não está definido!"
    echo "Execute: export EVOLUTION_API_KEY='sua-chave-aqui'"
    echo ""
    echo "🔍 Tentando encontrar a chave nos arquivos..."
    
    # Procurar chave em arquivos comuns
    if [ -f ".env" ]; then
        KEY=$(grep "EVOLUTION_API_KEY" .env | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if [ ! -z "$KEY" ]; then
            export EVOLUTION_API_KEY="$KEY"
            echo "✅ Chave encontrada no .env: ${EVOLUTION_API_KEY:0:10}..."
        fi
    fi
    
    if [ -f "docker-compose.yml" ]; then
        KEY=$(grep "AUTHENTICATION_API_KEY" docker-compose.yml | head -1 | cut -d':' -f3 | tr -d '}' | tr -d '-' | tr -d ' ')
        if [ ! -z "$KEY" ]; then
            export EVOLUTION_API_KEY="$KEY"
            echo "✅ Chave encontrada no docker-compose: ${EVOLUTION_API_KEY:0:10}..."
        fi
    fi
    
    if [ -z "$EVOLUTION_API_KEY" ]; then
        echo "❌ Não foi possível encontrar EVOLUTION_API_KEY automaticamente"
        exit 1
    fi
fi

echo "🔑 Usando API Key: ${EVOLUTION_API_KEY:0:10}..."
echo ""

# Função para criar instância broadcast
create_broadcast_instance() {
    echo "📱 Criando instância broadcast: ${BROADCAST_INSTANCE_NAME}"
    
    # Criar instância
    CREATE_RESPONSE=$(curl -s -X POST \
      "http://localhost:${INSTANCE_PORT}/instance/create" \
      -H "Content-Type: application/json" \
      -H "apikey: ${EVOLUTION_API_KEY}" \
      -d '{
        "instanceName": "'${BROADCAST_INSTANCE_NAME}'",
        "qrcode": true,
        "integration": "WHATSAPP-BAILEYS"
      }')
    
    echo "📋 Resposta da criação:"
    echo "$CREATE_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_RESPONSE"
    echo ""
    
    # Aguardar um momento para inicialização
    sleep 3
    
    # Configurar webhook
    echo "🔗 Configurando webhook..."
    WEBHOOK_RESPONSE=$(curl -s -X POST \
      "http://localhost:${INSTANCE_PORT}/webhook/set/${BROADCAST_INSTANCE_NAME}" \
      -H "Content-Type: application/json" \
      -H "apikey: ${EVOLUTION_API_KEY}" \
      -d '{
        "url": "'${WEBHOOK_URL}'",
        "events": ["MESSAGES_UPDATE", "MESSAGES_UPSERT", "CONNECTION_UPDATE"]
      }')
    
    echo "📋 Resposta do webhook:"
    echo "$WEBHOOK_RESPONSE" | jq . 2>/dev/null || echo "$WEBHOOK_RESPONSE"
    echo ""
    
    # Obter QR Code
    echo "📱 Obtendo QR Code..."
    QR_RESPONSE=$(curl -s -X GET \
      "http://localhost:${INSTANCE_PORT}/instance/connect/${BROADCAST_INSTANCE_NAME}" \
      -H "apikey: ${EVOLUTION_API_KEY}")
    
    # Salvar QR Code
    echo "$QR_RESPONSE" > "/tmp/qrcode_${BROADCAST_INSTANCE_NAME}.json"
    
    # Tentar extrair e mostrar QR Code
    QR_CODE=$(echo "$QR_RESPONSE" | jq -r '.qrcode' 2>/dev/null)
    
    if [ "$QR_CODE" != "null" ] && [ ! -z "$QR_CODE" ]; then
        echo "✅ QR Code gerado com sucesso!"
        echo ""
        echo "📱 QR CODE PARA ESCANEAR:"
        echo "========================"
        
        # Tentar mostrar QR no terminal se qrencode estiver disponível
        if command -v qrencode &> /dev/null; then
            echo "$QR_CODE" | qrencode -t ANSI
        else
            # Mostrar como texto (pode ser escaneado por alguns apps)
            echo "$QR_CODE"
        fi
        
        echo ""
        echo "💾 QR Code salvo em: /tmp/qrcode_${BROADCAST_INSTANCE_NAME}.json"
        
    else
        echo "❌ Não foi possível obter QR Code"
        echo "Resposta completa:"
        echo "$QR_RESPONSE"
    fi
    
    echo ""
    echo "✅ Instância broadcast configurada!"
    echo "📱 Nome da instância: ${BROADCAST_INSTANCE_NAME}"
    echo "🌐 Porta Evolution: ${INSTANCE_PORT}"
    echo "🔗 Container: ${INSTANCE_CONTAINER}"
}

# Função para verificar instância existente
check_existing_instance() {
    echo "🔍 Verificando instâncias broadcast existentes..."
    
    INSTANCES_RESPONSE=$(curl -s -X GET \
      "http://localhost:${INSTANCE_PORT}/instance/list" \
      -H "apikey: ${EVOLUTION_API_KEY}")
    
    # Procurar por instâncias broadcast
    BROADCAST_INSTANCES=$(echo "$INSTANCES_RESPONSE" | jq -r '.instances[]? | select(.instance.instanceName | contains("broadcast")) | .instance.instanceName' 2>/dev/null)
    
    if [ ! -z "$BROADCAST_INSTANCES" ]; then
        echo "📱 Instâncias broadcast encontradas:"
        echo "$BROADCAST_INSTANCES"
        echo ""
        
        # Verificar status de cada uma
        for instance in $BROADCAST_INSTANCES; do
            STATUS_RESPONSE=$(curl -s -X GET \
              "http://localhost:${INSTANCE_PORT}/instance/connectionState/${instance}" \
              -H "apikey: ${EVOLUTION_API_KEY}")
            
            STATE=$(echo "$STATUS_RESPONSE" | jq -r '.instance.state' 2>/dev/null)
            echo "📊 ${instance}: ${STATE}"
        done
        
        echo ""
        read -p "Criar nova instância mesmo assim? (s/N): " -r
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo "Operação cancelada."
            exit 0
        fi
    fi
}

# Função principal
main() {
    echo "🚀 INICIANDO CONFIGURAÇÃO DE BROADCAST"
    echo ""
    
    # Verificar instâncias existentes
    check_existing_instance
    
    # Criar nova instância
    create_broadcast_instance
    
    echo ""
    echo "📋 INFORMAÇÕES PARA CONFIGURAÇÃO NO RAILWAY:"
    echo "============================================="
    echo "EVOLUTION_API_URL=http://128.140.7.154:${INSTANCE_PORT}"
    echo "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}"
    echo "EVOLUTION_BROADCAST_INSTANCE_1=${BROADCAST_INSTANCE_NAME}"
    echo "BROADCAST_MODULE_ENABLED=true"
    echo ""
    
    echo "🎯 PRÓXIMOS PASSOS:"
    echo "=================="
    echo "1. 📱 Escaneie o QR Code com WhatsApp dedicado ao broadcast"
    echo "2. 🚂 Adicione as variáveis acima no Railway"
    echo "3. ⏳ Aguarde redeploy automático do Railway"
    echo "4. ✅ Teste o sistema com: curl http://128.140.7.154:3000/api/broadcast/status"
    echo ""
    
    echo "📞 Para verificar conexão:"
    echo "curl -H 'apikey: ${EVOLUTION_API_KEY}' http://localhost:${INSTANCE_PORT}/instance/connectionState/${BROADCAST_INSTANCE_NAME}"
    echo ""
    
    echo "✅ Setup concluído!"
}

# Executar função principal
main