# 📋 Templates de Confirmação de Compra - OracleWA SaaS

## 🎯 Cliente: Império Prêmios

### ✅ Templates de Pagamento Confirmado

#### 📌 Template Principal (order-paid.js)
```javascript
🎉 *PAGAMENTO CONFIRMADO*

Parabéns *${customerName}*! ✅

Seu pedido de *${productName}* no valor de *R$ ${total}* foi confirmado com sucesso!

🏆 *Você está concorrendo a R$ 100.000,00 pela Federal!*

*Próximos passos:*
✅ Entre na nossa comunidade VIP
📱 Acompanhe os sorteios ao vivo
🎯 Boa sorte na sua sorte!

👉 https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ems_copy_c

*Império Prêmios* 🍀
_Sua sorte começa agora!_
```

---

### 🎨 Variações de Confirmação de Pagamento

#### Variação 1: Congratulations (Peso: 35%)
```
🎉 *PARABÉNS, {{customerName}}!*

✅ *Pagamento Confirmado!*

━━━━━━━━━━━━━━━
📊 *SEUS NÚMEROS*
━━━━━━━━━━━━━━━

🎫 {{productName}}
💰 *R$ {{total}}*

━━━━━━━━━━━━━━━
🏆 *PREMIAÇÃO*
━━━━━━━━━━━━━━━

💵 *R$ 100.000,00*
🎯 Loteria Federal

━━━━━━━━━━━━━━━

🍀 *Boa sorte!*

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ems_copy_c

*Império Prêmios* 🏆
```

#### Variação 2: Confirmation (Peso: 35%)
```
🏆 *{{customerName}}, tudo certo!*

✅ *Pagamento Aprovado*

━━━━━━━━━━━━━━━

🎟️ *Suas cotas*
{{productName}}

💰 *Total: R$ {{total}}*

━━━━━━━━━━━━━━━

🎯 *Concorrendo a:*
💵 *R$ 100.000,00*

━━━━━━━━━━━━━━━

🤞 Boa sorte!

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ems_copy_c

*Império Prêmios* ✨
```

#### Variação 3: Celebration (Peso: 30%)
```
✨ *Olá {{customerName}}!*

🎊 *Compra Aprovada!*

━━━━━━━━━━━━━━━

🎫 {{productName}}
💵 *R$ {{total}}*

━━━━━━━━━━━━━━━

💰 *Prêmio:*
*R$ 100.000,00*

📊 Loteria Federal

━━━━━━━━━━━━━━━

🌟 Boa sorte!

🔗 *Entre na Comunidade VIP:*
https://chat.whatsapp.com/EsOryU1oONNII64AAOz6TF?mode=ems_copy_c

*Equipe Império* 🎰
```

---

## 📊 Sistema de Variações

### Distribuição por Peso
- **Congratulations**: 35% de chance
- **Confirmation**: 35% de chance
- **Celebration**: 30% de chance

### Variáveis Disponíveis
- `{{customerName}}` - Nome do cliente
- `{{productName}}` - Nome do produto/sorteio
- `{{total}}` - Valor total do pedido

### Recursos Ativados
- ✅ Sistema Anti-ban habilitado
- ✅ Simulação de digitação
- ✅ Delays aleatórios entre mensagens
- ✅ Rotação automática de variações

---

## 🔧 Configuração do Sistema

### Localização dos Templates
```
/clients/imperio/templates/
├── order-paid.js           # Template principal
└── variations/
    └── order-paid-variations.js  # Variações com pesos
```

### Como Adicionar Novas Variações

1. Abra o arquivo `/clients/imperio/templates/variations/order-paid-variations.js`
2. Adicione nova variação no array `ORDER_PAID_VARIATIONS`
3. Defina o peso (weight) para controlar a frequência
4. Use as variáveis `{{customerName}}`, `{{productName}}`, `{{total}}`

### Exemplo de Nova Variação
```javascript
{
  id: 'novo_template',
  weight: 25,  // 25% de chance
  template: `Sua mensagem aqui com {{customerName}}`
}
```

---

## 🚀 Integração com Webhook

### Endpoint de Confirmação
```
POST /webhook/order-paid
```

### Payload Esperado
```json
{
  "clientId": "imperio",
  "customerName": "João Silva",
  "productName": "Sorteio Federal 001",
  "total": "50.00",
  "phoneNumber": "5511999999999"
}
```

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Mensagem de confirmação enviada",
  "variation": "congratulations",
  "messageId": "BAE5C4F5E9F7B1"
}
```

---

## 📱 Números WhatsApp Configurados

### Instâncias Ativas
- **imperio-webhook-1**: 5511934107044 (Império Suporte)
- **imperio-webhook-2**: 5511963751439 (Império Realiza)
- **imperio-webhook-4**: 5511974220162 (Em reconexão)

### Status das Conexões
Para verificar o status atual das instâncias, acesse:
```
http://localhost:3001/instances
```

---

## 🔐 Segurança e Anti-Ban

### Recursos Implementados
1. **Rotação de Templates**: Sistema automático de variações
2. **Delays Aleatórios**: Entre 30-120 segundos entre mensagens
3. **Simulação de Digitação**: Comportamento humano simulado
4. **Pool de Números**: Distribuição de carga entre múltiplas instâncias
5. **Limite de Mensagens**: Máximo 500 mensagens/dia por número

### Monitoramento
- Logs em `/logs/webhook/`
- Métricas em tempo real no dashboard
- Alertas automáticos para desconexões

---

## 📞 Suporte e Manutenção

### Comandos Úteis
```bash
# Iniciar sistema
./start.sh dev

# Verificar status
./start.sh status

# Reconectar instâncias
./start.sh instances

# Ver logs em tempo real
./start.sh logs
```

### Troubleshooting
- **Número desconectado**: Acesse `/instances` e escaneie o QR Code
- **Mensagem não enviada**: Verifique logs em `/logs/webhook/`
- **Rate limit**: Sistema aguarda automaticamente antes de reenviar

---

**Última atualização**: 01/09/2025
**Versão**: 3.1.0