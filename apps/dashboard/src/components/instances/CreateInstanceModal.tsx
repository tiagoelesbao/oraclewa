'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepData {
  // Step 1: Client Selection
  clientId: string;
  
  // Step 2: Function Type
  functionType: 'broadcast' | 'webhook' | 'support';
  
  // Step 3: Basic Info
  name: string;
  provider: string;
  
  // Step 4: Specific Configuration (varies by function type)
  // Broadcast Config
  broadcastConfig?: {
    dailyLimit: number;
    campaignType: 'promotional' | 'transactional' | 'mixed';
    targetAudience: 'all' | 'segmented';
    messageTypes: string[];
  };
  
  // Webhook Config  
  webhookConfig?: {
    triggers: string[];
    responseDelay: number;
    retryAttempts: number;
    templates: string[];
  };
  
  // Anti-ban settings
  antibanSettings: {
    strategy: string;
    delayMin: number;
    delayMax: number;
    dailyLimit: number;
    hourlyLimit: number;
    batchSize: number;
    pauseBetweenBatches: number;
    respectWarmupPeriod: boolean;
    // Advanced anti-ban features
    enableTypingSimulation: boolean;
    enablePresenceSimulation: boolean;
    enableReadingSimulation: boolean;
    messageVariations: boolean;
    randomizeGreetings: boolean;
    instanceAge: number;
    warmupPhase: 'day1' | 'day2' | 'day3' | 'day7' | 'mature';
    healthScore: number;
  };
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { clients, createInstance, loading } = useApp();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({
    clientId: '',
    functionType: 'broadcast',
    name: '',
    provider: 'evolution',
    antibanSettings: {
      strategy: 'conti_chips',
      delayMin: 30000,
      delayMax: 120000,
      dailyLimit: 100,
      hourlyLimit: 15,
      batchSize: 10,
      pauseBetweenBatches: 15,
      respectWarmupPeriod: true,
      enableTypingSimulation: true,
      enablePresenceSimulation: true,
      enableReadingSimulation: true,
      messageVariations: true,
      randomizeGreetings: true,
      instanceAge: 0,
      warmupPhase: 'day1',
      healthScore: 100,
    },
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Cliente', description: 'Selecione o cliente' },
    { id: 2, title: 'Função', description: 'Tipo de instância' },
    { id: 3, title: 'Informações', description: 'Dados básicos' },
    { id: 4, title: 'Configuração', description: 'Configurações específicas' },
  ];

  const generateSuggestedName = (clientId: string, functionType: string) => {
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'client';
    const timestamp = Date.now().toString().slice(-4);
    return `${clientName}-${functionType}-${timestamp}`;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 2 && stepData.clientId) {
        // Auto-generate name when moving to step 3
        setStepData(prev => ({
          ...prev,
          name: generateSuggestedName(prev.clientId, prev.functionType)
        }));
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!stepData.clientId) {
          newErrors.clientId = 'Selecione um cliente';
        }
        break;
      case 3:
        if (!stepData.name?.trim()) {
          newErrors.name = 'Nome é obrigatório';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      const instanceConfig: any = {
        name: stepData.name,
        clientId: stepData.clientId,
        provider: stepData.provider,
        functionType: stepData.functionType,
        status: 'disconnected',
        antibanSettings: stepData.antibanSettings,
      };

      // Add specific configurations based on function type
      if (stepData.functionType === 'broadcast' && stepData.broadcastConfig) {
        instanceConfig.dailyLimit = stepData.broadcastConfig.dailyLimit;
        instanceConfig.campaignType = stepData.broadcastConfig.campaignType;
        instanceConfig.targetAudience = stepData.broadcastConfig.targetAudience;
        instanceConfig.messageTypes = stepData.broadcastConfig.messageTypes;
      } else if (stepData.functionType === 'webhook' && stepData.webhookConfig) {
        instanceConfig.triggers = stepData.webhookConfig.triggers;
        instanceConfig.responseDelay = stepData.webhookConfig.responseDelay;
        instanceConfig.retryAttempts = stepData.webhookConfig.retryAttempts;
        instanceConfig.templates = stepData.webhookConfig.templates;
      }

      await createInstance(instanceConfig);
      
      // Reset form
      setCurrentStep(1);
      setStepData({
        clientId: '',
        functionType: 'broadcast',
        name: '',
        provider: 'evolution',
        antibanSettings: {
          strategy: 'conti_chips',
          delayMin: 30000,
          delayMax: 120000,
          dailyLimit: 100,
          hourlyLimit: 15,
          batchSize: 10,
          pauseBetweenBatches: 15,
          respectWarmupPeriod: true,
          enableTypingSimulation: true,
          enablePresenceSimulation: true,
          enableReadingSimulation: true,
          messageVariations: true,
          randomizeGreetings: true,
          instanceAge: 0,
          warmupPhase: 'day1',
          healthScore: 100,
        },
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating instance:', error);
    }
  };

  const updateStepData = (field: string, value: any) => {
    setStepData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selecione o Cliente
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Escolha o cliente para o qual esta instância será criada.
              </p>
            </div>
            
            <div className="space-y-3">
              {clients.map(client => (
                <div
                  key={client.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    stepData.clientId === client.id
                      ? 'border-oracle-500 bg-oracle-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateStepData('clientId', client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-500">ID: {client.id}</p>
                    </div>
                    {stepData.clientId === client.id && (
                      <CheckCircleIcon className="w-6 h-6 text-oracle-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {errors.clientId && (
              <p className="text-sm text-red-600">{errors.clientId}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tipo de Instância
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione a função principal desta instância.
              </p>
            </div>
            
            <div className="space-y-3">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  stepData.functionType === 'broadcast'
                    ? 'border-oracle-500 bg-oracle-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateStepData('functionType', 'broadcast')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">📢 Broadcast</h4>
                    <p className="text-sm text-gray-500">Para campanhas e disparos em massa</p>
                    <p className="text-xs text-gray-400 mt-1">Otimizado para alto volume de mensagens</p>
                  </div>
                  {stepData.functionType === 'broadcast' && (
                    <CheckCircleIcon className="w-6 h-6 text-oracle-500" />
                  )}
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  stepData.functionType === 'webhook'
                    ? 'border-oracle-500 bg-oracle-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateStepData('functionType', 'webhook')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">🔗 Webhook</h4>
                    <p className="text-sm text-gray-500">Para recuperação de vendas e automações</p>
                    <p className="text-xs text-gray-400 mt-1">Responde a eventos automaticamente</p>
                  </div>
                  {stepData.functionType === 'webhook' && (
                    <CheckCircleIcon className="w-6 h-6 text-oracle-500" />
                  )}
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  stepData.functionType === 'support'
                    ? 'border-oracle-500 bg-oracle-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateStepData('functionType', 'support')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">💬 Suporte</h4>
                    <p className="text-sm text-gray-500">Para atendimento ao cliente</p>
                    <p className="text-xs text-gray-400 mt-1">Focado em conversas individuais</p>
                  </div>
                  {stepData.functionType === 'support' && (
                    <CheckCircleIcon className="w-6 h-6 text-oracle-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações Básicas
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Instância *
              </label>
              <input
                type="text"
                value={stepData.name}
                onChange={(e) => updateStepData('name', e.target.value)}
                placeholder="ex: imperio-broadcast-001"
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provedor WhatsApp
              </label>
              <div className="space-y-3">
                {[
                  {
                    value: 'evolution',
                    name: 'Evolution API',
                    description: 'Servidor externo dedicado (128.140.7.154)',
                    status: 'operational',
                    features: ['Servidor Externo', 'Múltiplas Instâncias', 'Escalável'],
                    icon: '🚀',
                    details: 'API hospedada em servidor dedicado com alta disponibilidade'
                  },
                  {
                    value: 'baileys',
                    name: 'Baileys (Local)',
                    description: 'Processo local no seu servidor',
                    status: 'operational',
                    features: ['Processo Local', 'Controle Total', 'Privado'],
                    icon: '⚡',
                    details: 'WhatsApp Web JS rodando diretamente no seu servidor'
                  },
                  {
                    value: 'zapi',
                    name: 'Z-API',
                    description: 'API premium com suporte oficial',
                    status: 'offline',
                    features: ['Pago', 'Botões Nativos', 'Suporte 24/7'],
                    icon: '💎',
                    details: 'Solução empresarial com recursos avançados'
                  }
                ].map((provider) => (
                  <div
                    key={provider.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      stepData.provider === provider.value
                        ? 'border-oracle-500 bg-oracle-50'
                        : provider.status === 'offline'
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => provider.status !== 'offline' && updateStepData('provider', provider.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{provider.name}</h4>
                            <div className={`w-2 h-2 rounded-full ${
                              provider.status === 'operational' ? 'bg-green-500' : 
                              provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              provider.status === 'operational' ? 'bg-green-100 text-green-800' : 
                              provider.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {provider.status === 'operational' ? 'Operacional' : 
                               provider.status === 'degraded' ? 'Degradado' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{provider.description}</p>
                          <div className="flex space-x-2 mt-1">
                            {provider.features.map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          {stepData.provider === provider.value && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                              💡 {provider.details || provider.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {stepData.provider === provider.value && (
                        <CheckCircleIcon className="w-6 h-6 text-oracle-500" />
                      )}
                      {provider.status === 'offline' && (
                        <div className="text-xs text-red-600 font-medium">Indisponível</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configurações {stepData.functionType === 'broadcast' ? 'de Broadcast' : 
                stepData.functionType === 'webhook' ? 'de Webhook' : 'de Suporte'}
              </h3>
            </div>
            
            {stepData.functionType === 'broadcast' ? (
              <BroadcastConfig stepData={stepData} updateStepData={updateStepData} />
            ) : stepData.functionType === 'webhook' ? (
              <WebhookConfig stepData={stepData} updateStepData={updateStepData} />
            ) : (
              <SupportConfig stepData={stepData} updateStepData={updateStepData} />
            )}
            
            <AntibanConfig stepData={stepData} updateStepData={updateStepData} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Instância WhatsApp"
      size="lg"
    >
      <div className="mb-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id
                    ? 'bg-oracle-500 border-oracle-500 text-white'
                    : currentStep === step.id
                    ? 'border-oracle-500 text-oracle-500 bg-white'
                    : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3 text-left">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className={`text-xs ${
                  currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px ml-4 mr-4 ${
                  currentStep > step.id ? 'bg-oracle-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onClose : handleBack}
          disabled={loading}
        >
          {currentStep === 1 ? (
            'Cancelar'
          ) : (
            <>
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Voltar
            </>
          )}
        </Button>
        
        <div className="text-sm text-gray-500">
          Passo {currentStep} de {steps.length}
        </div>
        
        <Button
          type="button"
          variant="primary"
          onClick={currentStep === 4 ? handleSubmit : handleNext}
          disabled={loading}
        >
          {loading ? 'Criando...' : currentStep === 4 ? (
            'Criar Instância'
          ) : (
            <>
              Próximo
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

// Component for Broadcast Configuration
const BroadcastConfig: React.FC<{ stepData: StepData; updateStepData: (field: string, value: any) => void }> = ({ stepData, updateStepData }) => {
  const broadcastConfig = stepData.broadcastConfig || {
    dailyLimit: 500,
    campaignType: 'promotional',
    targetAudience: 'all',
    messageTypes: ['text', 'image']
  };

  const updateBroadcastConfig = (field: string, value: any) => {
    updateStepData('broadcastConfig', {
      ...broadcastConfig,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limite Diário de Mensagens
        </label>
        <input
          type="number"
          min="50"
          max="2000"
          value={broadcastConfig.dailyLimit}
          onChange={(e) => updateBroadcastConfig('dailyLimit', parseInt(e.target.value))}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Recomendado: 500-1000 para campanhas grandes</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Campanha
        </label>
        <select
          value={broadcastConfig.campaignType}
          onChange={(e) => updateBroadcastConfig('campaignType', e.target.value)}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
        >
          <option value="promotional">Promocional</option>
          <option value="transactional">Transacional</option>
          <option value="mixed">Misto</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Público-Alvo
        </label>
        <select
          value={broadcastConfig.targetAudience}
          onChange={(e) => updateBroadcastConfig('targetAudience', e.target.value)}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
        >
          <option value="all">Todos os Contatos</option>
          <option value="segmented">Segmentado</option>
        </select>
      </div>
    </div>
  );
};

// Component for Webhook Configuration
const WebhookConfig: React.FC<{ stepData: StepData; updateStepData: (field: string, value: any) => void }> = ({ stepData, updateStepData }) => {
  const webhookConfig = stepData.webhookConfig || {
    triggers: ['order_paid'],
    responseDelay: 5000,
    retryAttempts: 3,
    templates: []
  };

  const updateWebhookConfig = (field: string, value: any) => {
    updateStepData('webhookConfig', {
      ...webhookConfig,
      [field]: value
    });
  };

  const handleTriggerChange = (trigger: string, checked: boolean) => {
    const newTriggers = checked
      ? [...webhookConfig.triggers, trigger]
      : webhookConfig.triggers.filter(t => t !== trigger);
    updateWebhookConfig('triggers', newTriggers);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Disparadores de Webhook
        </label>
        <div className="space-y-2">
          {[
            { id: 'order_paid', label: 'Pedido Pago', description: 'Quando um pedido é confirmado' },
            { id: 'order_expired', label: 'Pedido Expirado', description: 'Quando um pedido expira' },
            { id: 'order_cancelled', label: 'Pedido Cancelado', description: 'Quando um pedido é cancelado' },
            { id: 'user_registered', label: 'Usuário Cadastrado', description: 'Novo cadastro no sistema' }
          ].map(trigger => (
            <label key={trigger.id} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={webhookConfig.triggers.includes(trigger.id)}
                onChange={(e) => handleTriggerChange(trigger.id, e.target.checked)}
                className="mt-1 rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{trigger.label}</div>
                <div className="text-xs text-gray-500">{trigger.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delay de Resposta (segundos)
        </label>
        <input
          type="number"
          min="1"
          max="60"
          value={webhookConfig.responseDelay / 1000}
          onChange={(e) => updateWebhookConfig('responseDelay', parseInt(e.target.value) * 1000)}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Delay antes de enviar a mensagem de recuperação</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tentativas de Reenvio
        </label>
        <input
          type="number"
          min="1"
          max="5"
          value={webhookConfig.retryAttempts}
          onChange={(e) => updateWebhookConfig('retryAttempts', parseInt(e.target.value))}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

// Component for Support Configuration
const SupportConfig: React.FC<{ stepData: StepData; updateStepData: (field: string, value: any) => void }> = ({ stepData, updateStepData }) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Configurações de Suporte</h4>
        <p className="text-sm text-blue-700">
          Instâncias de suporte são otimizadas para atendimento individual e conversas bidirecionais.
        </p>
        <ul className="mt-2 text-xs text-blue-600 space-y-1">
          <li>• Limite diário reduzido para evitar spam</li>
          <li>• Delays menores para respostas rápidas</li>
          <li>• Prioridade para mensagens recebidas</li>
        </ul>
      </div>
    </div>
  );
};

// Component for Anti-ban Configuration
const AntibanConfig: React.FC<{ stepData: StepData; updateStepData: (field: string, value: any) => void }> = ({ stepData, updateStepData }) => {
  const updateAntibanSettings = (field: string, value: any) => {
    updateStepData('antibanSettings', {
      ...stepData.antibanSettings,
      [field]: value
    });
  };

  const getWarmupLimits = (phase: string) => {
    const limits = {
      day1: { min: 10, max: 20 },
      day2: { min: 30, max: 40 },
      day3: { min: 50, max: 60 },
      day7: { min: 70, max: 100 },
      mature: { min: 100, max: 150 }
    };
    return limits[phase as keyof typeof limits] || limits.day1;
  };

  const currentLimits = getWarmupLimits(stepData.antibanSettings.warmupPhase);

  return (
    <div className="border-t border-gray-200 pt-6">
      <h4 className="text-md font-medium text-gray-900 mb-6">🛡️ Configurações Anti-ban Avançadas</h4>
      
      {/* Strategy and Basic Settings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estratégia
          </label>
          <select
            value={stepData.antibanSettings.strategy}
            onChange={(e) => updateAntibanSettings('strategy', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          >
            <option value="conti_chips">🎯 Conti Chips (Recomendado)</option>
            <option value="conservative">🐌 Conservador</option>
            <option value="aggressive">⚡ Agressivo</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {stepData.antibanSettings.strategy === 'conti_chips' && 'Estratégia equilibrada com warmup gradual'}
            {stepData.antibanSettings.strategy === 'conservative' && 'Máxima segurança, menor velocidade'}
            {stepData.antibanSettings.strategy === 'aggressive' && 'Máxima velocidade, maior risco'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fase de Aquecimento
          </label>
          <select
            value={stepData.antibanSettings.warmupPhase}
            onChange={(e) => updateAntibanSettings('warmupPhase', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          >
            <option value="day1">📱 Novo (Dia 1)</option>
            <option value="day2">🔄 Aquecendo (Dia 2)</option>
            <option value="day3">📈 Crescendo (Dia 3)</option>
            <option value="day7">💪 Forte (1 Semana)</option>
            <option value="mature">🏆 Maduro (1+ Mês)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Limite atual: {currentLimits.min}-{currentLimits.max} msgs/dia
          </p>
        </div>
      </div>

      {/* Timing Configuration */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⏱️ Delay Mínimo (seg)
          </label>
          <input
            type="number"
            min="10"
            max="300"
            value={stepData.antibanSettings.delayMin / 1000}
            onChange={(e) => updateAntibanSettings('delayMin', parseInt(e.target.value) * 1000)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⏰ Delay Máximo (seg)
          </label>
          <input
            type="number"
            min="30"
            max="600"
            value={stepData.antibanSettings.delayMax / 1000}
            onChange={(e) => updateAntibanSettings('delayMax', parseInt(e.target.value) * 1000)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Limite por Hora
          </label>
          <input
            type="number"
            min="5"
            max="100"
            value={stepData.antibanSettings.hourlyLimit}
            onChange={(e) => updateAntibanSettings('hourlyLimit', parseInt(e.target.value))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Batch Configuration */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📦 Tamanho do Lote
          </label>
          <input
            type="number"
            min="5"
            max="50"
            value={stepData.antibanSettings.batchSize}
            onChange={(e) => updateAntibanSettings('batchSize', parseInt(e.target.value))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Quantas mensagens enviar antes de pausar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⏸️ Pausa entre Lotes (min)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={stepData.antibanSettings.pauseBetweenBatches}
            onChange={(e) => updateAntibanSettings('pauseBetweenBatches', parseInt(e.target.value))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Tempo de pausa entre lotes</p>
        </div>
      </div>

      {/* Human Simulation Features */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h5 className="text-sm font-medium text-blue-900 mb-3">🤖 Simulações Humanizadas</h5>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={stepData.antibanSettings.enableTypingSimulation}
              onChange={(e) => updateAntibanSettings('enableTypingSimulation', e.target.checked)}
              className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">⌨️ Simulação de Digitação</div>
              <div className="text-xs text-gray-500">Simula tempo real de digitação</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={stepData.antibanSettings.enablePresenceSimulation}
              onChange={(e) => updateAntibanSettings('enablePresenceSimulation', e.target.checked)}
              className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">👀 Simulação de Presença</div>
              <div className="text-xs text-gray-500">Aparece "online" naturalmente</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={stepData.antibanSettings.enableReadingSimulation}
              onChange={(e) => updateAntibanSettings('enableReadingSimulation', e.target.checked)}
              className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">📖 Simulação de Leitura</div>
              <div className="text-xs text-gray-500">Marca mensagens como lidas</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={stepData.antibanSettings.messageVariations}
              onChange={(e) => updateAntibanSettings('messageVariations', e.target.checked)}
              className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">🎭 Variações de Mensagem</div>
              <div className="text-xs text-gray-500">Adiciona prefixos/sufixos únicos</div>
            </div>
          </label>
        </div>
      </div>

      {/* Health and Status Indicators */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium text-green-900">💚 Status de Saúde da Instância</h5>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${stepData.antibanSettings.healthScore >= 80 ? 'bg-green-500' : stepData.antibanSettings.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-900">{stepData.antibanSettings.healthScore}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-600">Idade do Chip</div>
            <div className="font-medium">{stepData.antibanSettings.instanceAge} dias</div>
          </div>
          <div>
            <div className="text-gray-600">Fase Atual</div>
            <div className="font-medium capitalize">{stepData.antibanSettings.warmupPhase.replace('day', 'Dia ')}</div>
          </div>
          <div>
            <div className="text-gray-600">Limite Diário</div>
            <div className="font-medium">{currentLimits.min}-{currentLimits.max} msgs</div>
          </div>
        </div>

        <div className="mt-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={stepData.antibanSettings.respectWarmupPeriod}
              onChange={(e) => updateAntibanSettings('respectWarmupPeriod', e.target.checked)}
              className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">🔒 Respeitar Período de Aquecimento</div>
              <div className="text-xs text-gray-500">Aplica limites baseados na idade do chip automaticamente</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CreateInstanceModal;