#!/bin/bash

echo "🚀 Evolution API Setup Script - OracleWA Império"
echo "=============================================="
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Por favor, execute como root (use sudo)"
  exit 1
fi

# Solicitar informações
read -p "Digite seu domínio para Evolution API (ex: api.seudominio.com): " DOMAIN
read -p "Digite uma senha forte para API Key: " API_KEY
read -p "Digite o email para SSL: " EMAIL

# Atualizar sistema
echo ""
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo ""
echo "🔧 Instalando dependências..."
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl ufw

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
mkdir -p /opt/evolution
cd /opt/evolution

# Criar docker-compose.yml
echo ""
echo "🐳 Criando docker-compose.yml..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.0.0
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - SERVER_URL=https://${DOMAIN}
      - AUTHENTICATION_API_KEY=${API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=mongodb://evolution:evolution_pass_2024@mongo:27017/evolution?authSource=admin
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
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
    volumes:
      - evolution_data:/evolution/instances
    depends_on:
      - mongo
    networks:
      - evolution-network

  mongo:
    image: mongo:6
    container_name: evolution_mongo
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=evolution
      - MONGO_INITDB_ROOT_PASSWORD=evolution_pass_2024
      - MONGO_INITDB_DATABASE=evolution
    volumes:
      - mongo_data:/data/db
    networks:
      - evolution-network

volumes:
  evolution_data:
  mongo_data:

networks:
  evolution-network:
    driver: bridge
EOF

# Iniciar containers
echo ""
echo "🚀 Iniciando Evolution API..."
docker-compose up -d

# Aguardar inicialização
echo ""
echo "⏳ Aguardando inicialização (30 segundos)..."
sleep 30

# Configurar Nginx
echo ""
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/evolution-api << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/evolution-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configurar SSL
echo ""
echo "🔒 Configurando SSL..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

# Criar script de criação de instâncias
echo ""
echo "📱 Criando script para instâncias WhatsApp..."
cat > /opt/evolution/criar_instancias.sh << 'EOF'
#!/bin/bash

API_URL="https://'${DOMAIN}'"
API_KEY="'${API_KEY}'"

echo "🚀 Criando 4 instâncias WhatsApp..."
echo ""

for i in {1..4}; do
  echo "📱 Criando instância imperio_$i..."
  
  RESPONSE=$(curl -s -X POST "$API_URL/instance/create" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "instanceName": "imperio_'$i'",
      "token": "",
      "qrcode": true,
      "integration": "WHATSAPP-BAILEYS"
    }')
  
  echo "Resposta: $RESPONSE"
  echo ""
  
  sleep 2
done

echo "✅ Instâncias criadas! Use o script obter_qrcodes.sh para conectar."
EOF

# Criar script para obter QR Codes
cat > /opt/evolution/obter_qrcodes.sh << 'EOF'
#!/bin/bash

API_URL="https://'${DOMAIN}'"
API_KEY="'${API_KEY}'"

echo "📱 Obtendo QR Codes das instâncias..."
echo ""

for i in {1..4}; do
  echo "==================================="
  echo "QR Code para imperio_$i:"
  echo "==================================="
  
  curl -s -X GET "$API_URL/instance/connect/imperio_$i" \
    -H "apikey: $API_KEY" | jq -r '.qrcode.base64' | sed 's/^data:image\/png;base64,//' | base64 -d > "qrcode_imperio_$i.png"
  
  echo "QR Code salvo em: qrcode_imperio_$i.png"
  echo ""
done

echo "✅ Use os arquivos PNG para escanear com WhatsApp!"
EOF

# Criar script de status
cat > /opt/evolution/verificar_status.sh << 'EOF'
#!/bin/bash

API_URL="https://'${DOMAIN}'"
API_KEY="'${API_KEY}'"

echo "📊 Status das instâncias:"
echo ""

for i in {1..4}; do
  echo -n "imperio_$i: "
  
  STATUS=$(curl -s -X GET "$API_URL/instance/connectionState/imperio_$i" \
    -H "apikey: $API_KEY" | jq -r '.instance.state // "não encontrada"')
  
  echo "$STATUS"
done
EOF

# Tornar scripts executáveis
chmod +x /opt/evolution/*.sh

# Criar serviço systemd
echo ""
echo "🔧 Criando serviço systemd..."
cat > /etc/systemd/system/evolution-api.service << EOF
[Unit]
Description=Evolution API
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/evolution
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
ExecReload=/usr/bin/docker-compose restart

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable evolution-api

# Informações finais
echo ""
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo "======================="
echo ""
echo "📋 INFORMAÇÕES IMPORTANTES:"
echo "  - URL da API: https://${DOMAIN}"
echo "  - API Key: ${API_KEY}"
echo "  - Diretório: /opt/evolution"
echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo "  1. Execute: cd /opt/evolution && ./criar_instancias.sh"
echo "  2. Execute: ./obter_qrcodes.sh"
echo "  3. Escaneie os QR Codes com WhatsApp"
echo "  4. Execute: ./verificar_status.sh"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Reiniciar: docker-compose restart"
echo "  - Status: ./verificar_status.sh"
echo ""
echo "🚀 Configure estas variáveis no Railway:"
echo "  EVOLUTION_API_URL=https://${DOMAIN}"
echo "  EVOLUTION_API_KEY=${API_KEY}"
echo ""