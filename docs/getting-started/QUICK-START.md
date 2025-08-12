# 🚀 OracleWA SaaS - Início Rápido

> **Configure e execute o sistema completo em 2 minutos**

## 📋 Pré-requisitos

- **Node.js 18+** (recomendado LTS)
- **Git** (para clonar o repositório)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

## 🎯 Instalação Ultra-Rápida

### 1. Clone e Acesse o Projeto
```bash
git clone https://github.com/tiagoelesbao/oraclewa.git
cd oraclewa
```

### 2. Inicie o Sistema
```bash
# Um comando para iniciar tudo
./start.sh
```

✨ **Pronto!** O sistema irá:
- Instalar dependências automaticamente
- Iniciar backend na porta 3000
- Iniciar frontend na porta 3001
- Abrir o dashboard no navegador

## 🌐 Acesso ao Sistema

Após a inicialização, acesse:

- **🎨 Dashboard:** http://localhost:3001
- **🔧 API Backend:** http://localhost:3000
- **📊 Health Check:** http://localhost:3000/health

## 🎮 Comandos Essenciais

```bash
# Desenvolvimento (padrão)
./start.sh

# Produção otimizada
./start.sh production

# Verificar status
./start.sh status

# Parar sistema
./start.sh stop

# Ver logs
./start.sh logs

# Ajuda completa
./start.sh help
```

## 🎯 Primeiros Passos

### 1. Explore o Dashboard
- Acesse http://localhost:3001
- Navegue pelas seções: Dashboard, Clientes, Instâncias
- Explore as funcionalidades principais

### 2. Verifique a API
```bash
# Teste básico da API
curl http://localhost:3000/health
```

### 3. Configure Evolution API (Opcional)
Se você tem uma instância Evolution API:
```bash
# Edite a configuração
nano apps/api/src/config/index.js
```

## 🛠️ Configuração Avançada

### Variáveis de Ambiente
```bash
# Criar arquivo de configuração
cp config/environments/template.env .env

# Editar configurações
nano .env
```

### Banco de Dados (Opcional)
O sistema funciona sem banco para testes, mas para produção:
```bash
# PostgreSQL (recomendado)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=senha123 \
  -p 5432:5432 postgres:14

# Configurar conexão no .env
DATABASE_URL=postgresql://user:senha123@localhost:5432/oraclewa
```

## 🔍 Verificação de Funcionamento

### ✅ Checklist Rápido
- [ ] Backend respondendo em http://localhost:3000/health
- [ ] Frontend carregando em http://localhost:3001
- [ ] Dashboard exibindo interface moderna
- [ ] Sem erros no terminal

### 🚨 Resolução de Problemas

#### Porta já em uso
```bash
# Verificar processos nas portas
lsof -i :3000
lsof -i :3001

# Parar sistema e tentar novamente
./start.sh stop
./start.sh
```

#### Dependências corrompidas
```bash
# Limpar e reinstalar
rm -rf apps/api/node_modules
rm -rf apps/dashboard/node_modules
./start.sh --no-cache
```

#### Erro de permissão
```bash
# Tornar script executável
chmod +x start.sh stop.sh
```

## 🎯 Próximos Passos

Depois de ter o sistema funcionando:

1. **📖 Operação Diária:** [Como usar o sistema](../user-guides/DAILY-OPERATIONS.md)
2. **📡 Broadcast:** [Configurar campanhas](../user-guides/BROADCAST-GUIDE.md)  
3. **🛠️ Técnico:** [Arquitetura do sistema](../technical/ARCHITECTURE.md)

## 💡 Dicas Importantes

- **Desenvolvimento:** Use `./start.sh` para hot reload
- **Produção:** Use `./start.sh production` para otimização
- **Monitoramento:** Use `./start.sh status` regularmente
- **Logs:** Use `./start.sh logs` para debug

## 📞 Suporte

Se algo não funcionar:
1. Consulte [Troubleshooting](../user-guides/TROUBLESHOOTING.md)
2. Verifique os logs com `./start.sh logs`
3. Pare e reinicie com `./start.sh stop && ./start.sh`

---

**🎉 Parabéns! Você agora tem o OracleWA SaaS rodando localmente!**

*📝 Próximo passo recomendado: [Entender o sistema completo](./UNIFIED-SYSTEM.md)*