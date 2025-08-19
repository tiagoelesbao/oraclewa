'use client';

import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api';

interface InstanceSettingsModalProps {
  instance: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({
  instance,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateInstanceSettings, loading, refreshData } = useApp();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [settings, setSettings] = useState({
    // Basic Settings
    name: instance.name || instance.instanceName || '',
    functionType: instance.functionType || 'broadcast',
    
    // Anti-ban Settings
    strategy: instance.antibanSettings?.strategy || 'conti_chips',
    delayMin: (instance.antibanSettings?.delayMin || 30000) / 1000,
    delayMax: (instance.antibanSettings?.delayMax || 120000) / 1000,
    dailyLimit: instance.antibanSettings?.dailyLimit || instance.dailyLimit || 100,
    hourlyLimit: instance.antibanSettings?.hourlyLimit || 15,
    batchSize: instance.antibanSettings?.batchSize || 10,
    pauseBetweenBatches: instance.antibanSettings?.pauseBetweenBatches || 15,
    respectWarmupPeriod: instance.antibanSettings?.respectWarmupPeriod ?? true,
    
    // Webhook Settings (if applicable)
    webhookUrl: instance.webhookUrl || '',
    webhookTriggers: instance.webhookTriggers || [],
    
    // Advanced Settings
    typingSimulation: instance.typingSimulation ?? true,
    onlinePresence: instance.onlinePresence ?? true,
    autoReconnect: instance.autoReconnect ?? true,
    messageQueue: instance.messageQueue ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const strategyPresets = {
    conti_chips: {
      label: 'Conti Chips (Recomendado)',
      description: 'Estratégia profissional com aquecimento gradual',
      settings: {
        delayMin: 30,
        delayMax: 120,
        hourlyLimit: 15,
        batchSize: 10,
        pauseBetweenBatches: 15,
      }
    },
    conservative: {
      label: 'Conservador',
      description: 'Delays maiores e limites menores para máxima segurança',
      settings: {
        delayMin: 60,
        delayMax: 180,
        hourlyLimit: 10,
        batchSize: 5,
        pauseBetweenBatches: 30,
      }
    },
    aggressive: {
      label: 'Agressivo',
      description: 'Delays menores para campanhas urgentes (maior risco)',
      settings: {
        delayMin: 15,
        delayMax: 60,
        hourlyLimit: 30,
        batchSize: 20,
        pauseBetweenBatches: 5,
      }
    },
  };

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (settings.delayMin < 10 || settings.delayMin > 300) {
      newErrors.delayMin = 'Delay mínimo deve estar entre 10 e 300 segundos';
    }

    if (settings.delayMax < 30 || settings.delayMax > 600) {
      newErrors.delayMax = 'Delay máximo deve estar entre 30 e 600 segundos';
    }

    if (settings.delayMin >= settings.delayMax) {
      newErrors.delayMin = 'Delay mínimo deve ser menor que o máximo';
    }

    if (settings.dailyLimit < 1 || settings.dailyLimit > 2000) {
      newErrors.dailyLimit = 'Limite diário deve estar entre 1 e 2000';
    }

    if (settings.hourlyLimit < 1 || settings.hourlyLimit > 100) {
      newErrors.hourlyLimit = 'Limite por hora deve estar entre 1 e 100';
    }

    if (settings.batchSize < 1 || settings.batchSize > 50) {
      newErrors.batchSize = 'Tamanho do lote deve estar entre 1 e 50';
    }

    if (settings.pauseBetweenBatches < 1 || settings.pauseBetweenBatches > 120) {
      newErrors.pauseBetweenBatches = 'Pausa entre lotes deve estar entre 1 e 120 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    setSuccess(false);
    
    try {
      // Update instance settings via API
      const updateData = {
        name: settings.name,
        functionType: settings.functionType,
        antibanSettings: {
          strategy: settings.strategy,
          delayMin: settings.delayMin * 1000,
          delayMax: settings.delayMax * 1000,
          dailyLimit: settings.dailyLimit,
          hourlyLimit: settings.hourlyLimit,
          batchSize: settings.batchSize,
          pauseBetweenBatches: settings.pauseBetweenBatches,
          respectWarmupPeriod: settings.respectWarmupPeriod,
        },
        typingSimulation: settings.typingSimulation,
        onlinePresence: settings.onlinePresence,
        autoReconnect: settings.autoReconnect,
        messageQueue: settings.messageQueue,
      };

      // If webhook function, include webhook settings
      if (settings.functionType === 'webhook') {
        Object.assign(updateData, {
          webhookUrl: settings.webhookUrl,
          webhookTriggers: settings.webhookTriggers,
        });
      }
      
      // Call API to update instance
      await api.put(`/api/instances/${instance.id || instance.instanceName}/settings`, updateData);
      
      // Update local state
      await updateInstanceSettings(instance.id, updateData.antibanSettings);
      
      setSuccess(true);
      setTimeout(() => {
        refreshData();
        onSuccess?.();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating instance settings:', error);
      setErrors({ general: 'Erro ao salvar configurações. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({
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

  const applyStrategyPreset = (strategyKey: string) => {
    const preset = strategyPresets[strategyKey as keyof typeof strategyPresets];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        strategy: strategyKey,
        ...preset.settings,
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurações: ${instance.name || instance.instanceName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800">Configurações salvas com sucesso!</span>
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800">{errors.general}</span>
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Instância
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.name ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select
                value={settings.functionType}
                onChange={(e) => handleChange('functionType', e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                disabled={saving}
              >
                <option value="broadcast">📢 Broadcast - Disparos em massa</option>
                <option value="webhook">🔗 Webhook - Recuperação de vendas</option>
                <option value="support">💬 Suporte - Atendimento</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anti-ban Strategy */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Cog6ToothIcon className="w-5 h-5 inline mr-2" />
            Estratégia Anti-ban
          </h3>
          
          <div className="space-y-3 mb-4">
            {Object.entries(strategyPresets).map(([key, preset]) => (
              <label
                key={key}
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                  settings.strategy === key
                    ? 'border-oracle-500 bg-oracle-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={key}
                  checked={settings.strategy === key}
                  onChange={() => applyStrategyPreset(key)}
                  className="mt-1 text-oracle-600 focus:ring-oracle-500"
                  disabled={saving}
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{preset.label}</div>
                  <div className="text-sm text-gray-500">{preset.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Cog6ToothIcon className="w-5 h-5 inline mr-2" />
            Configurações Avançadas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Mínimo (segundos)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.delayMin}
                onChange={(e) => handleChange('delayMin', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.delayMin ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.delayMin && (
                <p className="mt-1 text-sm text-red-600">{errors.delayMin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Máximo (segundos)
              </label>
              <input
                type="number"
                min="30"
                max="600"
                value={settings.delayMax}
                onChange={(e) => handleChange('delayMax', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.delayMax ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.delayMax && (
                <p className="mt-1 text-sm text-red-600">{errors.delayMax}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite Diário
              </label>
              <input
                type="number"
                min="1"
                max="2000"
                value={settings.dailyLimit}
                onChange={(e) => handleChange('dailyLimit', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.dailyLimit ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.dailyLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.dailyLimit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite por Hora
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.hourlyLimit}
                onChange={(e) => handleChange('hourlyLimit', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.hourlyLimit ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.hourlyLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.hourlyLimit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho do Lote
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.batchSize}
                onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.batchSize ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.batchSize && (
                <p className="mt-1 text-sm text-red-600">{errors.batchSize}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pausa Entre Lotes (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={settings.pauseBetweenBatches}
                onChange={(e) => handleChange('pauseBetweenBatches', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.pauseBetweenBatches ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              {errors.pauseBetweenBatches && (
                <p className="mt-1 text-sm text-red-600">{errors.pauseBetweenBatches}</p>
              )}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="mt-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.respectWarmupPeriod}
                onChange={(e) => handleChange('respectWarmupPeriod', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">
                Respeitar período de aquecimento
                <span className="text-gray-500 ml-1">(limites reduzidos para chips novos)</span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.typingSimulation}
                onChange={(e) => handleChange('typingSimulation', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">
                Simular digitação
                <span className="text-gray-500 ml-1">(aparece "digitando..." antes de enviar)</span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.onlinePresence}
                onChange={(e) => handleChange('onlinePresence', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">
                Manter presença online
                <span className="text-gray-500 ml-1">(aparece "online" durante operações)</span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoReconnect}
                onChange={(e) => handleChange('autoReconnect', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">
                Reconexão automática
                <span className="text-gray-500 ml-1">(reconecta em caso de desconexão)</span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.messageQueue}
                onChange={(e) => handleChange('messageQueue', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">
                Fila de mensagens
                <span className="text-gray-500 ml-1">(processa mensagens em fila para evitar perdas)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstanceSettingsModal;