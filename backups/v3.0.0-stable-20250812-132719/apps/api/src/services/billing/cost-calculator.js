/**
 * Cost Calculator
 * Calcula custos baseado nos providers utilizados
 */

import logger from '../../utils/logger.js';

class CostCalculator {
  constructor() {
    this.providers = {
      'evolution-baileys': {
        name: 'Evolution API + Baileys',
        type: 'free',
        costs: {
          setup: 0,
          monthly: 0,
          perInstance: 0,
          perMessage: 0
        },
        features: {
          buttons: false,
          lists: false,
          media: true,
          typing: true,
          groups: true,
          broadcast: true,
          webhooks: true
        },
        limits: {
          messagesPerDay: 5000,
          messagesPerHour: 500,
          instancesMax: 100
        },
        pros: [
          'Completamente gratuito',
          'Sem limite de instâncias',
          'Alto volume de mensagens',
          'Suporta mídia e grupos',
          'Ideal para texto simples'
        ],
        cons: [
          'Sem botões interativos',
          'Sem listas nativas',
          'Recursos limitados',
          'Dependente do servidor próprio'
        ]
      },
      'z-api': {
        name: 'Z-API Premium',
        type: 'premium',
        costs: {
          setup: 0,
          monthly: 0,
          perInstance: 99,
          perMessage: 0
        },
        features: {
          buttons: true,
          lists: true,
          media: true,
          typing: true,
          groups: true,
          broadcast: true,
          webhooks: true,
          polls: true,
          reactions: true,
          status: true,
          catalogs: true
        },
        limits: {
          messagesPerDay: 10000,
          messagesPerHour: 1000,
          instancesMax: 50
        },
        pros: [
          'Botões interativos nativos',
          'Listas e enquetes',
          'Recursos premium completos',
          'Alta performance',
          'Suporte profissional'
        ],
        cons: [
          'R$ 99 por instância/mês',
          'Custo adicional por servidor',
          'Limite máximo de instâncias'
        ]
      }
    };
  }

  /**
   * Calcula custo de uma configuração específica
   */
  calculateCost(config) {
    const {
      provider,
      instances = 1,
      messages = 1000,
      months = 1,
      features = []
    } = config;

    const providerData = this.providers[provider];
    if (!providerData) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const calculation = {
      provider: provider,
      providerName: providerData.name,
      breakdown: {
        setup: providerData.costs.setup,
        monthly: providerData.costs.monthly * months,
        instances: providerData.costs.perInstance * instances * months,
        messages: providerData.costs.perMessage * messages
      },
      total: 0,
      currency: 'BRL',
      period: months === 1 ? 'mensal' : `${months} meses`,
      instances,
      messages,
      features: providerData.features,
      limits: providerData.limits
    };

    calculation.total = calculation.breakdown.setup + 
                      calculation.breakdown.monthly + 
                      calculation.breakdown.instances + 
                      calculation.breakdown.messages;

    return calculation;
  }

  /**
   * Compara custos entre providers
   */
  compareCosts(config) {
    const comparisons = [];

    for (const providerName of Object.keys(this.providers)) {
      const cost = this.calculateCost({
        ...config,
        provider: providerName
      });

      comparisons.push(cost);
    }

    // Ordenar por custo total
    comparisons.sort((a, b) => a.total - b.total);

    // Adicionar score de adequação
    comparisons.forEach(comp => {
      comp.adequacyScore = this.calculateAdequacyScore(comp, config);
    });

    return {
      configurations: comparisons,
      recommendation: this.getRecommendation(comparisons, config),
      savings: this.calculateSavings(comparisons)
    };
  }

  /**
   * Calcula score de adequação
   */
  calculateAdequacyScore(costCalc, config) {
    let score = 0;
    const weights = {
      cost: 40,
      features: 30,
      limits: 20,
      reliability: 10
    };

    // Score por custo (invertido - menor custo = maior score)
    const maxCost = Math.max(...Object.values(this.providers).map(p => p.costs.perInstance * (config.instances || 1)));
    const costScore = maxCost === 0 ? 100 : ((maxCost - costCalc.total) / maxCost) * 100;
    score += costScore * (weights.cost / 100);

    // Score por recursos necessários
    let featureScore = 0;
    if (config.requireButtons && costCalc.features.buttons) featureScore += 30;
    if (config.requireLists && costCalc.features.lists) featureScore += 20;
    if (config.requireMedia && costCalc.features.media) featureScore += 10;
    featureScore += 40; // Base score
    score += featureScore * (weights.features / 100);

    // Score por limites
    let limitScore = 0;
    if (costCalc.limits.messagesPerDay >= (config.messages || 1000)) limitScore += 50;
    if (costCalc.limits.instancesMax >= (config.instances || 1)) limitScore += 50;
    score += limitScore * (weights.limits / 100);

    // Score por confiabilidade (baseado no tipo)
    const reliabilityScore = costCalc.provider === 'z-api' ? 80 : 60;
    score += reliabilityScore * (weights.reliability / 100);

    return Math.round(score);
  }

  /**
   * Obtém recomendação baseada na comparação
   */
  getRecommendation(comparisons, config) {
    const budget = config.budget || 0;
    const requiresAdvancedFeatures = config.requireButtons || config.requireLists;

    // Se tem orçamento E precisa de recursos avançados
    if (budget >= 99 && requiresAdvancedFeatures) {
      const premium = comparisons.find(c => c.provider === 'z-api');
      return {
        recommended: premium,
        reason: 'Orçamento permite e recursos avançados são necessários',
        confidence: 90
      };
    }

    // Se orçamento limitado ou não precisa de recursos avançados
    const free = comparisons.find(c => c.provider === 'evolution-baileys');
    return {
      recommended: free,
      reason: 'Custo-benefício otimizado para necessidades básicas',
      confidence: 85
    };
  }

  /**
   * Calcula economias potenciais
   */
  calculateSavings(comparisons) {
    if (comparisons.length < 2) return null;

    const cheapest = comparisons[0];
    const mostExpensive = comparisons[comparisons.length - 1];

    return {
      monthly: mostExpensive.total - cheapest.total,
      annual: (mostExpensive.total - cheapest.total) * 12,
      percentage: mostExpensive.total > 0 
        ? Math.round(((mostExpensive.total - cheapest.total) / mostExpensive.total) * 100)
        : 0
    };
  }

  /**
   * Projeta custos de crescimento
   */
  projectGrowthCosts(baseConfig, growthScenarios) {
    const projections = [];

    for (const scenario of growthScenarios) {
      const config = {
        ...baseConfig,
        instances: scenario.instances,
        messages: scenario.messages,
        months: scenario.months || 1
      };

      const comparison = this.compareCosts(config);

      projections.push({
        scenario: scenario.name,
        period: scenario.months || 1,
        instances: scenario.instances,
        messages: scenario.messages,
        costs: comparison.configurations,
        recommendation: comparison.recommendation,
        savings: comparison.savings
      });
    }

    return projections;
  }

  /**
   * Calcula ROI baseado em receita esperada
   */
  calculateROI(config, expectedRevenue) {
    const cost = this.calculateCost(config);
    
    if (cost.total === 0) {
      return {
        roi: Infinity,
        profit: expectedRevenue,
        breakeven: 0,
        margin: 100
      };
    }

    const profit = expectedRevenue - cost.total;
    const roi = (profit / cost.total) * 100;
    const margin = (profit / expectedRevenue) * 100;

    return {
      cost: cost.total,
      revenue: expectedRevenue,
      profit,
      roi: Math.round(roi * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      breakeven: cost.total,
      paybackPeriod: expectedRevenue > 0 ? cost.total / (expectedRevenue / 30) : Infinity
    };
  }

  /**
   * Gera relatório detalhado de custos
   */
  generateCostReport(clientId, config) {
    const comparison = this.compareCosts(config);
    const scenarios = [
      { name: 'Atual', instances: config.instances || 1, messages: config.messages || 1000 },
      { name: 'Crescimento 2x', instances: (config.instances || 1) * 2, messages: (config.messages || 1000) * 2 },
      { name: 'Crescimento 5x', instances: (config.instances || 1) * 3, messages: (config.messages || 1000) * 5 },
      { name: 'Escala Enterprise', instances: 10, messages: 50000 }
    ];

    const projections = this.projectGrowthCosts(config, scenarios);

    return {
      clientId,
      timestamp: new Date().toISOString(),
      currentConfig: config,
      comparison: comparison,
      projections: projections,
      recommendations: [
        {
          scenario: 'Início/Teste',
          provider: 'evolution-baileys',
          reason: 'Sem custos, ideal para validação'
        },
        {
          scenario: 'Crescimento com recursos avançados',
          provider: 'z-api',
          reason: 'Botões e listas aumentam conversão'
        },
        {
          scenario: 'Alto volume básico',
          provider: 'evolution-baileys',
          reason: 'Custo zero com alta capacidade'
        }
      ],
      migrationPath: this.suggestMigrationPath(config)
    };
  }

  /**
   * Sugere caminho de migração
   */
  suggestMigrationPath(config) {
    const path = [];

    // Fase 1: Começar com Evolution Baileys
    path.push({
      phase: 1,
      title: 'Validação e Setup Inicial',
      provider: 'evolution-baileys',
      duration: '1-3 meses',
      goals: ['Validar sistema', 'Treinar equipe', 'Estabelecer processos'],
      cost: 0
    });

    // Fase 2: Avaliar necessidade de recursos avançados
    if (config.requireButtons || config.requireLists) {
      path.push({
        phase: 2,
        title: 'Migração para Recursos Premium',
        provider: 'z-api',
        duration: '1-2 semanas',
        goals: ['Implementar botões', 'Melhorar UX', 'Aumentar conversão'],
        cost: 99 * (config.instances || 1)
      });
    }

    // Fase 3: Otimização baseada em resultados
    path.push({
      phase: path.length + 1,
      title: 'Otimização Baseada em Dados',
      provider: 'hybrid',
      duration: 'Contínuo',
      goals: ['Otimizar custos', 'Maximizar ROI', 'Escalar eficientemente'],
      cost: 'Variável'
    });

    return path;
  }

  /**
   * Obtém informações de um provider
   */
  getProviderInfo(providerName) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return {
      ...provider,
      costExample: this.calculateCost({
        provider: providerName,
        instances: 1,
        messages: 1000,
        months: 1
      })
    };
  }

  /**
   * Lista todos os providers disponíveis
   */
  listProviders() {
    return Object.keys(this.providers).map(name => ({
      name,
      ...this.providers[name]
    }));
  }
}

// Singleton
const costCalculator = new CostCalculator();

export default costCalculator;