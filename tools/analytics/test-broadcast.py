#!/usr/bin/env python3

import json
import time
import requests

# Configurações
EVOLUTION_URL = "http://128.140.7.154:8080"
API_KEY = "Imperio2024@EvolutionSecure"
INSTANCE = "broadcast-imperio"

# Ler CSV
leads = []
with open('leads/leads-imperio-1000.csv', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for line in lines[1:]:  # Pula header
        if ';' in line:
            nome, telefone = line.strip().split(';')
            leads.append({'nome': nome, 'telefone': telefone})

# Templates de mensagens
templates = [
    "Fala {nome}! Você viu que o próximo título *está valendo 90K*? 🤑\n\nAcabaram de reservar mas não foi pago ❌💸\n\nQue tal fazer uma fézinha?\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
    
    "Boas Notícias {nome}! O *Título de 90k* acaba de ser reservado mas não foi pago ❌💸\n\nPara garantir sua chance acesse nosso site agora mesmo:\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
    
    "{nome}, alguém acabou de desistir do *prêmio de 90K*! 💰\n\nA vaga está aberta novamente! Corre que acaba rápido:\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
    
    "⚡ URGENTE {nome}! Título de 90 MIL liberado há 5 minutos!\n\nÚltima pessoa cancelou o pagamento. Aproveite:\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"
]

print("🎯 === TESTE DE BROADCAST IMPÉRIO ===")
print(f"📊 Total de leads: {len(leads)}")
print("📱 Instância: broadcast-imperio")
print("⏰ Iniciando envio...\n")

sucesso = 0
falha = 0

for i, lead in enumerate(leads, 1):
    # Escolher template
    template = templates[i % len(templates)]
    mensagem = template.format(nome=lead['nome'])
    
    print(f"📤 [{i}/{len(leads)}] Enviando para {lead['nome']} ({lead['telefone'][:8]}...)")
    
    # Preparar payload
    payload = {
        "number": lead['telefone'],
        "text": mensagem,
        "delay": 2000
    }
    
    headers = {
        "Content-Type": "application/json",
        "apikey": API_KEY
    }
    
    try:
        # Enviar mensagem
        response = requests.post(
            f"{EVOLUTION_URL}/message/sendText/{INSTANCE}",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"   ✅ Enviada com sucesso!")
            sucesso += 1
        else:
            print(f"   ❌ Falha: {response.text[:100]}")
            falha += 1
            
    except Exception as e:
        print(f"   ❌ Erro: {str(e)}")
        falha += 1
    
    # Aguardar entre mensagens (30 segundos)
    if i < len(leads):
        print("   ⏱️ Aguardando 30 segundos...")
        time.sleep(30)
    
    # Relatório parcial a cada 10 mensagens
    if i % 10 == 0:
        print(f"\n📊 === RELATÓRIO PARCIAL ===")
        print(f"✅ Sucessos: {sucesso}")
        print(f"❌ Falhas: {falha}")
        print(f"📈 Taxa: {(sucesso/(sucesso+falha)*100):.1f}%\n")

# Relatório final
print(f"\n🎉 === BROADCAST CONCLUÍDO ===")
print(f"📊 Total enviado: {sucesso + falha}")
print(f"✅ Sucessos: {sucesso}")
print(f"❌ Falhas: {falha}")
if (sucesso + falha) > 0:
    print(f"📈 Taxa de sucesso: {(sucesso/(sucesso+falha)*100):.1f}%")
print(f"⏰ Concluído em: {time.strftime('%d/%m/%Y %H:%M:%S')}")