# 📋 Template de Cliente - OracleWA SaaS

Este é um template para criar novos clientes no sistema OracleWA SaaS.

## 🏗️ Estrutura do Cliente

```
clients/SEU_CLIENTE/
├── config.json              # Configuração principal
├── templates/               # Templates de mensagens
│   ├── order-paid.js       # Template pedido pago
│   └── order-expired.js    # Template pedido expirado
├── data/                   # Dados isolados do cliente
│   ├── broadcast/          # Listas CSV para broadcast
│   ├── exports/            # Relatórios exportados
│   └── backups/           # Backups de dados
└── README.md              # Documentação específica
```

## 🚀 Como Criar um Novo Cliente

### 1. Copiar Template
```bash
cp -r clients/_template clients/MEU_CLIENTE
```

### 2. Configurar config.json
- Altere `CLIENT_ID` para o ID do cliente
- Configure instâncias WhatsApp
- Ajuste webhooks URLs
- Configure limites e billing

### 3. Personalizar Templates
- Edite `templates/order-paid.js`
- Edite `templates/order-expired.js` 
- Customize mensagens conforme a marca

### 4. Adicionar Dados
- Coloque listas CSV em `data/broadcast/`
- Organize por campanhas

### 5. Testar Sistema
```bash
# Reiniciar para detectar novo cliente
npm restart

# Testar webhook
curl -X POST http://localhost:3000/webhook/MEU_CLIENTE/order_paid \
  -H "Content-Type: application/json" \
  -d '{"data":{"user":{"name":"Teste","phone":"11999999999"},"product":{"title":"Produto Teste"},"total":100}}'
```

## 📋 Checklist de Configuração

- [ ] config.json atualizado com IDs corretos
- [ ] Templates personalizados
- [ ] URLs de webhook configuradas
- [ ] Instâncias WhatsApp definidas
- [ ] Dados de broadcast organizados
- [ ] Testes realizados

## 🔧 Configurações Importantes

### Instâncias WhatsApp
Cada cliente deve ter suas próprias instâncias:
- `{CLIENTE}_main` - Principal para webhooks
- `broadcast-{CLIENTE}-1` - Broadcast 1
- `broadcast-{CLIENTE}-2` - Broadcast 2
- `broadcast-{CLIENTE}-3` - Broadcast 3

### Anti-ban
O sistema aplica automaticamente:
- Delays de 90-150 segundos
- Simulação de digitação
- Pausas aleatórias
- Limites por instância

### Dados Isolados
Cada cliente tem:
- Dados completamente separados
- Templates únicos
- Configurações independentes
- Logs isolados

## 🌟 Escalabilidade Infinita

Com esta estrutura, você pode:
- ✅ Adicionar clientes ilimitadamente
- ✅ Cada cliente 100% isolado
- ✅ Configurações independentes
- ✅ Templates personalizados
- ✅ Dados separados por cliente
- ✅ Anti-ban individual
- ✅ Monitoramento independente