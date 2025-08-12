/**
 * 🎯 ESTRATÉGIAS DE MATURAÇÃO DE CHIPS
 * 
 * Diferentes abordagens para maturar chips WhatsApp de forma segura e eficiente.
 * Cada estratégia define um cronograma específico de atividades para diferentes fases.
 */

import logger from '../../../utils/logger.js';

/**
 * Estratégia Gradual Conti Chips
 * Baseada nas melhores práticas da Conti Chips
 */
const gradualContiChips = {
  name: 'Gradual Conti Chips',
  description: 'Estratégia baseada nas práticas da Conti Chips com crescimento gradual',
  duration: 30, // dias
  phases: {
    // Fase 1: Bebê (0-7 dias)
    baby: {
      days: [0, 7],
      dailyActions: [
        { type: 'send_messages', count: 5 },
        { type: 'profile_update', data: { status: 'natural' } }
      ],
      restrictions: {
        maxGroups: 0,
        maxMessages: 10,
        requireVoiceNotes: false
      }
    },
    // Fase 2: Criança (8-14 dias)
    child: {
      days: [8, 14],
      dailyActions: [
        { type: 'send_messages', count: 15 },
        { type: 'join_group', groupUrl: null }, // grupo aleatório
        { type: 'group_interaction', level: 'low' }
      ],
      restrictions: {
        maxGroups: 2,
        maxMessages: 25,
        requireVoiceNotes: true
      }
    },
    // Fase 3: Adolescente (15-21 dias)
    teen: {
      days: [15, 21],
      dailyActions: [
        { type: 'send_messages', count: 30 },
        { type: 'join_group', groupUrl: null },
        { type: 'group_interaction', level: 'moderate' },
        { type: 'voice_messages', count: 3 }
      ],
      restrictions: {
        maxGroups: 4,
        maxMessages: 50,
        requireVoiceNotes: true
      }
    },
    // Fase 4: Adulto (22-30 dias)
    adult: {
      days: [22, 30],
      dailyActions: [
        { type: 'send_messages', count: 50 },
        { type: 'group_interaction', level: 'high' },
        { type: 'voice_messages', count: 5 },
        { type: 'media_sharing', count: 2 }
      ],
      restrictions: {
        maxGroups: 5,
        maxMessages: 100,
        requireVoiceNotes: true
      }
    }
  },

  getDayActions(day) {
    const phase = this.getPhaseForDay(day);
    return phase ? phase.dailyActions : [];
  },

  getPhaseForDay(day) {
    for (const phase of Object.values(this.phases)) {
      if (day >= phase.days[0] && day <= phase.days[1]) {
        return phase;
      }
    }
    return null;
  }
};

/**
 * Estratégia Rápida (Para testes)
 */
const fastMaturation = {
  name: 'Maturação Rápida',
  description: 'Estratégia acelerada para testes e situações urgentes',
  duration: 14, // dias
  phases: {
    initial: {
      days: [0, 3],
      dailyActions: [
        { type: 'send_messages', count: 15 },
        { type: 'profile_update', data: { photo: true } }
      ]
    },
    acceleration: {
      days: [4, 9],
      dailyActions: [
        { type: 'send_messages', count: 40 },
        { type: 'join_group', groupUrl: null },
        { type: 'group_interaction', level: 'moderate' },
        { type: 'voice_messages', count: 5 }
      ]
    },
    maturity: {
      days: [10, 14],
      dailyActions: [
        { type: 'send_messages', count: 80 },
        { type: 'group_interaction', level: 'high' },
        { type: 'voice_messages', count: 8 },
        { type: 'media_sharing', count: 3 }
      ]
    }
  },

  getDayActions(day) {
    const phase = this.getPhaseForDay(day);
    return phase ? phase.dailyActions : [];
  },

  getPhaseForDay(day) {
    for (const phase of Object.values(this.phases)) {
      if (day >= phase.days[0] && day <= phase.days[1]) {
        return phase;
      }
    }
    return null;
  }
};

/**
 * Estratégia Conservadora (Máxima segurança)
 */
const slowSafe = {
  name: 'Lenta e Segura',
  description: 'Estratégia ultra-conservadora com máxima segurança',
  duration: 45, // dias
  phases: {
    dormant: {
      days: [0, 10],
      dailyActions: [
        { type: 'send_messages', count: 2 }
      ]
    },
    awakening: {
      days: [11, 25],
      dailyActions: [
        { type: 'send_messages', count: 8 },
        { type: 'profile_update', data: { status: 'minimal' } }
      ]
    },
    gentle_growth: {
      days: [26, 35],
      dailyActions: [
        { type: 'send_messages', count: 15 },
        { type: 'join_group', groupUrl: null },
        { type: 'group_interaction', level: 'low' }
      ]
    },
    cautious_maturity: {
      days: [36, 45],
      dailyActions: [
        { type: 'send_messages', count: 30 },
        { type: 'group_interaction', level: 'moderate' },
        { type: 'voice_messages', count: 2 }
      ]
    }
  },

  getDayActions(day) {
    const phase = this.getPhaseForDay(day);
    return phase ? phase.dailyActions : [];
  },

  getPhaseForDay(day) {
    for (const phase of Object.values(this.phases)) {
      if (day >= phase.days[0] && day <= phase.days[1]) {
        return phase;
      }
    }
    return null;
  }
};

/**
 * Estratégia Híbrida Social
 * Foca em interações sociais naturais
 */
const socialHybrid = {
  name: 'Híbrido Social',
  description: 'Estratégia focada em interações sociais naturais e networking',
  duration: 25, // dias
  phases: {
    social_introduction: {
      days: [0, 5],
      dailyActions: [
        { type: 'send_messages', count: 8 },
        { type: 'profile_update', data: { complete_profile: true } }
      ]
    },
    network_building: {
      days: [6, 15],
      dailyActions: [
        { type: 'send_messages', count: 25 },
        { type: 'join_group', groupUrl: null },
        { type: 'join_group', groupUrl: null }, // Segundo grupo
        { type: 'group_interaction', level: 'moderate' },
        { type: 'voice_messages', count: 4 }
      ]
    },
    social_maturity: {
      days: [16, 25],
      dailyActions: [
        { type: 'send_messages', count: 60 },
        { type: 'group_interaction', level: 'high' },
        { type: 'voice_messages', count: 8 },
        { type: 'media_sharing', count: 4 },
        { type: 'status_updates', count: 1 }
      ]
    }
  },

  getDayActions(day) {
    const phase = this.getPhaseForDay(day);
    return phase ? phase.dailyActions : [];
  },

  getPhaseForDay(day) {
    for (const phase of Object.values(this.phases)) {
      if (day >= phase.days[0] && day <= phase.days[1]) {
        return phase;
      }
    }
    return null;
  }
};

/**
 * Estratégia de Contingência OracleWA
 * Para pool próprio da OracleWA
 */
const oracleContingency = {
  name: 'Contingência OracleWA',
  description: 'Estratégia especializada para pool de contingência da OracleWA',
  duration: 35, // dias
  phases: {
    stealth_mode: {
      days: [0, 12],
      dailyActions: [
        { type: 'send_messages', count: 5 },
        { type: 'receive_responses', expectation: 'passive' }
      ],
      characteristics: {
        lowProfile: true,
        naturalBehavior: true,
        businessReady: false
      }
    },
    preparation_phase: {
      days: [13, 25],
      dailyActions: [
        { type: 'send_messages', count: 20 },
        { type: 'join_group', groupUrl: null },
        { type: 'group_interaction', level: 'moderate' },
        { type: 'voice_messages', count: 3 },
        { type: 'business_simulation', level: 'light' }
      ],
      characteristics: {
        lowProfile: false,
        naturalBehavior: true,
        businessReady: false
      }
    },
    production_ready: {
      days: [26, 35],
      dailyActions: [
        { type: 'send_messages', count: 50 },
        { type: 'group_interaction', level: 'high' },
        { type: 'voice_messages', count: 6 },
        { type: 'media_sharing', count: 3 },
        { type: 'business_simulation', level: 'full' }
      ],
      characteristics: {
        lowProfile: false,
        naturalBehavior: true,
        businessReady: true
      }
    }
  },

  getDayActions(day) {
    const phase = this.getPhaseForDay(day);
    return phase ? phase.dailyActions : [];
  },

  getPhaseForDay(day) {
    for (const phase of Object.values(this.phases)) {
      if (day >= phase.days[0] && day <= phase.days[1]) {
        return phase;
      }
    }
    return null;
  },

  isProductionReady(chip) {
    const currentPhase = this.getPhaseForDay(chip.currentDay);
    return currentPhase && currentPhase.characteristics?.businessReady === true;
  }
};

// Exportar todas as estratégias
export const MATURATION_STRATEGIES = {
  gradual_conti_chips: gradualContiChips,
  fast_maturation: fastMaturation,
  slow_safe: slowSafe,
  social_hybrid: socialHybrid,
  oracle_contingency: oracleContingency
};

/**
 * Classe helper para gerenciar estratégias
 */
export class MaturationStrategyManager {
  constructor() {
    this.strategies = MATURATION_STRATEGIES;
  }

  /**
   * Obtém estratégia por nome
   */
  getStrategy(name) {
    return this.strategies[name];
  }

  /**
   * Lista todas as estratégias disponíveis
   */
  listStrategies() {
    return Object.keys(this.strategies).map(key => ({
      key,
      name: this.strategies[key].name,
      description: this.strategies[key].description,
      duration: this.strategies[key].duration
    }));
  }

  /**
   * Recomenda estratégia baseada em parâmetros
   */
  recommendStrategy(params) {
    const { urgency, riskTolerance, owner, purpose } = params;

    if (owner === 'oraclewa' && purpose === 'contingency') {
      return 'oracle_contingency';
    }

    if (urgency === 'high') {
      return 'fast_maturation';
    }

    if (riskTolerance === 'low') {
      return 'slow_safe';
    }

    if (purpose === 'social' || purpose === 'networking') {
      return 'social_hybrid';
    }

    // Padrão: Conti Chips
    return 'gradual_conti_chips';
  }

  /**
   * Valida se uma estratégia é adequada para um contexto
   */
  validateStrategy(strategyName, context) {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      return { valid: false, reason: 'Estratégia não encontrada' };
    }

    const { clientType, timeConstraints, complianceLevel } = context;

    // Validações específicas
    if (complianceLevel === 'strict' && strategyName === 'fast_maturation') {
      return { 
        valid: false, 
        reason: 'Estratégia rápida não é adequada para compliance rigoroso' 
      };
    }

    if (timeConstraints === 'tight' && strategyName === 'slow_safe') {
      return {
        valid: false,
        reason: 'Estratégia lenta não atende restrições de tempo'
      };
    }

    return { valid: true };
  }

  /**
   * Obtém progresso estimado de uma estratégia
   */
  getProgress(strategyName, currentDay) {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) return 0;

    return Math.min((currentDay / strategy.duration) * 100, 100);
  }

  /**
   * Obtém próximas ações para um chip
   */
  getNextActions(strategyName, currentDay) {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) return [];

    return strategy.getDayActions(currentDay);
  }
}

export default MaturationStrategyManager;