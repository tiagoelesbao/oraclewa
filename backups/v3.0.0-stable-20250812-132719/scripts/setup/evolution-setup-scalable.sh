#!/bin/bash

echo "🚀 Evolution API Setup Script - SCALABLE MULTI-TENANT"
echo "===================================================="
echo "🏗️ This setup supports unlimited clients and instances"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Por favor, execute como root (use sudo)"
  exit 1
fi

# Solicitar informações
read -p "Digite seu domínio para Evolution API (ex: api.oraclewa.com): " DOMAIN
read -p "Digite uma senha forte para API Key (recomendado: 32+ caracteres): " API_KEY
read -p "Digite o email para SSL: " EMAIL

# Atualizar sistema
echo ""
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo ""
echo "🔧 Instalando dependências..."
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl ufw jq

# Adicionar usuário ao grupo docker
usermod -aG docker $SUDO_USER

# Configurar firewall
echo ""
echo "🔥 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Criar diretório
echo ""
echo "📁 Criando estrutura de diretórios..."
mkdir -p /opt/evolution-scalable/{scripts,backups,logs}
cd /opt/evolution-scalable

# Criar docker-compose.yml ESCALÁVEL
echo ""
echo "🐳 Criando docker-compose.yml escalável..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.0.0
    container_name: evolution_api_scalable
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - SERVER_URL=https://${DOMAIN}
      - AUTHENTICATION_API_KEY=${API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=mongodb://evolution:evolution_scalable_2024@mongo:27017/evolution_scalable?authSource=admin
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution_scalable
      - RABBITMQ_ENABLED=false
      - WEBSOCKET_ENABLED=true
      - CHATWOOT_ENABLED=false
      - S3_ENABLED=false
      - LOG_LEVEL=INFO
      - DEL_INSTANCE=false
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      - INSTANCE_EXPIRATION_TIME=false
      - TELEGRAM_ENABLED=false
      # Configurações para alta capacidade
      - NODE_OPTIONS=--max-old-space-size=4096
      - MAX_PAYLOAD_SIZE=100mb
      - MAX_LISTENERS=1000
    volumes:
      - evolution_data:/evolution/instances
      - evolution_logs:/evolution/logs
    depends_on:
      - mongo
    networks:
      - evolution-network
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  mongo:
    image: mongo:6
    container_name: evolution_mongo_scalable
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=evolution
      - MONGO_INITDB_ROOT_PASSWORD=evolution_scalable_2024
      - MONGO_INITDB_DATABASE=evolution_scalable
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    networks:
      - evolution-network
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    command: mongod --wiredTigerCacheSizeGB 1.5

  mongo-express:
    image: mongo-express:latest
    container_name: evolution_mongo_express
    restart: always
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=evolution
      - ME_CONFIG_MONGODB_ADMINPASSWORD=evolution_scalable_2024
      - ME_CONFIG_MONGODB_URL=mongodb://evolution:evolution_scalable_2024@mongo:27017/
      - ME_CONFIG_BASICAUTH_USERNAME=admin
      - ME_CONFIG_BASICAUTH_PASSWORD=${API_KEY}
    depends_on:
      - mongo
    networks:
      - evolution-network

volumes:
  evolution_data:
    driver: local
  evolution_logs:
    driver: local
  mongo_data:
    driver: local
  mongo_config:
    driver: local

networks:
  evolution-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

# Iniciar containers
echo ""
echo "🚀 Iniciando Evolution API Scalable..."
docker-compose up -d

# Aguardar inicialização
echo ""
echo "⏳ Aguardando inicialização (45 segundos)..."
sleep 45

# Configurar Nginx ESCALÁVEL
echo ""
echo "🌐 Configurando Nginx para alta disponibilidade..."
cat > /etc/nginx/sites-available/evolution-scalable << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=webhook:10m rate=50r/s;

# Upstream para load balancing (futuro)
upstream evolution_backend {
    server localhost:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://evolution_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
        proxy_connect_timeout 300;
        
        # Buffer settings for high volume
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://evolution_backend/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }

    # Webhook endpoints (higher rate limit)
    location /webhook {
        limit_req zone=webhook burst=100 nodelay;
        proxy_pass http://evolution_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60;
        proxy_send_timeout 60;
    }

    # Admin panel (restricted)
    location /mongo-express {
        auth_basic "Evolution Admin";
        auth_basic_user_file /etc/nginx/.htpasswd_evolution;
        proxy_pass http://localhost:8081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Logs
    access_log /var/log/nginx/evolution-scalable-access.log;
    error_log /var/log/nginx/evolution-scalable-error.log;
}
EOF

# Criar arquivo de senha para admin
echo ""
echo "🔒 Configurando autenticação para admin..."
htpasswd -cb /etc/nginx/.htpasswd_evolution admin $API_KEY

# Ativar site
ln -sf /etc/nginx/sites-available/evolution-scalable /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configurar SSL
echo ""
echo "🔒 Configurando SSL..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

# Criar SCRIPT ESCALÁVEL de gerenciamento de instâncias
echo ""
echo "📱 Criando scripts escaláveis..."

# Script principal de gerenciamento
cat > /opt/evolution-scalable/scripts/instance-manager.sh << 'EOF'
#!/bin/bash

API_URL="https://'${DOMAIN}'"
API_KEY="'${API_KEY}'"

show_help() {
    echo "🔧 OracleWA Instance Manager - Scalable"
    echo "======================================"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <client_id> <count>     - Create instances for client (default: 4)"
    echo "  delete <instance_name>         - Delete specific instance"
    echo "  list [client_id]              - List all instances or for specific client"
    echo "  status <instance_name>        - Get instance status"
    echo "  qrcode <instance_name>        - Get QR code for instance"
    echo "  qrcode-all <client_id>        - Get QR codes for all client instances"
    echo "  connect <instance_name>       - Connect instance"
    echo "  disconnect <instance_name>    - Disconnect instance"
    echo "  restart-api                   - Restart Evolution API"
    echo "  health                        - Check API health"
    echo ""
    echo "Examples:"
    echo "  $0 create imperio 4           - Create 4 instances for Imperio client"
    echo "  $0 create loja_xyz 2          - Create 2 instances for Loja XYZ client"
    echo "  $0 list imperio               - List Imperio instances"
    echo "  $0 status imperio_main        - Check imperio_main status"
    echo "  $0 qrcode-all imperio         - Get all QR codes for Imperio"
    echo ""
}

create_instances() {
    local client_id=$1
    local count=${2:-4}
    
    if [ -z "$client_id" ]; then
        echo "❌ Client ID required"
        exit 1
    fi
    
    echo "🚀 Creating $count instances for client: $client_id"
    echo ""
    
    # Create main instance
    echo "📱 Creating main instance: ${client_id}_main"
    create_single_instance "${client_id}_main"
    
    # Create broadcast instances
    for i in $(seq 1 $((count-1))); do
        echo "📱 Creating broadcast instance: broadcast-${client_id}-$i"
        create_single_instance "broadcast-${client_id}-$i"
    done
    
    echo ""
    echo "✅ All instances created for client: $client_id"
    echo "📋 Use: $0 qrcode-all $client_id to get QR codes"
}

create_single_instance() {
    local instance_name=$1
    
    RESPONSE=$(curl -s -X POST "$API_URL/instance/create" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "instanceName": "'$instance_name'",
            "token": "",
            "qrcode": true,
            "integration": "WHATSAPP-BAILEYS",
            "webhook": "",
            "webhook_by_events": false,
            "chatwoot_account_id": "",
            "chatwoot_token": "",
            "chatwoot_url": "",
            "reject_call": false,
            "msg_call": "",
            "groups_ignore": true,
            "always_online": true,
            "read_messages": false,
            "read_status": false,
            "sync_full_history": false
        }')
    
    echo "Instance: $instance_name"
    echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "Response: $RESPONSE"
    echo ""
    sleep 2
}

list_instances() {
    local client_filter=$1
    
    echo "📋 Listing instances..."
    echo ""
    
    RESPONSE=$(curl -s -X GET "$API_URL/instance/fetchInstances" \
        -H "apikey: $API_KEY")
    
    if [ -n "$client_filter" ]; then
        echo "Instances for client: $client_filter"
        echo $RESPONSE | jq -r '.[] | select(.instanceName | contains("'$client_filter'")) | .instanceName + " - " + .state' 2>/dev/null || echo "Error parsing response"
    else
        echo "All instances:"
        echo $RESPONSE | jq -r '.[] | .instanceName + " - " + .state' 2>/dev/null || echo "Error parsing response"
    fi
}

get_status() {
    local instance_name=$1
    
    if [ -z "$instance_name" ]; then
        echo "❌ Instance name required"
        exit 1
    fi
    
    echo "📊 Status for: $instance_name"
    
    RESPONSE=$(curl -s -X GET "$API_URL/instance/connectionState/$instance_name" \
        -H "apikey: $API_KEY")
    
    echo $RESPONSE | jq '.' 2>/dev/null || echo "Response: $RESPONSE"
}

get_qrcode() {
    local instance_name=$1
    
    if [ -z "$instance_name" ]; then
        echo "❌ Instance name required"
        exit 1
    fi
    
    echo "📱 Getting QR Code for: $instance_name"
    
    RESPONSE=$(curl -s -X GET "$API_URL/instance/connect/$instance_name" \
        -H "apikey: $API_KEY")
    
    # Save QR code image
    echo $RESPONSE | jq -r '.qrcode.base64' 2>/dev/null | sed 's/^data:image\/png;base64,//' | base64 -d > "/opt/evolution-scalable/qrcode_${instance_name}.png" 2>/dev/null
    
    if [ -f "/opt/evolution-scalable/qrcode_${instance_name}.png" ]; then
        echo "✅ QR Code saved: /opt/evolution-scalable/qrcode_${instance_name}.png"
        echo "📱 Scan this QR code with WhatsApp"
    else
        echo "Response: $RESPONSE"
    fi
}

get_all_qrcodes() {
    local client_id=$1
    
    if [ -z "$client_id" ]; then
        echo "❌ Client ID required"
        exit 1
    fi
    
    echo "📱 Getting all QR Codes for client: $client_id"
    echo ""
    
    # Get instances for this client
    INSTANCES=$(curl -s -X GET "$API_URL/instance/fetchInstances" \
        -H "apikey: $API_KEY" | jq -r '.[] | select(.instanceName | contains("'$client_id'")) | .instanceName' 2>/dev/null)
    
    for instance in $INSTANCES; do
        echo "Getting QR Code for: $instance"
        get_qrcode $instance
        echo ""
    done
}

check_health() {
    echo "🏥 Checking Evolution API health..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" -H "apikey: $API_KEY")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "✅ Evolution API is healthy (HTTP $HTTP_CODE)"
        
        # Check instances count
        INSTANCE_COUNT=$(curl -s -X GET "$API_URL/instance/fetchInstances" -H "apikey: $API_KEY" | jq '. | length' 2>/dev/null)
        echo "📱 Total instances: $INSTANCE_COUNT"
        
        # Check system resources
        echo ""
        echo "💻 System Resources:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        
    else
        echo "❌ Evolution API is unhealthy (HTTP $HTTP_CODE)"
    fi
}

# Main command router
case "$1" in
    "create")
        create_instances "$2" "$3"
        ;;
    "delete")
        if [ -z "$2" ]; then
            echo "❌ Instance name required"
            exit 1
        fi
        curl -X DELETE "$API_URL/instance/delete/$2" -H "apikey: $API_KEY"
        ;;
    "list")
        list_instances "$2"
        ;;
    "status")
        get_status "$2"
        ;;
    "qrcode")
        get_qrcode "$2"
        ;;
    "qrcode-all")
        get_all_qrcodes "$2"
        ;;
    "connect")
        if [ -z "$2" ]; then
            echo "❌ Instance name required"
            exit 1
        fi
        curl -X GET "$API_URL/instance/connect/$2" -H "apikey: $API_KEY"
        ;;
    "disconnect")
        if [ -z "$2" ]; then
            echo "❌ Instance name required"
            exit 1
        fi
        curl -X DELETE "$API_URL/instance/logout/$2" -H "apikey: $API_KEY"
        ;;
    "restart-api")
        cd /opt/evolution-scalable && docker-compose restart
        ;;
    "health")
        check_health
        ;;
    *)
        show_help
        ;;
esac
EOF

# Script de backup automático
cat > /opt/evolution-scalable/scripts/backup-instances.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/evolution-scalable/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Starting Evolution API backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup MongoDB
echo "📦 Backing up MongoDB..."
docker exec evolution_mongo_scalable mongodump --out /data/backup/$DATE --authenticationDatabase admin -u evolution -p evolution_scalable_2024

# Copy MongoDB backup
docker cp evolution_mongo_scalable:/data/backup/$DATE "$BACKUP_DIR/$DATE/mongodb"

# Backup Evolution instances data
echo "📱 Backing up instances data..."
docker cp evolution_api_scalable:/evolution/instances "$BACKUP_DIR/$DATE/instances"

# Create archive
echo "🗜️ Creating archive..."
cd "$BACKUP_DIR"
tar -czf "evolution_backup_$DATE.tar.gz" "$DATE"
rm -rf "$DATE"

# Keep only last 7 backups
ls -t evolution_backup_*.tar.gz | tail -n +8 | xargs -r rm --

echo "✅ Backup completed: evolution_backup_$DATE.tar.gz"
EOF

# Script de monitoramento
cat > /opt/evolution-scalable/scripts/monitor.sh << 'EOF'
#!/bin/bash

API_URL="https://'${DOMAIN}'"
API_KEY="'${API_KEY}'"

echo "📊 Evolution API Monitoring Dashboard"
echo "======================================"
echo "Timestamp: $(date)"
echo ""

# API Health
echo "🏥 API Health Check:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" -H "apikey: $API_KEY")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "  ✅ API Status: HEALTHY (HTTP $HTTP_CODE)"
else
    echo "  ❌ API Status: UNHEALTHY (HTTP $HTTP_CODE)"
fi

# Container Status
echo ""
echo "🐳 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep evolution

# System Resources
echo ""
echo "💻 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep evolution

# Instance Summary
echo ""
echo "📱 Instance Summary:"
TOTAL_INSTANCES=$(curl -s -X GET "$API_URL/instance/fetchInstances" -H "apikey: $API_KEY" | jq '. | length' 2>/dev/null)
CONNECTED_INSTANCES=$(curl -s -X GET "$API_URL/instance/fetchInstances" -H "apikey: $API_KEY" | jq '[.[] | select(.state == "open")] | length' 2>/dev/null)

echo "  Total Instances: $TOTAL_INSTANCES"
echo "  Connected: $CONNECTED_INSTANCES"
echo "  Disconnected: $((TOTAL_INSTANCES - CONNECTED_INSTANCES))"

# Recent logs
echo ""
echo "📋 Recent API Logs (last 20 lines):"
docker logs --tail 20 evolution_api_scalable 2>/dev/null | tail -10

echo ""
echo "======================================"
echo "Monitoring completed at $(date)"
EOF

# Tornar scripts executáveis
chmod +x /opt/evolution-scalable/scripts/*.sh

# Criar cron job para backup automático
echo ""
echo "⏰ Configurando backup automático..."
echo "0 2 * * * root /opt/evolution-scalable/scripts/backup-instances.sh >> /opt/evolution-scalable/logs/backup.log 2>&1" > /etc/cron.d/evolution-backup

# Criar cron job para monitoramento
echo "*/10 * * * * root /opt/evolution-scalable/scripts/monitor.sh >> /opt/evolution-scalable/logs/monitor.log 2>&1" > /etc/cron.d/evolution-monitor

# Criar serviço systemd
echo ""
echo "🔧 Criando serviço systemd..."
cat > /etc/systemd/system/evolution-scalable.service << EOF
[Unit]
Description=Evolution API Scalable Multi-Tenant
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/evolution-scalable
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
ExecReload=/usr/bin/docker-compose restart
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable evolution-scalable

# Criar alias convenientes
echo ""
echo "🔗 Criando aliases..."
cat >> /root/.bashrc << EOF

# Evolution Scalable Aliases
alias evo='cd /opt/evolution-scalable'
alias evo-instances='/opt/evolution-scalable/scripts/instance-manager.sh'
alias evo-backup='/opt/evolution-scalable/scripts/backup-instances.sh'
alias evo-monitor='/opt/evolution-scalable/scripts/monitor.sh'
alias evo-logs='docker logs -f evolution_api_scalable'
alias evo-restart='cd /opt/evolution-scalable && docker-compose restart'
EOF

# Informações finais
echo ""
echo "✅ INSTALAÇÃO SCALABLE CONCLUÍDA!"
echo "================================="
echo ""
echo "📋 INFORMAÇÕES:"
echo "  🌐 URL da API: https://${DOMAIN}"
echo "  🔑 API Key: ${API_KEY}"
echo "  📁 Diretório: /opt/evolution-scalable"
echo "  🗄️ Admin Panel: https://${DOMAIN}/mongo-express (user: admin, pass: API_KEY)"
echo ""
echo "🛠️ COMANDOS PRINCIPAIS:"
echo "  evo-instances create imperio 4    # Criar 4 instâncias para Império"
echo "  evo-instances create loja_xyz 2   # Criar 2 instâncias para Loja XYZ"
echo "  evo-instances list                # Listar todas instâncias"
echo "  evo-instances qrcode-all imperio  # QR codes do Império"
echo "  evo-monitor                       # Dashboard de monitoramento"
echo "  evo-backup                        # Backup manual"
echo ""
echo "📱 CRIAR PRIMEIRA INSTÂNCIA:"
echo "  1. evo-instances create imperio 4"
echo "  2. evo-instances qrcode-all imperio"
echo "  3. Escaneie os QR codes com WhatsApp"
echo "  4. evo-instances list imperio"
echo ""
echo "🔧 VARIÁVEIS PARA RAILWAY:"
echo "  EVOLUTION_API_URL=https://${DOMAIN}"
echo "  EVOLUTION_API_KEY=${API_KEY}"
echo ""
echo "🎯 SISTEMA PREPARADO PARA ESCALA INFINITA!"
echo "   - Suporte a ilimitados clientes"
echo "   - Instâncias isoladas por cliente"
echo "   - Backup automático diário"
echo "   - Monitoramento a cada 10 minutos"
echo "   - Interface admin para debug"
echo ""