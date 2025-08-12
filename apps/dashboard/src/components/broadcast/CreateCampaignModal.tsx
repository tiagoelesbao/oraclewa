'use client';

import React, { useState } from 'react';
import {
  SpeakerWaveIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CampaignFormData {
  name: string;
  clientId: string;
  instanceIds: string[];
  templateId: string;
  targetList: Array<{
    name: string;
    phone: string;
    variables?: Record<string, string>;
  }>;
  useVariations: boolean;
  variationIds: string[];
  scheduleType: 'immediate' | 'scheduled';
  scheduledTime?: Date;
  antibanSettings: {
    strategy: string;
    delayMin: number;
    delayMax: number;
    dailyLimit: number;
    hourlyLimit: number;
    batchSize: number;
    pauseBetweenBatches: number;
  };
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { clients, instances, templates, createCampaign, loading } = useApp();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    clientId: '',
    instanceIds: [],
    templateId: '',
    targetList: [],
    useVariations: false,
    variationIds: [],
    scheduleType: 'immediate',
    antibanSettings: {
      strategy: 'conti_chips',
      delayMin: 30,
      delayMax: 120,
      dailyLimit: 100,
      hourlyLimit: 15,
      batchSize: 10,
      pauseBetweenBatches: 15,
    },
  });

  const [csvData, setCsvData] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Cliente & Instâncias', icon: UserGroupIcon },
    { id: 2, title: 'Template & Variações', icon: DocumentTextIcon },
    { id: 3, title: 'Lista de Contatos', icon: DocumentArrowUpIcon },
    { id: 4, title: 'Configurações Anti-ban', icon: CogIcon },
    { id: 5, title: 'Agendamento', icon: ClockIcon },
  ];

  // Get available instances for selected client
  const availableInstances = instances.filter(instance => 
    instance.clientId === formData.clientId && 
    ['connected', 'warming'].includes(instance.status)
  );

  // Get available templates for selected client
  const availableTemplates = templates.filter(template => 
    template.clientId === formData.clientId
  );

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.clientId) newErrors.clientId = 'Selecione um cliente';
        if (formData.instanceIds.length === 0) newErrors.instanceIds = 'Selecione pelo menos uma instância';
        break;
      case 2:
        if (!formData.templateId) newErrors.templateId = 'Selecione um template';
        break;
      case 3:
        if (formData.targetList.length === 0) newErrors.targetList = 'Adicione pelo menos um contato';
        break;
      case 4:
        if (formData.antibanSettings.delayMin >= formData.antibanSettings.delayMax) {
          newErrors.delays = 'Delay mínimo deve ser menor que o máximo';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      await createCampaign({
        name: formData.name,
        clientId: formData.clientId,
        instanceIds: formData.instanceIds,
        templateId: formData.templateId,
        targetList: formData.targetList,
        status: formData.scheduleType === 'immediate' ? 'draft' : 'scheduled',
        settings: {
          antibanSettings: {
            ...formData.antibanSettings,
            strategy: formData.antibanSettings.strategy as 'conti_chips' | 'aggressive' | 'conservative',
            delayMin: formData.antibanSettings.delayMin * 1000,
            delayMax: formData.antibanSettings.delayMax * 1000,
            respectWarmupPeriod: true,
          },
          scheduleType: formData.scheduleType,
          scheduledTime: formData.scheduledTime,
          useVariations: formData.useVariations,
          variationIds: formData.variationIds,
        },
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const processCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const contacts = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const contact: any = {
        id: `contact_${Date.now()}_${index}`,
        name: values[0] || `Contato ${index + 1}`,
        phone: values[1] || '',
        variables: {},
      };

      // Map additional columns as variables
      for (let i = 2; i < headers.length; i++) {
        if (values[i]) {
          contact.variables[headers[i]] = values[i];
        }
      }

      return contact;
    }).filter(contact => contact.phone);

    setFormData(prev => ({ ...prev, targetList: contacts }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Campanha Black Friday 2024"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  clientId: e.target.value,
                  instanceIds: [], // Reset instances when client changes
                  templateId: '', // Reset template when client changes
                }))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.clientId ? 'border-error-500' : ''
                }`}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-error-600">{errors.clientId}</p>
              )}
            </div>

            {formData.clientId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instâncias WhatsApp * (Selecione uma ou mais)
                </label>
                {availableInstances.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhuma instância conectada encontrada para este cliente.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Conecte pelo menos uma instância na aba "Instâncias" primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableInstances.map(instance => (
                      <label key={instance.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.instanceIds.includes(instance.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                instanceIds: [...prev.instanceIds, instance.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                instanceIds: prev.instanceIds.filter(id => id !== instance.id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{instance.name}</span>
                            <Badge 
                              variant={instance.status === 'connected' ? 'success' : 'warning'} 
                              size="sm"
                            >
                              {instance.status === 'connected' ? 'Conectada' : 'Aquecendo'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {instance.phone} • {instance.messagesCount.toLocaleString()} mensagens enviadas
                          </div>
                          <div className="text-xs text-gray-400">
                            Limite: {instance.dailyLimit}/dia • Maturação: {
                              instance.maturationLevel === 'mature' ? 'Maduro' :
                              instance.maturationLevel === 'warming' ? 'Aquecendo' : 'Novo'
                            }
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.instanceIds && (
                  <p className="mt-1 text-sm text-error-600">{errors.instanceIds}</p>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template de Mensagem *
              </label>
              {availableTemplates.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhum template encontrado para este cliente.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      // TODO: Open template creation modal or redirect to templates page
                      alert('Funcionalidade de criar template será implementada');
                    }}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableTemplates.map(template => (
                    <label key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={formData.templateId === template.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                        className="mt-1 h-4 w-4 text-oracle-600 border-gray-300 focus:ring-oracle-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="secondary" size="sm">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {template.content.substring(0, 100)}
                          {template.content.length > 100 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Variáveis: {template.variables.join(', ') || 'Nenhuma'} • 
                          Usado {template.usageCount} vezes
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.templateId && (
                <p className="mt-1 text-sm text-error-600">{errors.templateId}</p>
              )}
            </div>

            {formData.templateId && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="useVariations"
                    checked={formData.useVariations}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      useVariations: e.target.checked,
                      variationIds: e.target.checked ? prev.variationIds : []
                    }))}
                    className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                  />
                  <label htmlFor="useVariations" className="text-sm font-medium text-gray-700">
                    Usar variações de template (recomendado para anti-ban)
                  </label>
                </div>

                {formData.useVariations && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm text-gray-600">
                      As variações serão alternadas automaticamente durante o envio para parecer mais natural.
                    </p>
                    {/* Template variations would be loaded here */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 Variações ajudam a evitar detecção por algoritmos anti-spam
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lista de Contatos *
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Cole o CSV ou digite os dados (formato: nome,telefone,variavel1,variavel2...)
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => {
                      setCsvData(e.target.value);
                      if (e.target.value.trim()) {
                        processCsvData(e.target.value);
                      }
                    }}
                    placeholder={`João Silva,5511999999999,Produto A,Premium
Maria Santos,5511888888888,Produto B,Standard
Pedro Costa,5511777777777,Produto C,Premium`}
                    rows={6}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm font-mono"
                  />
                </div>

                {formData.targetList.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Contatos Carregados ({formData.targetList.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      {formData.targetList.slice(0, 5).map((contact, index) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm">{contact.name} - {contact.phone}</span>
                          {Object.keys(contact.variables || {}).length > 0 && (
                            <span className="text-xs text-gray-500">
                              +{Object.keys(contact.variables || {}).length} variáveis
                            </span>
                          )}
                        </div>
                      ))}
                      {formData.targetList.length > 5 && (
                        <div className="text-xs text-gray-500 mt-2">
                          ... e mais {formData.targetList.length - 5} contatos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.targetList && (
                <p className="mt-1 text-sm text-error-600">{errors.targetList}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Anti-ban</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estratégia
                  </label>
                  <select
                    value={formData.antibanSettings.strategy}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, strategy: e.target.value }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  >
                    <option value="conti_chips">Conti Chips (Recomendado)</option>
                    <option value="conservative">Conservador</option>
                    <option value="aggressive">Agressivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite por Hora
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.antibanSettings.hourlyLimit}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, hourlyLimit: parseInt(e.target.value) }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delay Mínimo (segundos)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={formData.antibanSettings.delayMin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, delayMin: parseInt(e.target.value) }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delay Máximo (segundos)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    value={formData.antibanSettings.delayMax}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, delayMax: parseInt(e.target.value) }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho do Lote
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.antibanSettings.batchSize}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, batchSize: parseInt(e.target.value) }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pausa Entre Lotes (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.antibanSettings.pauseBetweenBatches}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      antibanSettings: { ...prev.antibanSettings, pauseBetweenBatches: parseInt(e.target.value) }
                    }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>
              </div>

              {errors.delays && (
                <p className="mt-1 text-sm text-error-600">{errors.delays}</p>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Configurações Recomendadas</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use delays de 30-120 segundos para simular comportamento humano</li>
                  <li>• Limite de 10-15 mensagens por hora para chips novos</li>
                  <li>• Processe em lotes pequenos (5-10) com pausas</li>
                  <li>• Respeite o período de aquecimento (24h-7dias)</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agendamento da Campanha</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="immediate"
                      checked={formData.scheduleType === 'immediate'}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value as any }))}
                      className="h-4 w-4 text-oracle-600 border-gray-300 focus:ring-oracle-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Iniciar Imediatamente</span>
                      <p className="text-xs text-gray-500">A campanha será criada e ficará pronta para ser iniciada manualmente</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="scheduled"
                      checked={formData.scheduleType === 'scheduled'}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value as any }))}
                      className="mt-1 h-4 w-4 text-oracle-600 border-gray-300 focus:ring-oracle-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Agendar para Data/Hora Específica</span>
                      <p className="text-xs text-gray-500 mb-3">A campanha será iniciada automaticamente no horário definido</p>
                      
                      {formData.scheduleType === 'scheduled' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                setFormData(prev => ({ ...prev, scheduledTime: date }));
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
                            <input
                              type="time"
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = formData.scheduledTime || new Date();
                                date.setHours(parseInt(hours), parseInt(minutes));
                                setFormData(prev => ({ ...prev, scheduledTime: date }));
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Campaign Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Resumo da Campanha</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{formData.name || 'Não definido'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">
                    {clients.find(c => c.id === formData.clientId)?.name || 'Não selecionado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Instâncias:</span>
                  <span className="font-medium">{formData.instanceIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contatos:</span>
                  <span className="font-medium">{formData.targetList.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium">
                    {templates.find(t => t.id === formData.templateId)?.name || 'Não selecionado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agendamento:</span>
                  <span className="font-medium">
                    {formData.scheduleType === 'immediate' ? 'Imediato' : 
                     formData.scheduledTime ? formData.scheduledTime.toLocaleDateString() : 'Agendado'}
                  </span>
                </div>
              </div>
            </div>
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
      title="Nova Campanha de Broadcast"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'bg-oracle-500 border-oracle-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-oracle-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Passo {currentStep}: {steps[currentStep - 1].title}
          </h3>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
              >
                Próximo
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Campanha'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateCampaignModal;