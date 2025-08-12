#!/usr/bin/env python3

import json
import time
import requests
import random
from datetime import datetime

# Configurações
EVOLUTION_URL = "http://128.140.7.154:8080"
API_KEY = "Imperio2024@EvolutionSecure"
INSTANCE = "broadcast-imperio"

class AntibanManager:
    def __init__(self):
        # Delays humanizados (25-45 segundos com variação)
        self.delay_base_min = 25
        self.delay_base_max = 45
        self.variacao_extra = 7  # ±7 segundos extras
        
        # Pausas inteligentes
        self.msgs_per_batch = 5  # Pausar a cada 5 mensagens
        self.long_pause_min = 180  # 3 minutos mínimo
        self.long_pause_max = 420  # 7 minutos máximo
        
        # Limites de segurança
        self.daily_limit = 300  # Máximo 300 msgs/dia
        self.hourly_limit = 50   # Máximo 50 msgs/hora
        
        # Detecção shadowban
        self.shadowban_threshold = 0.3  # >30% falhas = shadowban
        self.check_interval = 5  # Verificar a cada 5 mensagens
        
    def get_humanized_delay(self):
        """Gera delay humanizado com variação natural"""
        base_delay = random.randint(self.delay_base_min, self.delay_base_max)
        extra_variation = random.randint(-self.variacao_extra, self.variacao_extra)
        final_delay = max(20, base_delay + extra_variation)  # Mínimo 20s
        return final_delay
    
    def get_long_pause(self):
        """Gera pausa longa entre lotes"""
        return random.randint(self.long_pause_min, self.long_pause_max)
    
    def should_long_pause(self, message_count):
        """Verifica se deve fazer pausa longa"""
        return message_count % self.msgs_per_batch == 0
    
    def detect_shadowban(self, recent_results):
        """Detecta possível shadowban baseado em resultados recentes"""
        if len(recent_results) < 5:
            return False
            
        recent_failures = [r for r in recent_results[-10:] if not r.get('success', False)]
        failure_rate = len(recent_failures) / min(10, len(recent_results))
        
        return failure_rate > self.shadowban_threshold

# Template Generator melhorado
class TemplateGenerator:
    def __init__(self):
        self.greetings = ["Fala", "Oi", "Olá", "E aí", "Boas notícias"]
        self.title_phrases = [
            "o próximo título *está valendo 90K*",
            "o *título de 90 mil* está disponível", 
            "tem um *prêmio de 90K* liberado",
            "o *título premiado de R$ 90.000*"
        ]
        self.urgency = [
            "Acabaram de reservar mas não foi pago ❌💸",
            "Alguém desistiu da última hora ❌",
            "Vaga liberada agora há pouco ⚡",
            "Cancelaram o pagamento há 10 minutos ❌"
        ]
        self.call_to_action = [
            "Que tal fazer uma fézinha?",
            "Aproveita essa oportunidade!",
            "Garante logo antes que esgote!",
            "Corre que vai rápido!"
        ]
        
    def generate_unique_template(self, nome, message_number):
        """Gera template único combinando elementos aleatoriamente"""
        greeting = random.choice(self.greetings)
        title = random.choice(self.title_phrases)
        urgency = random.choice(self.urgency)
        cta = random.choice(self.call_to_action)
        
        # Variações estruturais
        structures = [
            f"""{greeting} {nome}! Você viu que {title}? 🤑

{urgency}

{cta}
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB""",

            f"""{greeting} {nome}! 

{title.capitalize()} e {urgency.lower()}

{cta}
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB""",

            f"""{nome}, {urgency.lower()}

Sabia que {title}? 💰

{cta}
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB""",

            f"""⚡ {nome}! {title.capitalize()}!

{urgency}

{cta} Oportunidade única:
👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"""
        ]
        
        return random.choice(structures)

# Ler CSV
leads = []
with open('leads/leads-imperio-600.csv', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for line in lines[1:]:  # Pula header
        if ';' in line:
            nome, telefone = line.strip().split(';')
            leads.append({'nome': nome, 'telefone': telefone})

# Inicializar sistemas
antiban = AntibanManager()
template_gen = TemplateGenerator()

print("🛡️ === BROADCAST IMPÉRIO - SISTEMA ANTI-BAN MELHORADO ===")
print(f"📊 Total de leads: {len(leads)}")
print("📱 Instância: broadcast-imperio")
print("🛡️ Melhorias implementadas:")
print("   ✅ Delays humanizados (25-45s + variação)")
print("   ✅ Pausas longas a cada 5 mensagens")
print("   ✅ Templates únicos e variados")
print("   ✅ Detecção precoce de shadowban")
print("   ✅ Limites de segurança (300/dia)")
print("⏰ Iniciando envio...\n")

# Tracking
inicio = datetime.now()
resultados_detalhados = []
sucesso = 0
falha = 0
paused_for_shadowban = False

for i, lead in enumerate(leads, 1):
    # Verificar limite diário
    if sucesso + falha >= antiban.daily_limit:
        print(f"\n🛑 Limite diário atingido ({antiban.daily_limit} mensagens)")
        print("⏰ Parando por segurança")
        break
    
    # Gerar template único
    mensagem = template_gen.generate_unique_template(lead['nome'], i)
    
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
        "template_variation": f"Estrutura {(i-1) % 4 + 1}"
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
                "success": True,
                "response_time": response_time,
                "message_id": response.json().get('key', {}).get('id', 'unknown')
            })
        else:
            print(f"   ❌ Falha: {response.text[:100]}")
            falha += 1
            resultado_envio.update({
                "success": False,
                "error": response.text[:200]
            })
            
    except Exception as e:
        print(f"   ❌ Erro: {str(e)}")
        falha += 1
        resultado_envio.update({
            "success": False,
            "error": str(e)
        })
    
    resultados_detalhados.append(resultado_envio)
    
    # Verificar shadowban a cada 5 mensagens
    if i % antiban.check_interval == 0:
        if antiban.detect_shadowban(resultados_detalhados):
            print(f"\n🚨 === SHADOWBAN DETECTADO ===")
            print(f"📊 Mensagem {i}: Taxa de falhas muito alta")
            print(f"🛑 Parando envios por segurança")
            print(f"⏰ Aguardar 24-48h antes de tentar novamente")
            paused_for_shadowban = True
            break
    
    # Pausa longa entre lotes
    if antiban.should_long_pause(i) and i < len(leads):
        long_pause = antiban.get_long_pause()
        print(f"\n   🔄 PAUSA ESTRATÉGICA: {long_pause//60}min {long_pause%60}s")
        print(f"   🛡️ Prevenindo detecção de padrão...")
        time.sleep(long_pause)
        
    # Delay humanizado normal
    elif i < len(leads):
        delay = antiban.get_humanized_delay()
        print(f"   ⏱️ Aguardando {delay}s (humanizado)...")
        time.sleep(delay)
    
    # Relatório parcial a cada 10 mensagens
    if i % 10 == 0:
        taxa_atual = (sucesso/(sucesso+falha)*100) if (sucesso+falha) > 0 else 0
        print(f"\n📊 === RELATÓRIO PARCIAL ===")
        print(f"✅ Sucessos: {sucesso}")
        print(f"❌ Falhas: {falha}")
        print(f"📈 Taxa: {taxa_atual:.1f}%")
        print(f"🛡️ Status shadowban: {'DETECTADO' if paused_for_shadowban else 'OK'}")
        
        # Análise de performance
        if taxa_atual < 70:
            print(f"⚠️ ATENÇÃO: Taxa de sucesso baixa ({taxa_atual:.1f}%)")
        elif taxa_atual > 90:
            print(f"🟢 EXCELENTE: Alta taxa de sucesso ({taxa_atual:.1f}%)")
        print()

# Calcular métricas finais
fim = datetime.now()
duracao = (fim - inicio).total_seconds() / 60  # em minutos
velocidade = (sucesso + falha) / (duracao / 60) if duracao > 0 else 0  # msgs/hora

# Criar relatório JSON melhorado
relatorio = {
    "resumo": {
        "totalLeads": len(leads),
        "mensagensEnviadas": sucesso + falha,
        "sucessos": sucesso,
        "falhas": falha,
        "taxaSuccesso": f"{(sucesso/(sucesso+falha)*100):.1f}%" if (sucesso+falha) > 0 else "0%",
        "duracaoMinutos": f"{duracao:.1f}",
        "velocidadeReal": f"{velocidade:.1f} msgs/hora",
        "shadowbanDetectado": paused_for_shadowban,
        "motivoParada": "Shadowban detectado" if paused_for_shadowban else "Limite diário" if (sucesso+falha) >= antiban.daily_limit else "Concluído"
    },
    "melhorias_antiban": {
        "delays_humanizados": "25-45s + variação",
        "pausas_estrategicas": "3-7min a cada 5 msgs",
        "templates_unicos": f"{len(resultados_detalhados)} variações geradas",
        "deteccao_shadowban": "Ativa (verificação a cada 5 msgs)",
        "limite_diario": f"{antiban.daily_limit} msgs/dia"
    },
    "metricas": {
        "conversaoEsperada": f"{int(sucesso * 0.02)} leads interessados",
        "receitaEstimada": f"R$ {(sucesso * 0.10):.2f}",
        "custoOperacional": f"R$ {((sucesso + falha) * 0.05):.2f}",
        "lucroEstimado": f"R$ {(sucesso * 0.05):.2f}"
    },
    "analise_performance": {
        "limite_detectado": f"{sucesso + falha} mensagens antes de problemas",
        "velocidade_segura": f"{velocidade:.1f} msgs/hora",
        "tempo_ate_limite": f"{duracao:.1f} minutos",
        "eficiencia_antiban": "Melhorada" if not paused_for_shadowban else "Detecção funcionou"
    },
    "proximosPassos": {
        "otimizacao": "Testar com chip aquecido R$ 120" if paused_for_shadowban else "Manter configurações",
        "escalonamento": "Aguardar chip premium" if paused_for_shadowban else "Pode escalar gradualmente",
        "investimento": "Chip R$ 120 necessário" if (sucesso + falha) < 100 else "Avaliar ROI"
    },
    "detalhes": {
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
        "instancia": INSTANCE,
        "antiban_version": "v2.0"
    },
    "mensagens_enviadas": resultados_detalhados
}

# Salvar relatório
timestamp = int(time.time())
filename = f"broadcast-antiban-improved-{timestamp}.json"
with open(filename, 'w', encoding='utf-8') as f:
    json.dump(relatorio, f, indent=2, ensure_ascii=False)

print(f"\n🎉 === TESTE ANTI-BAN CONCLUÍDO ===")
print(f"📊 Total enviado: {sucesso + falha}")
print(f"✅ Sucessos: {sucesso}")
print(f"❌ Falhas: {falha}")
if (sucesso + falha) > 0:
    print(f"📈 Taxa de sucesso: {(sucesso/(sucesso+falha)*100):.1f}%")
print(f"⏰ Duração: {duracao:.1f} minutos")
print(f"⚡ Velocidade: {velocidade:.1f} msgs/hora")
print(f"🛡️ Shadowban detectado: {'SIM' if paused_for_shadowban else 'NÃO'}")
print(f"🎯 Limite alcançado: {sucesso + falha} mensagens")

print(f"\n💾 Relatório salvo em: {filename}")
print(f"📊 Para gerar dashboard visual, execute:")
print(f"   python3 generate-dashboard.py {filename}")

print(f"\n🔬 === ANÁLISE CIENTÍFICA ===")
if paused_for_shadowban:
    print(f"🔴 Chip não aquecido confirmado: Limite {sucesso + falha} mensagens")
    print(f"💡 Recomendação: Investir em chip R$ 120 aquecido")
else:
    print(f"🟢 Sistema anti-ban funcionou: {sucesso + falha} mensagens sem ban")
    print(f"📈 Potencial para escalar gradualmente")

print(f"\n🚀 Próximo teste: Chip R$ 120 com estas melhorias!")