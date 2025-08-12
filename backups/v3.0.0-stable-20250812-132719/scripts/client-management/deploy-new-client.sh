#!/bin/bash

# ================================================
# SCRIPT DE DEPLOY PARA NOVO CLIENTE
# Cria ambiente isolado em menos de 30 minutos
# ================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validar parâmetros
if [ "$#" -lt 2 ]; then
    echo -e "${RED}Uso: $0 <client_id> <client_name> [services]${NC}"
    echo -e "${YELLOW}Exemplo: $0 novocliente 'Novo Cliente Ltda' 'recovery,broadcast'${NC}"
    echo -e "${YELLOW}Services disponíveis: recovery, broadcast, all (padrão)${NC}"
    exit 1
fi

CLIENT_ID=$1
CLIENT_NAME=$2
SERVICES=${3:-all}

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🚀 DEPLOY DE NOVO CLIENTE${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "Cliente ID: ${YELLOW}$CLIENT_ID${NC}"
echo -e "Cliente Nome: ${YELLOW}$CLIENT_NAME${NC}"
echo -e "Serviços: ${YELLOW}$SERVICES${NC}"
echo ""

# Função para gerar senha segura
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Função para criar arquivo .env do cliente
create_client_env() {
    local client_id=$1
    local client_name=$2
    local services=$3
    
    echo -e "${YELLOW}📝 Criando arquivo de configuração .env.${client_id}...${NC}"
    
    # Gerar senhas únicas
    DB_PASSWORD=$(generate_password)
    JWT_SECRET=$(generate_password)
    WEBHOOK_TOKEN=$(generate_password)
    API_KEY="sk-${client_id}-$(generate_password | cut -c1-16)"
    
    cat > .env.${client_id} <<EOF
# ================================================
# CONFIGURAÇÃO - CLIENTE: ${client_name}
# Gerado em: $(date)
# ================================================

# Identificação
CLIENT_ID=${client_id}
CLIENT_NAME="${client_name}"
SERVICE_TYPE=${services}

# Database (Isolado)
DB_HOST=${client_id}-db
DB_PORT=5432
DB_USER=${client_id}_user
DB_PASS=${DB_PASSWORD}

# Redis (Isolado)
REDIS_HOST=${client_id}-redis
REDIS_PORT=6379

# Evolution API
EVOLUTION_API_URL=http://128.140.7.154:8080
EVOLUTION_API_KEY=Imperio2024@EvolutionSecure
EVOLUTION_INSTANCE_NAME=${client_id}-instance-1

# Segurança
WEBHOOK_TOKEN=${WEBHOOK_TOKEN}
API_KEY=${API_KEY}
JWT_SECRET=${JWT_SECRET}

# Serviços específicos
RECOVERY_ENABLED=$([ "$services" == "all" ] || [ "$services" == "recovery" ] && echo "true" || echo "false")
BROADCAST_ENABLED=$([ "$services" == "all" ] || [ "$services" == "broadcast" ] && echo "true" || echo "false")
BROADCAST_ISOLATED=true

# Anti-ban
ANTIBAN_ENABLED=true
ANTIBAN_STRATEGY=conti_chips

# Logging
LOG_LEVEL=info
LOG_PREFIX=[${client_id^^}]
EOF
    
    echo -e "${GREEN}✅ Arquivo .env.${client_id} criado${NC}"
    
    # Salvar credenciais em arquivo seguro
    cat > credentials_${client_id}.txt <<EOF
================================================
CREDENCIAIS - ${client_name}
================================================
API Key: ${API_KEY}
Webhook Token: ${WEBHOOK_TOKEN}
Database Password: ${DB_PASSWORD}

GUARDE ESTAS INFORMAÇÕES EM LOCAL SEGURO!
================================================
EOF
    
    echo -e "${YELLOW}🔐 Credenciais salvas em credentials_${client_id}.txt${NC}"
}

# Função para criar docker-compose do cliente
create_client_docker_compose() {
    local client_id=$1
    local services=$2
    
    echo -e "${YELLOW}🐳 Criando docker-compose.${client_id}.yml...${NC}"
    
    cat > docker-compose.${client_id}.yml <<EOF
version: '3.8'

services:
EOF

    # Adicionar serviço de recovery se habilitado
    if [[ "$services" == "all" ]] || [[ "$services" == *"recovery"* ]]; then
        cat >> docker-compose.${client_id}.yml <<EOF
  ${client_id}-recovery:
    build: .
    container_name: ${client_id}-recovery
    env_file: .env.${client_id}
    environment:
      - SERVICE_TYPE=recovery
      - PORT=400${CLIENT_ID: -1}
    volumes:
      - ./src:/app/src:ro
      - ${client_id}-recovery-logs:/app/logs
    networks:
      - ${client_id}-network
    depends_on:
      - ${client_id}-db
      - ${client_id}-redis
    restart: unless-stopped

EOF
    fi

    # Adicionar serviço de broadcast se habilitado
    if [[ "$services" == "all" ]] || [[ "$services" == *"broadcast"* ]]; then
        cat >> docker-compose.${client_id}.yml <<EOF
  ${client_id}-broadcast:
    build: .
    container_name: ${client_id}-broadcast
    env_file: .env.${client_id}
    environment:
      - SERVICE_TYPE=broadcast
      - PORT=401${CLIENT_ID: -1}
    volumes:
      - ./src:/app/src:ro
      - ${client_id}-broadcast-logs:/app/logs
    networks:
      - ${client_id}-network
    depends_on:
      - ${client_id}-db
      - ${client_id}-redis
    restart: unless-stopped

EOF
    fi

    # Adicionar banco de dados e redis
    cat >> docker-compose.${client_id}.yml <<EOF
  ${client_id}-db:
    image: postgres:14-alpine
    container_name: ${client_id}-db
    env_file: .env.${client_id}
    environment:
      - POSTGRES_USER=\${DB_USER}
      - POSTGRES_PASSWORD=\${DB_PASS}
      - POSTGRES_DB=${client_id}
    volumes:
      - ${client_id}-db-data:/var/lib/postgresql/data
    networks:
      - ${client_id}-network
    restart: unless-stopped

  ${client_id}-redis:
    image: redis:7-alpine
    container_name: ${client_id}-redis
    command: redis-server --appendonly yes --maxmemory 256mb
    volumes:
      - ${client_id}-redis-data:/data
    networks:
      - ${client_id}-network
    restart: unless-stopped

networks:
  ${client_id}-network:
    name: ${client_id}-network
    driver: bridge

volumes:
  ${client_id}-db-data:
  ${client_id}-redis-data:
  ${client_id}-recovery-logs:
  ${client_id}-broadcast-logs:
EOF
    
    echo -e "${GREEN}✅ docker-compose.${client_id}.yml criado${NC}"
}

# Função para configurar Evolution API
setup_evolution_instance() {
    local client_id=$1
    
    echo -e "${YELLOW}📱 Configurando instância Evolution API...${NC}"
    
    # Criar script de setup da Evolution
    cat > setup_evolution_${client_id}.sh <<'EOF'
#!/bin/bash
CLIENT_ID=$1
EVOLUTION_URL="http://128.140.7.154:8080"
API_KEY="Imperio2024@EvolutionSecure"

# Criar instância
curl -X POST "${EVOLUTION_URL}/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: ${API_KEY}" \
  -d '{
    "instanceName": "'${CLIENT_ID}'-instance-1",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "mobile": false
  }'

echo "Instância ${CLIENT_ID}-instance-1 criada!"
EOF
    
    chmod +x setup_evolution_${client_id}.sh
    echo -e "${GREEN}✅ Script de setup Evolution criado${NC}"
}

# Função para iniciar containers
start_client_containers() {
    local client_id=$1
    
    echo -e "${YELLOW}🚀 Iniciando containers do cliente...${NC}"
    
    # Build da imagem se necessário
    if [ ! -f Dockerfile ]; then
        echo -e "${RED}❌ Dockerfile não encontrado!${NC}"
        exit 1
    fi
    
    # Iniciar containers
    docker-compose -f docker-compose.${client_id}.yml up -d --build
    
    # Aguardar containers subirem
    echo -e "${YELLOW}⏳ Aguardando containers iniciarem...${NC}"
    sleep 10
    
    # Verificar status
    docker-compose -f docker-compose.${client_id}.yml ps
    
    echo -e "${GREEN}✅ Containers iniciados${NC}"
}

# Função para criar estrutura de diretórios
create_client_directories() {
    local client_id=$1
    
    echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
    
    mkdir -p logs/${client_id}/{recovery,broadcast}
    mkdir -p config/${client_id}
    
    echo -e "${GREEN}✅ Diretórios criados${NC}"
}

# Função principal de deploy
main() {
    echo -e "${YELLOW}🎯 Iniciando deploy do cliente ${CLIENT_NAME}...${NC}"
    echo ""
    
    # Verificar se cliente já existe
    if [ -f ".env.${CLIENT_ID}" ]; then
        echo -e "${RED}❌ Cliente ${CLIENT_ID} já existe!${NC}"
        echo -e "${YELLOW}Para recriar, remova primeiro: rm -f .env.${CLIENT_ID} docker-compose.${CLIENT_ID}.yml${NC}"
        exit 1
    fi
    
    # Executar etapas do deploy
    create_client_directories "$CLIENT_ID"
    create_client_env "$CLIENT_ID" "$CLIENT_NAME" "$SERVICES"
    create_client_docker_compose "$CLIENT_ID" "$SERVICES"
    setup_evolution_instance "$CLIENT_ID"
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
    echo -e "1. Revisar configurações em: ${GREEN}.env.${CLIENT_ID}${NC}"
    echo -e "2. Iniciar containers: ${GREEN}docker-compose -f docker-compose.${CLIENT_ID}.yml up -d${NC}"
    echo -e "3. Configurar Evolution: ${GREEN}./setup_evolution_${CLIENT_ID}.sh ${CLIENT_ID}${NC}"
    echo -e "4. Verificar logs: ${GREEN}docker-compose -f docker-compose.${CLIENT_ID}.yml logs -f${NC}"
    echo ""
    echo -e "${YELLOW}📊 ENDPOINTS DO CLIENTE:${NC}"
    echo -e "Recovery: ${GREEN}http://localhost:400${CLIENT_ID: -1}${NC}"
    echo -e "Broadcast: ${GREEN}http://localhost:401${CLIENT_ID: -1}${NC}"
    echo -e "Health Check: ${GREEN}http://localhost:400${CLIENT_ID: -1}/health${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Guarde as credenciais do arquivo credentials_${CLIENT_ID}.txt${NC}"
    echo ""
    
    # Perguntar se deseja iniciar agora
    read -p "Deseja iniciar os containers agora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_client_containers "$CLIENT_ID"
    fi
}

# Executar
main