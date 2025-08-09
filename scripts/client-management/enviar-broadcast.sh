#!/bin/bash

# 🚀 SCRIPT DE BROADCAST - IMPÉRIO PRÊMIOS
# Envia mensagens focadas em 90K via Evolution API

echo "🎯 === SISTEMA DE BROADCAST IMPÉRIO ==="
echo "📊 Alvo: Título de 90K"
echo ""

# Configurações
EVOLUTION_URL="http://128.140.7.154:8080"
API_KEY="Imperio2024@EvolutionSecure"
INSTANCE="broadcast-imperio"

# Verificar status da instância
echo "🔍 Verificando instância $INSTANCE..."
STATUS=$(curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" | grep -o '"state":"[^"]*' | cut -d'"' -f4)

if [ "$STATUS" = "open" ]; then
    echo "✅ Instância CONECTADA e pronta!"
else
    echo "❌ Instância não está conectada: $STATUS"
    echo "🔧 Conecte primeiro via QR Code"
    exit 1
fi

# Ler CSV
CSV_FILE="leads/leads-imperio-1000.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Arquivo $CSV_FILE não encontrado!"
    exit 1
fi

echo ""
echo "📄 Lendo arquivo CSV..."

# Contador
TOTAL=0
SUCESSO=0
FALHA=0

# Array de mensagens
MSGS=(
"Fala NOME! Você viu que o próximo título *está valendo 90K*? 🤑

Acabaram de reservar mas não foi pago ❌💸

Que tal fazer uma fézinha?
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"

"Boas Notícias NOME! O *Título de 90k* acaba de ser reservado mas não foi pago ❌💸

Para garantir sua chance acesse nosso site agora mesmo:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"

"NOME, alguém acabou de desistir do *prêmio de 90K*! 💰

A vaga está aberta novamente! Corre que acaba rápido:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"

"⚡ URGENTE NOME! Título de 90 MIL liberado há 5 minutos!

Última pessoa cancelou o pagamento. Aproveite:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"
)

# Processar CSV (pula header)
tail -n +2 "$CSV_FILE" | while IFS=';' read -r nome telefone
do
    # Remover espaços
    nome=$(echo "$nome" | xargs)
    telefone=$(echo "$telefone" | xargs)
    
    if [ -z "$telefone" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    # Selecionar mensagem aleatória
    MSG_INDEX=$((RANDOM % ${#MSGS[@]}))
    MENSAGEM="${MSGS[$MSG_INDEX]}"
    
    # Substituir NOME
    MENSAGEM="${MENSAGEM//NOME/$nome}"
    
    echo ""
    echo "📤 [$TOTAL] Enviando para $nome ($telefone)..."
    
    # Enviar mensagem
    RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE" \
      -H "Content-Type: application/json" \
      -H "apikey: $API_KEY" \
      -d "{
        \"number\": \"$telefone\",
        \"text\": \"$MENSAGEM\",
        \"delay\": 2000
      }")
    
    # Verificar sucesso
    if echo "$RESPONSE" | grep -q "key"; then
        echo "   ✅ Enviado com sucesso!"
        SUCESSO=$((SUCESSO + 1))
    else
        echo "   ❌ Falha no envio"
        echo "   Erro: $RESPONSE"
        FALHA=$((FALHA + 1))
    fi
    
    # Aguardar entre mensagens (30 segundos)
    echo "   ⏱️ Aguardando 30 segundos..."
    sleep 30
    
    # Report a cada 10 mensagens
    if [ $((TOTAL % 10)) -eq 0 ]; then
        echo ""
        echo "📊 === RELATÓRIO PARCIAL ==="
        echo "📈 Total enviadas: $TOTAL"
        echo "✅ Sucessos: $SUCESSO"
        echo "❌ Falhas: $FALHA"
        TAXA=$((SUCESSO * 100 / TOTAL))
        echo "📊 Taxa de sucesso: $TAXA%"
        echo ""
    fi
done

# Relatório final
echo ""
echo "🎉 === BROADCAST CONCLUÍDO ==="
echo "📊 Total de mensagens: $TOTAL"
echo "✅ Enviadas com sucesso: $SUCESSO"
echo "❌ Falharam: $FALHA"
if [ $TOTAL -gt 0 ]; then
    TAXA_FINAL=$((SUCESSO * 100 / TOTAL))
    echo "📈 Taxa de sucesso final: $TAXA_FINAL%"
fi
echo "⏰ Finalizado em: $(date '+%d/%m/%Y %H:%M:%S')"