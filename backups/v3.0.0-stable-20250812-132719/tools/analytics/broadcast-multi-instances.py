#!/usr/bin/env python3

import json
import time
import requests
import random
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import threading

# Configurações do Pool de Instâncias
EVOLUTION_URL = "http://128.140.7.154:8080"
API_KEY = "Imperio2024@EvolutionSecure"

# Pool de 3 instâncias com chips R$ 120
INSTANCES_POOL = [
    "imperio-broadcast-1",
    "imperio-broadcast-2", 
    "imperio-broadcast-3"
]

class MultiInstanceManager:
    def __init__(self):
        self.instances = INSTANCES_POOL.copy()
        self.instance_stats = {inst: {"sent": 0, "failed": 0, "last_used": None, "status": "unknown"} for inst in self.instances}
        self.current_instance_index = 0
        self.lock = threading.Lock()
        self.banned_instances = set()
        
    async def check_all_instances(self):
        """Verifica status de todas as instâncias"""
        print("🔍 Verificando status das instâncias...")
        
        for instance in self.instances:
            try:
                response = requests.get(
                    f"{EVOLUTION_URL}/instance/connectionState/{instance}",
                    headers={"apikey": API_KEY},
                    timeout=10
                )
                
                if response.status_code == 200:
                    state = response.json().get("instance", {}).get("state", "unknown")
                    self.instance_stats[instance]["status"] = state
                    
                    if state == "open":
                        print(f"   ✅ {instance}: CONECTADA")
                    elif state == "connecting":
                        print(f"   🟡 {instance}: CONECTANDO...")
                    else:
                        print(f"   ❌ {instance}: {state}")
                        self.banned_instances.add(instance)
                else:
                    print(f"   ❌ {instance}: Erro HTTP {response.status_code}")
                    self.banned_instances.add(instance)
                    
            except Exception as e:
                print(f"   ❌ {instance}: Erro - {str(e)}")
                self.banned_instances.add(instance)
        
        # Remover instâncias banidas/com problema
        active_instances = [inst for inst in self.instances if inst not in self.banned_instances]
        
        if not active_instances:
            print("🚨 ERRO CRÍTICO: Nenhuma instância disponível!")
            return False
            
        print(f"\n📊 Instâncias ativas: {len(active_instances)}/{len(self.instances)}")
        return True
    
    def get_next_instance(self):
        """Seleciona próxima instância usando load balancing inteligente"""
        with self.lock:
            # Filtrar instâncias ativas
            active_instances = [inst for inst in self.instances if inst not in self.banned_instances]
            
            if not active_instances:
                return None
            
            # Escolher instância com menos mensagens enviadas
            best_instance = min(active_instances, key=lambda x: self.instance_stats[x]["sent"])
            
            # Atualizar stats
            self.instance_stats[best_instance]["last_used"] = datetime.now()
            
            return best_instance
    
    def report_result(self, instance, success):
        """Reporta resultado do envio para estatísticas"""
        with self.lock:
            if success:
                self.instance_stats[instance]["sent"] += 1
            else:
                self.instance_stats[instance]["failed"] += 1
                
                # Se muitas falhas, marcar como problemática
                total_attempts = self.instance_stats[instance]["sent"] + self.instance_stats[instance]["failed"]
                failure_rate = self.instance_stats[instance]["failed"] / max(1, total_attempts)
                
                if failure_rate > 0.5 and total_attempts > 10:  # >50% falhas em 10+ tentativas
                    print(f"⚠️ Instância {instance} com alta taxa de falhas ({failure_rate*100:.1f}%)")
                    self.banned_instances.add(instance)
    
    def get_stats_summary(self):
        """Retorna resumo das estatísticas"""
        total_sent = sum(stats["sent"] for stats in self.instance_stats.values())
        total_failed = sum(stats["failed"] for stats in self.instance_stats.values())
        
        return {
            "total_sent": total_sent,
            "total_failed": total_failed,
            "success_rate": (total_sent / max(1, total_sent + total_failed)) * 100,
            "active_instances": len([inst for inst in self.instances if inst not in self.banned_instances]),
            "instance_details": self.instance_stats
        }

class AdvancedAntibanManager:
    def __init__(self):
        # Delays ainda mais seguros para chips aquecidos
        self.delay_base_min = 15  # Reduzido de 25 para 15 (chips aquecidos)
        self.delay_base_max = 35  # Reduzido de 45 para 35
        self.variacao_extra = 10
        
        # Pausas otimizadas para múltiplas instâncias
        self.msgs_per_batch = 10  # Maior pois temos 3 instâncias
        self.long_pause_min = 60   # Reduzido para 1 min
        self.long_pause_max = 180  # Reduzido para 3 min
        
        # Limites aumentados para chips premium
        self.daily_limit = 1000    # 1000 msgs/dia total
        self.instance_limit = 350  # 350 msgs/dia por instância
        
    def get_humanized_delay(self):
        """Delay otimizado para chips aquecidos"""
        base_delay = random.randint(self.delay_base_min, self.delay_base_max)
        extra_variation = random.randint(-self.variacao_extra, self.variacao_extra)
        final_delay = max(10, base_delay + extra_variation)  # Mínimo 10s
        return final_delay
    
    def get_long_pause(self):
        """Pausa otimizada para múltiplas instâncias"""
        return random.randint(self.long_pause_min, self.long_pause_max)

class EnhancedTemplateGenerator:
    def __init__(self):
        # Templates expandidos para chips premium
        self.greetings = [
            "Fala", "Oi", "Olá", "E aí", "Boas notícias", 
            "Atenção", "Oportunidade", "Última chance"
        ]
        
        self.title_phrases = [
            "o próximo título *está valendo 90K*",
            "o *título de 90 mil* está disponível", 
            "tem um *prêmio de 90K* liberado",
            "o *título premiado de R$ 90.000*",
            "*90 MIL REAIS* estão esperando",
            "a *premiação de 90K* foi liberada",
            "o *jackpot de R$ 90.000* está ativo"
        ]
        
        self.urgency_phrases = [
            "Acabaram de reservar mas não foi pago ❌💸",
            "Alguém desistiu da última hora ❌",
            "Vaga liberada agora há pouco ⚡", 
            "Cancelaram o pagamento há 10 minutos ❌",
            "Pessoa anterior não completou ❌",
            "Reserva expirou há 5 minutos ⏰",
            "Sistema liberou nova vaga 🔓"
        ]
        
        self.cta_phrases = [
            "Que tal fazer uma fézinha?",
            "Aproveita essa oportunidade!",
            "Garante logo antes que esgote!",
            "Corre que vai rápido!",
            "Não perde essa chance!",
            "Clica agora e participa!",
            "Última oportunidade!"
        ]
    
    def generate_unique_template(self, nome, message_number, instance_name):
        """Gera template único com variação baseada na instância"""
        greeting = random.choice(self.greetings)
        title = random.choice(self.title_phrases)
        urgency = random.choice(self.urgency_phrases)
        cta = random.choice(self.cta_phrases)
        
        # Adicionar variação baseada na instância
        instance_seed = hash(instance_name) % 4
        
        structures = [
            f"{greeting} {nome}! Você viu que {title}? 🤑\n\n{urgency}\n\n{cta}\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
            
            f"{greeting} {nome}!\n\n{title.capitalize()} e {urgency.lower()}\n\n{cta}\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
            
            f"{nome}, {urgency.lower()}\n\nSabia que {title}? 💰\n\n{cta}\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB",
            
            f"⚡ URGENTE {nome}!\n\n{title.capitalize()}!\n\n{urgency}\n\n{cta}\n👉 https://imperiopremioss.com/campanha/rapidinha-r-20000000-em-premiacoes?&afiliado=RL9OT66ZAB"
        ]
        
        return structures[instance_seed]

def send_message_to_instance(instance_manager, antiban, template_gen, lead, message_number):
    """Envia mensagem usando pool de instâncias"""
    
    # Selecionar instância
    instance = instance_manager.get_next_instance()
    if not instance:
        return {
            "success": False,
            "error": "Nenhuma instância disponível",
            "lead": lead,
            "message_number": message_number
        }
    
    # Gerar template único
    mensagem = template_gen.generate_unique_template(lead['nome'], message_number, instance)
    
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
    
    resultado = {
        "id": message_number,
        "nome": lead['nome'],
        "telefone": lead['telefone'],
        "instance": instance,
        "timestamp": datetime.now().isoformat(),
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{EVOLUTION_URL}/message/sendText/{instance}",
            json=payload,
            headers=headers,
            timeout=30
        )
        response_time = (time.time() - start_time) * 1000
        
        if response.status_code == 200 or response.status_code == 201:
            resultado.update({
                "success": True,
                "response_time": response_time,
                "message_id": response.json().get('key', {}).get('id', 'unknown')
            })
            instance_manager.report_result(instance, True)
            
        else:
            resultado.update({
                "success": False,
                "error": response.text[:200]
            })
            instance_manager.report_result(instance, False)
            
    except Exception as e:
        resultado.update({
            "success": False,
            "error": str(e)
        })
        instance_manager.report_result(instance, False)
    
    return resultado

async def main():
    print("🚀 === BROADCAST MULTI-INSTÂNCIAS - CHIPS R$ 120 ===")
    print("🔥 Sistema com 3 instâncias premium")
    print("💎 Load balancing inteligente")
    print("🛡️ Anti-ban avançado")
    
    # Inicializar sistemas
    instance_manager = MultiInstanceManager()
    antiban = AdvancedAntibanManager()
    template_gen = EnhancedTemplateGenerator()
    
    # Verificar instâncias
    if not await instance_manager.check_all_instances():
        print("❌ Não é possível continuar sem instâncias ativas")
        return
    
    # Carregar leads
    leads = []
    try:
        with open('leads/leads-imperio-600.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines[1:]:  # Pula header
                if ';' in line:
                    nome, telefone = line.strip().split(';')
                    leads.append({'nome': nome, 'telefone': telefone})
    except FileNotFoundError:
        print("❌ Arquivo leads-imperio-600.csv não encontrado")
        return
    
    print(f"\n📊 Configuração do teste:")
    print(f"   📱 Instâncias ativas: {len([i for i in INSTANCES_POOL if i not in instance_manager.banned_instances])}")
    print(f"   📋 Total de leads: {len(leads)}")
    print(f"   ⚡ Velocidade esperada: ~150-200 msgs/hora")
    print(f"   🛡️ Limite diário: {antiban.daily_limit} mensagens")
    print(f"   ⏰ Iniciando envio...\n")
    
    # Tracking
    inicio = datetime.now()
    resultados_detalhados = []
    
    # Envio das mensagens
    for i, lead in enumerate(leads, 1):
        # Verificar limites
        stats = instance_manager.get_stats_summary()
        if stats["total_sent"] + stats["total_failed"] >= antiban.daily_limit:
            print(f"\n🛑 Limite diário atingido ({antiban.daily_limit} mensagens)")
            break
        
        print(f"📤 [{i}/{len(leads)}] Enviando para {lead['nome']} ({lead['telefone'][:8]}...)")
        
        # Enviar mensagem
        resultado = send_message_to_instance(instance_manager, antiban, template_gen, lead, i)
        resultados_detalhados.append(resultado)
        
        if resultado["success"]:
            print(f"   ✅ Enviada via {resultado['instance']} ({resultado.get('response_time', 0):.0f}ms)")
        else:
            print(f"   ❌ Falha via {resultado.get('instance', 'N/A')}: {resultado['error'][:50]}")
        
        # Pausa longa a cada lote
        if i % antiban.msgs_per_batch == 0 and i < len(leads):
            long_pause = antiban.get_long_pause()
            print(f"\n   🔄 PAUSA ESTRATÉGICA: {long_pause//60}min {long_pause%60}s")
            print(f"   📊 Stats atuais: {stats['total_sent']} enviadas, {stats['success_rate']:.1f}% sucesso")
            time.sleep(long_pause)
        else:
            # Delay humanizado normal
            delay = antiban.get_humanized_delay()
            print(f"   ⏱️ Aguardando {delay}s...")
            time.sleep(delay)
        
        # Relatório parcial a cada 20 mensagens
        if i % 20 == 0:
            stats = instance_manager.get_stats_summary()
            print(f"\n📊 === RELATÓRIO PARCIAL ===")
            print(f"✅ Total enviadas: {stats['total_sent']}")
            print(f"❌ Total falharam: {stats['total_failed']}")
            print(f"📈 Taxa de sucesso: {stats['success_rate']:.1f}%")
            print(f"📱 Instâncias ativas: {stats['active_instances']}")
            
            # Mostrar stats por instância
            for inst, data in stats['instance_details'].items():
                if inst not in instance_manager.banned_instances:
                    total_inst = data['sent'] + data['failed']
                    rate_inst = (data['sent'] / max(1, total_inst)) * 100
                    print(f"   {inst}: {data['sent']}/{total_inst} ({rate_inst:.1f}%)")
            print()
    
    # Relatório final
    fim = datetime.now()
    duracao = (fim - inicio).total_seconds() / 60
    final_stats = instance_manager.get_stats_summary()
    
    print(f"\n🎉 === TESTE MULTI-INSTÂNCIAS CONCLUÍDO ===")
    print(f"📊 Total enviadas: {final_stats['total_sent']}")
    print(f"❌ Total falharam: {final_stats['total_failed']}")
    print(f"📈 Taxa de sucesso: {final_stats['success_rate']:.1f}%")
    print(f"⏰ Duração: {duracao:.1f} minutos")
    print(f"⚡ Velocidade real: {(final_stats['total_sent'] + final_stats['total_failed']) / (duracao / 60):.1f} msgs/hora")
    print(f"📱 Instâncias utilizadas: {final_stats['active_instances']}/{len(INSTANCES_POOL)}")
    
    # Salvar relatório
    relatorio = {
        "resumo": {
            "instancias_utilizadas": final_stats['active_instances'],
            "total_instancias": len(INSTANCES_POOL),
            "mensagens_enviadas": final_stats['total_sent'] + final_stats['total_failed'],
            "sucessos": final_stats['total_sent'],
            "falhas": final_stats['total_failed'],
            "taxa_sucesso": f"{final_stats['success_rate']:.1f}%",
            "duracao_minutos": f"{duracao:.1f}",
            "velocidade_real": f"{(final_stats['total_sent'] + final_stats['total_failed']) / (duracao / 60):.1f} msgs/hora"
        },
        "instancias_detalhes": final_stats['instance_details'],
        "configuracao": {
            "chips_tipo": "R$ 120 (aquecidos 7 dias)",
            "delay_range": f"{antiban.delay_base_min}-{antiban.delay_base_max}s",
            "batch_size": antiban.msgs_per_batch,
            "limite_diario": antiban.daily_limit
        },
        "resultados_detalhados": resultados_detalhados,
        "timestamp": datetime.now().isoformat()
    }
    
    timestamp = int(time.time())
    filename = f"broadcast-multi-instances-{timestamp}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(relatorio, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Relatório salvo: {filename}")
    print(f"📊 Para dashboard: python3 generate-dashboard.py {filename}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())