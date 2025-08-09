#!/usr/bin/env python3

import json
import time
import requests
from datetime import datetime

# Configurações
EVOLUTION_URL = "http://128.140.7.154:8080"
API_KEY = "Imperio2024@EvolutionSecure"
INSTANCE = "broadcast-imperio"

# Ler CSV (600 leads para teste conservador)
leads = []
with open('leads/leads-imperio-600.csv', 'r', encoding='utf-8') as f:
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

print("🎯 === BROADCAST IMPÉRIO COM RELATÓRIO ===")
print(f"📊 Total de leads: {len(leads)}")
print("📱 Instância: broadcast-imperio")
print("⏰ Iniciando envio...\n")

# Tracking
inicio = datetime.now()
resultados_detalhados = []
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
    
    resultado_envio = {
        "id": i,
        "nome": lead['nome'],
        "telefone": lead['telefone'],
        "timestamp": datetime.now().isoformat(),
        "template_usado": (i % len(templates)) + 1
    }
    
    try:
        # Enviar mensagem
        start_time = time.time()
        response = requests.post(
            f"{EVOLUTION_URL}/message/sendText/{INSTANCE}",
            json=payload,
            headers=headers,
            timeout=30
        )
        response_time = (time.time() - start_time) * 1000  # em ms
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"   ✅ Enviada com sucesso! ({response_time:.0f}ms)")
            sucesso += 1
            resultado_envio.update({
                "status": "sucesso",
                "response_time": response_time,
                "message_id": response.json().get('key', {}).get('id', 'unknown')
            })
        else:
            print(f"   ❌ Falha: {response.text[:100]}")
            falha += 1
            resultado_envio.update({
                "status": "falha",
                "erro": response.text[:200]
            })
            
    except Exception as e:
        print(f"   ❌ Erro: {str(e)}")
        falha += 1
        resultado_envio.update({
            "status": "erro",
            "erro": str(e)
        })
    
    resultados_detalhados.append(resultado_envio)
    
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

# Calcular métricas finais
fim = datetime.now()
duracao = (fim - inicio).total_seconds() / 60  # em minutos
velocidade = (sucesso + falha) / (duracao / 60) if duracao > 0 else 0  # msgs/hora

# Criar relatório JSON
relatorio = {
    "resumo": {
        "totalLeads": len(leads),
        "mensagensEnviadas": sucesso + falha,
        "sucessos": sucesso,
        "falhas": falha,
        "taxaSuccesso": f"{(sucesso/(sucesso+falha)*100):.1f}%" if (sucesso+falha) > 0 else "0%",
        "duracaoMinutos": f"{duracao:.1f}",
        "velocidadeReal": f"{velocidade:.1f} msgs/hora"
    },
    "metricas": {
        "conversaoEsperada": f"{int(sucesso * 0.02)} leads interessados",
        "receitaEstimada": f"R$ {(sucesso * 0.10):.2f}",
        "custoOperacional": f"R$ {((sucesso + falha) * 0.05):.2f}",
        "lucroEstimado": f"R$ {(sucesso * 0.05):.2f}"
    },
    "proximosPassos": {
        "otimizacao": "Aumentar velocidade" if velocidade < 30 else "Manter ritmo",
        "escalonamento": "Pode escalar para 1000+ leads" if sucesso/(sucesso+falha) > 0.85 else "Otimizar qualidade primeiro",
        "investimento": "Considerar chip R$ 120" if sucesso > 50 else "Testar mais antes de investir"
    },
    "detalhes": {
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
        "instancia": INSTANCE,
        "totalTemplates": len(templates)
    },
    "mensagens_enviadas": resultados_detalhados
}

# Salvar relatório
timestamp = int(time.time())
filename = f"broadcast-report-{timestamp}.json"
with open(filename, 'w', encoding='utf-8') as f:
    json.dump(relatorio, f, indent=2, ensure_ascii=False)

print(f"\n🎉 === BROADCAST CONCLUÍDO ===")
print(f"📊 Total enviado: {sucesso + falha}")
print(f"✅ Sucessos: {sucesso}")
print(f"❌ Falhas: {falha}")
if (sucesso + falha) > 0:
    print(f"📈 Taxa de sucesso: {(sucesso/(sucesso+falha)*100):.1f}%")
print(f"⏰ Duração: {duracao:.1f} minutos")
print(f"⚡ Velocidade: {velocidade:.1f} msgs/hora")
print(f"\n💾 Relatório salvo em: {filename}")
print(f"📊 Para gerar dashboard visual, execute:")
print(f"   python3 generate-dashboard.py {filename}")