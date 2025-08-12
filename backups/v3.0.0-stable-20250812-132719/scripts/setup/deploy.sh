#!/bin/bash

echo "🚀 OracleWA - Script de Deploy Automatizado"
echo "==========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para gerar secrets
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado! Por favor, instale Node.js primeiro.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configurando variáveis de ambiente...${NC}"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
fi

# Gerar secrets automaticamente
echo -e "${BLUE}🔐 Gerando chaves de segurança...${NC}"
WEBHOOK_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)
EVO_KEY_1="EVO_INST_1_$(date +%s)"
EVO_KEY_2="EVO_INST_2_$(date +%s)"
EVO_KEY_3="EVO_INST_3_$(date +%s)"
EVO_KEY_4="EVO_INST_4_$(date +%s)"

# Atualizar .env com as chaves geradas
echo -e "${YELLOW}📝 Atualizando arquivo .env...${NC}"
sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/EVOLUTION_API_KEY_1=.*/EVOLUTION_API_KEY_1=$EVO_KEY_1/" .env
sed -i "s/EVOLUTION_API_KEY_2=.*/EVOLUTION_API_KEY_2=$EVO_KEY_2/" .env
sed -i "s/EVOLUTION_API_KEY_3=.*/EVOLUTION_API_KEY_3=$EVO_KEY_3/" .env
sed -i "s/EVOLUTION_API_KEY_4=.*/EVOLUTION_API_KEY_4=$EVO_KEY_4/" .env

echo -e "${GREEN}✅ Chaves geradas e configuradas!${NC}"
echo ""
echo -e "${BLUE}📋 SUAS CHAVES GERADAS:${NC}"
echo -e "${YELLOW}WEBHOOK_SECRET:${NC} $WEBHOOK_SECRET"
echo -e "${YELLOW}JWT_SECRET:${NC} $JWT_SECRET"
echo -e "${YELLOW}EVOLUTION_API_KEY_1:${NC} $EVO_KEY_1"
echo -e "${YELLOW}EVOLUTION_API_KEY_2:${NC} $EVO_KEY_2"
echo -e "${YELLOW}EVOLUTION_API_KEY_3:${NC} $EVO_KEY_3"
echo -e "${YELLOW}EVOLUTION_API_KEY_4:${NC} $EVO_KEY_4"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Salve essas chaves em local seguro!${NC}"
echo ""

# Verificar se Railway CLI está instalado
if command -v railway &> /dev/null; then
    echo -e "${GREEN}🚂 Railway CLI encontrado!${NC}"
    
    read -p "Deseja fazer deploy no Railway agora? (y/n): " deploy_choice
    
    if [ "$deploy_choice" = "y" ] || [ "$deploy_choice" = "Y" ]; then
        echo -e "${BLUE}🚀 Iniciando deploy no Railway...${NC}"
        
        # Login no Railway
        echo -e "${YELLOW}🔐 Fazendo login no Railway...${NC}"
        railway login
        
        # Criar projeto
        echo -e "${YELLOW}📁 Criando projeto no Railway...${NC}"
        railway init
        
        # Adicionar PostgreSQL
        echo -e "${YELLOW}🐘 Adicionando PostgreSQL...${NC}"
        railway add postgresql
        
        # Adicionar Redis
        echo -e "${YELLOW}📦 Adicionando Redis...${NC}"
        railway add redis
        
        # Configurar variáveis de ambiente
        echo -e "${YELLOW}⚙️  Configurando variáveis de ambiente...${NC}"
        railway variables set NODE_ENV=production
        railway variables set APP_PORT=3000
        railway variables set WEBHOOK_SECRET="$WEBHOOK_SECRET"
        railway variables set JWT_SECRET="$JWT_SECRET"
        railway variables set EVOLUTION_API_KEY_1="$EVO_KEY_1"
        railway variables set EVOLUTION_API_KEY_2="$EVO_KEY_2"
        railway variables set EVOLUTION_API_KEY_3="$EVO_KEY_3"
        railway variables set EVOLUTION_API_KEY_4="$EVO_KEY_4"
        railway variables set RATE_LIMIT_PER_INSTANCE=500
        railway variables set LOG_LEVEL=info
        
        # Deploy
        echo -e "${BLUE}🚀 Fazendo deploy...${NC}"
        railway up
        
        # Obter URL do projeto
        PROJECT_URL=$(railway domain)
        
        echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
        echo -e "${BLUE}🌐 URL do projeto:${NC} $PROJECT_URL"
        echo ""
        echo -e "${BLUE}📋 URLs dos Webhooks para configurar no painel Império:${NC}"
        echo -e "${YELLOW}Order Expired:${NC} $PROJECT_URL/api/webhook/order-expired"
        echo -e "${YELLOW}Order Paid:${NC} $PROJECT_URL/api/webhook/order-paid"
        echo ""
        echo -e "${YELLOW}🔑 Use esta chave no campo Authorization do painel:${NC} $WEBHOOK_SECRET"
    fi
else
    echo -e "${YELLOW}⚠️  Railway CLI não encontrado.${NC}"
    echo -e "${BLUE}📋 Para instalar o Railway CLI:${NC}"
    echo "curl -fsSL https://railway.app/install.sh | sh"
    echo ""
    echo -e "${BLUE}📋 Ou siga o deploy manual no Railway:${NC}"
    echo "1. Acesse: https://railway.app"
    echo "2. Conecte seu repositório GitHub"
    echo "3. Configure as variáveis de ambiente mostradas acima"
    echo "4. Adicione PostgreSQL e Redis"
    echo "5. Deploy automaticamente"
fi

echo ""
echo -e "${BLUE}📚 Próximos passos:${NC}"
echo "1. Configure os webhooks no painel Império"
echo "2. Conecte as 4 instâncias WhatsApp"
echo "3. Teste o sistema"
echo ""
echo -e "${GREEN}✅ Configuração inicial concluída!${NC}"

# Salvar chaves em arquivo
echo "# CHAVES GERADAS EM $(date)" > CHAVES_GERADAS.txt
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> CHAVES_GERADAS.txt
echo "JWT_SECRET=$JWT_SECRET" >> CHAVES_GERADAS.txt
echo "EVOLUTION_API_KEY_1=$EVO_KEY_1" >> CHAVES_GERADAS.txt
echo "EVOLUTION_API_KEY_2=$EVO_KEY_2" >> CHAVES_GERADAS.txt
echo "EVOLUTION_API_KEY_3=$EVO_KEY_3" >> CHAVES_GERADAS.txt
echo "EVOLUTION_API_KEY_4=$EVO_KEY_4" >> CHAVES_GERADAS.txt

echo -e "${BLUE}💾 Chaves salvas em: CHAVES_GERADAS.txt${NC}"