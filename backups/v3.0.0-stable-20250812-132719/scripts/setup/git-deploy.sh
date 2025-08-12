#!/bin/bash

echo "🚀 Deploy OracleWA via Git/GitHub"
echo "================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não encontrado! Instalando...${NC}"
    sudo apt update && sudo apt install -y git
fi

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando GitHub CLI...${NC}"
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update && sudo apt install -y gh
fi

echo -e "${BLUE}📋 Configurando Git...${NC}"

# Pedir dados do usuário se não existirem
if ! git config --global user.name > /dev/null 2>&1; then
    read -p "Digite seu nome para o Git: " git_name
    git config --global user.name "$git_name"
fi

if ! git config --global user.email > /dev/null 2>&1; then
    read -p "Digite seu email do GitHub: " git_email
    git config --global user.email "$git_email"
fi

echo -e "${GREEN}✅ Git configurado!${NC}"
echo -e "${BLUE}Nome:${NC} $(git config --global user.name)"
echo -e "${BLUE}Email:${NC} $(git config --global user.email)"

# Inicializar repositório
echo -e "${YELLOW}📁 Inicializando repositório Git...${NC}"
git init

# Adicionar arquivos
echo -e "${YELLOW}📦 Adicionando arquivos...${NC}"
git add .

# Commit inicial
echo -e "${YELLOW}💾 Fazendo commit inicial...${NC}"
git commit -m "🚀 Initial commit - OracleWA Recuperação Império

- Sistema completo de recuperação de vendas via WhatsApp
- 4 instâncias Evolution API com rotação automática
- Webhooks para order.expired e order.paid
- Templates personalizáveis de mensagens
- Sistema de filas com Bull Queue
- Monitoramento e logs detalhados
- Deploy otimizado para Railway

🔧 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Login no GitHub
echo -e "${BLUE}🔐 Fazendo login no GitHub...${NC}"
echo -e "${YELLOW}⚠️  Uma janela do navegador vai abrir para autenticação${NC}"
gh auth login --web

# Criar repositório no GitHub
echo -e "${YELLOW}📋 Criando repositório no GitHub...${NC}"
read -p "Nome do repositório (Enter para 'oraclewa-imperio'): " repo_name
repo_name=${repo_name:-oraclewa-imperio}

read -p "Repositório público? (Y/n): " is_public
is_public=${is_public:-Y}

if [[ $is_public =~ ^[Yy]$ ]]; then
    visibility="--public"
else
    visibility="--private"
fi

# Criar repositório
gh repo create "$repo_name" $visibility --description "🚀 OracleWA - Sistema de recuperação de vendas via WhatsApp com Evolution API" --clone=false

# Adicionar remote
git remote add origin "https://github.com/$(gh api user --jq .login)/$repo_name.git"

# Push para GitHub
echo -e "${BLUE}🚀 Enviando código para GitHub...${NC}"
git branch -M main
git push -u origin main

# Obter URL do repositório
REPO_URL="https://github.com/$(gh api user --jq .login)/$repo_name"

echo -e "${GREEN}🎉 Repositório criado com sucesso!${NC}"
echo -e "${BLUE}🌐 URL do repositório:${NC} $REPO_URL"

# Perguntar sobre deploy no Railway
echo ""
read -p "Deseja fazer deploy no Railway agora? (Y/n): " deploy_railway
deploy_railway=${deploy_railway:-Y}

if [[ $deploy_railway =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚂 Iniciando deploy no Railway...${NC}"
    
    # Verificar se Railway CLI está instalado
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}📦 Instalando Railway CLI...${NC}"
        # Método alternativo para instalar Railway
        curl -fsSL https://raw.githubusercontent.com/railwayapp/cli/master/install.sh | sh
        export PATH="$HOME/.railway/bin:$PATH"
    fi
    
    # Login no Railway
    echo -e "${YELLOW}🔐 Login no Railway...${NC}"
    railway login
    
    # Criar projeto
    echo -e "${YELLOW}📁 Criando projeto no Railway...${NC}"
    railway init --name "$repo_name"
    
    # Conectar repositório
    railway connect
    
    # Adicionar serviços
    echo -e "${YELLOW}🐘 Adicionando PostgreSQL...${NC}"
    railway add postgresql
    
    echo -e "${YELLOW}📦 Adicionando Redis...${NC}"
    railway add redis
    
    # Configurar variáveis de ambiente
    echo -e "${YELLOW}⚙️  Configurando variáveis de ambiente...${NC}"
    
    # Ler do arquivo .env
    while IFS='=' read -r key value; do
        # Pular linhas vazias e comentários
        [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue
        
        # Remover espaços em branco
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Pular se valor estiver vazio
        [[ -z "$value" ]] && continue
        
        echo "Configurando: $key"
        railway variables set "$key=$value"
    done < .env
    
    # Configurar variáveis específicas do Railway
    railway variables set NODE_ENV=production
    railway variables set DB_HOST='${{Postgres.PGHOST}}'
    railway variables set DB_PORT='${{Postgres.PGPORT}}'
    railway variables set DB_NAME='${{Postgres.PGDATABASE}}'
    railway variables set DB_USER='${{Postgres.PGUSER}}'
    railway variables set DB_PASS='${{Postgres.PGPASSWORD}}'
    railway variables set REDIS_HOST='${{Redis.REDIS_HOST}}'
    railway variables set REDIS_PORT='${{Redis.REDIS_PORT}}'
    
    # Deploy
    echo -e "${BLUE}🚀 Fazendo deploy...${NC}"
    railway up --detach
    
    # Obter URL do deploy
    sleep 5
    RAILWAY_URL=$(railway domain 2>/dev/null || echo "URL será gerada em alguns minutos")
    
    echo -e "${GREEN}🎉 Deploy iniciado com sucesso!${NC}"
    echo -e "${BLUE}🌐 URL do deploy:${NC} $RAILWAY_URL"
    echo ""
    echo -e "${BLUE}📋 URLs dos Webhooks:${NC}"
    echo -e "${YELLOW}Order Expired:${NC} $RAILWAY_URL/api/webhook/order-expired"
    echo -e "${YELLOW}Order Paid:${NC} $RAILWAY_URL/api/webhook/order-paid"
    echo ""
    echo -e "${YELLOW}🔑 Authorization Key:${NC} $(grep WEBHOOK_SECRET .env | cut -d'=' -f2)"
    
else
    echo -e "${BLUE}📋 Para deploy manual no Railway:${NC}"
    echo "1. Acesse: https://railway.app"
    echo "2. New Project → Deploy from GitHub repo"
    echo "3. Selecione: $repo_name"
    echo "4. Adicione PostgreSQL e Redis"
    echo "5. Configure as variáveis de ambiente"
fi

echo ""
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo -e "${BLUE}📁 Repositório:${NC} $REPO_URL"
echo -e "${BLUE}💾 Branch principal:${NC} main"
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. Configurar webhooks no painel Império"
echo "2. Configurar instâncias Evolution API"
echo "3. Conectar WhatsApp"
echo "4. Testar o sistema"