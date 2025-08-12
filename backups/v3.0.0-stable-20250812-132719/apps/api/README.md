# OracleWA - Sistema de Recuperação de Pedidos Expirados

Sistema automatizado para recuperação de carrinho abandonado via WhatsApp, desenvolvido para o cliente Império, integrando com Evolution API.

## 📋 Status Atual

**🟢 Sistema Operacional** 
- Deploy ativo no Railway
- 4 instâncias Evolution API rodando
- Mensagens sendo enviadas com sucesso
- Sistema de anti-ban implementado e funcional

**⚠️ Ajuste Temporário**
- Verificação de horário comercial desabilitada (04/08/2025)
- Sistema permite envios 24h devido a problemas com fuso horário

## 🚀 Acesso Rápido

### URLs de Produção
- **Sistema Principal**: https://oraclewa-imperio-production.up.railway.app
- **Evolution API 1**: https://evolution-oraclewa-01-production.up.railway.app
- **Evolution API 2**: https://evolution-oraclewa-02-production.up.railway.app
- **Evolution API 3**: https://evolution-oraclewa-03-production.up.railway.app
- **Evolution API 4**: https://evolution-oraclewa-04-production.up.railway.app

### Credenciais
- **API Key Sistema**: `sk-imperio-7h8k9m2n3p4q5r6s`
- **Evolution Global Key**: `B6D711FCDE4D4FD5936544120E713976`

## 📚 Documentação

### Para Começar
1. [**GUIA_COMPLETO_USO.md**](documentation/GUIA_COMPLETO_USO.md) - Como usar o sistema após deploy
2. [**STATUS_ATUAL_CONSOLIDADO.md**](documentation/current/STATUS_ATUAL_CONSOLIDADO.md) - Status detalhado do sistema

### Planejamento e Estratégia
- [**ROADMAP_EXECUTIVO.md**](documentation/current/ROADMAP_EXECUTIVO.md) - Planejamento 30 dias
- [**ACAO_AMANHA_02_08.md**](documentation/current/ACAO_AMANHA_02_08.md) - Ações imediatas
- [**PLANEJAMENTO_ESTRATEGICO_ORACLEWA.md**](documentation/current/PLANEJAMENTO_ESTRATEGICO_ORACLEWA.md) - Visão de longo prazo

### Documentação Técnica
- [**ESTRATEGIAS_ANTI_BAN.md**](documentation/current/ESTRATEGIAS_ANTI_BAN.md) - Sistema anti-ban completo
- [**WEBHOOK_SETUP.md**](documentation/WEBHOOK_SETUP.md) - Configuração de webhooks
- [**GUIA_IMPLEMENTACAO_POOLS.md**](documentation/current/GUIA_IMPLEMENTACAO_POOLS.md) - Múltiplos números

### Deploy e Infraestrutura
- [**DEPLOY_GUIDE.md**](documentation/DEPLOY_GUIDE.md) - Deploy no Railway
- [**HETZNER_PASSO_A_PASSO.md**](documentation/HETZNER_PASSO_A_PASSO.md) - VPS próprio

## 🔧 Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   WooCommerce   │────▶│   OracleWA API   │────▶│  Evolution API  │
│    (Webhook)    │     │   (Node.js)      │     │  (4 instâncias) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Redis     │
                        │ Rate Limit   │
                        └──────────────┘
```

## ⚡ Quick Start

### 1. Configurar Webhook no WooCommerce
```bash
URL: https://oraclewa-imperio-production.up.railway.app/webhook/order-expired
Headers:
  x-api-key: sk-imperio-7h8k9m2n3p4q5r6s
  Content-Type: application/json
```

### 2. Testar Envio
```bash
curl -X POST https://oraclewa-imperio-production.up.railway.app/message/send \
  -H "x-api-key: sk-imperio-7h8k9m2n3p4q5r6s" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "message": "Teste de mensagem"
  }'
```

## 📊 Limites e Capacidade

- **Por número**: 50 mensagens/dia
- **Por hora**: 5 mensagens/hora/número
- **Total sistema**: 200 mensagens/dia (4 números)
- **Delay entre mensagens**: 30-90 segundos

## 🛠️ Manutenção

### Logs
```bash
# Ver logs no Railway
railway logs -s oraclewa-imperio

# Ver logs específicos
railway logs -s evolution-oraclewa-01
```

### Monitoramento
- Dashboard Railway: https://railway.app/project/[PROJECT_ID]
- Métricas em tempo real disponíveis

## 🚨 Troubleshooting

### Mensagem não enviada
1. Verificar logs do sistema
2. Confirmar número no formato correto (5511999999999)
3. Verificar limites de rate
4. Verificar status das instâncias Evolution

### Webhook não funciona
1. Confirmar URL e API key
2. Verificar logs de webhook
3. Testar com curl primeiro

## 📞 Próximos Passos

1. **Imediato (Esta semana)**
   - [ ] Adquirir 12 números WhatsApp
   - [ ] Implementar pool de números
   - [ ] Reativar verificação de horário comercial

2. **Curto Prazo (30 dias)**
   - [ ] Migrar para VPS próprio (Hetzner)
   - [ ] Implementar dashboard de métricas
   - [ ] Sistema de templates dinâmicos

3. **Longo Prazo**
   - [ ] Transformar em SaaS multi-tenant
   - [ ] IA para personalização de mensagens
   - [ ] Integração com múltiplos e-commerces

## 🤝 Suporte

Para questões técnicas ou problemas:
1. Verificar documentação completa em `/documentation`
2. Consultar logs do sistema
3. Contatar equipe de desenvolvimento

---

**Última atualização**: 04/08/2025 19:35
**Versão**: 2.3.0
**Status**: Produção