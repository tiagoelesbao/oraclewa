'use client';

import React, { useState } from 'react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';

interface InstanceSettingsModalProps {
  instance: any;
  isOpen: boolean;
  onClose: () => void;
}

const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({
  instance,
  isOpen,
  onClose,
}) => {
  const { updateInstanceSettings, loading } = useApp();
  
  const [settings, setSettings] = useState({
    strategy: instance.antibanSettings?.strategy || 'conti_chips',
    delayMin: (instance.antibanSettings?.delayMin || 30000) / 1000,
    delayMax: (instance.antibanSettings?.delayMax || 120000) / 1000,
    dailyLimit: instance.antibanSettings?.dailyLimit || instance.dailyLimit || 100,
    hourlyLimit: instance.antibanSettings?.hourlyLimit || 15,
    batchSize: instance.antibanSettings?.batchSize || 10,
    pauseBetweenBatches: instance.antibanSettings?.pauseBetweenBatches || 15,
    respectWarmupPeriod: instance.antibanSettings?.respectWarmupPeriod ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};

    if (settings.delayMin < 10 || settings.delayMin > 300) {
      newErrors.delayMin = 'Delay mínimo deve estar entre 10 e 300 segundos';
    }

    if (settings.delayMax < 30 || settings.delayMax > 600) {
      newErrors.delayMax = 'Delay máximo deve estar entre 30 e 600 segundos';
    }

    if (settings.delayMin >= settings.delayMax) {
      newErrors.delayMin = 'Delay mínimo deve ser menor que o máximo';
    }

    if (settings.dailyLimit < 1 || settings.dailyLimit > 1000) {
      newErrors.dailyLimit = 'Limite diário deve estar entre 1 e 1000';
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

    try {
      await updateInstanceSettings(instance.id, {
        strategy: settings.strategy,
        delayMin: settings.delayMin * 1000,
        delayMax: settings.delayMax * 1000,
        dailyLimit: settings.dailyLimit,
        hourlyLimit: settings.hourlyLimit,
        batchSize: settings.batchSize,
        pauseBetweenBatches: settings.pauseBetweenBatches,
        respectWarmupPeriod: settings.respectWarmupPeriod,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating instance settings:', error);
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

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'conti_chips':
        return 'Estratégia profissional com aquecimento gradual (recomendado)';
      case 'conservative':
        return 'Delays maiores e limites menores para máxima segurança';
      case 'aggressive':
        return 'Limites maiores - use apenas com chips maduros';
      default:
        return '';
    }
  };

  const getPresetValues = (strategy: string) => {
    switch (strategy) {
      case 'conti_chips':
        return {
          delayMin: 30,
          delayMax: 120,
          hourlyLimit: 15,
          batchSize: 10,
          pauseBetweenBatches: 15,
        };
      case 'conservative':
        return {
          delayMin: 60,
          delayMax: 300,
          hourlyLimit: 8,
          batchSize: 5,
          pauseBetweenBatches: 30,
        };
      case 'aggressive':
        return {
          delayMin: 15,
          delayMax: 60,
          hourlyLimit: 25,
          batchSize: 20,
          pauseBetweenBatches: 10,
        };
      default:
        return {};
    }
  };

  const applyPreset = (strategy: string) => {
    const preset = getPresetValues(strategy);
    setSettings(prev => ({
      ...prev,
      strategy,
      ...preset,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurações: ${instance.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estratégia Anti-ban
          </label>
          <div className="space-y-3">
            {[
              { value: 'conti_chips', label: 'Conti Chips', recommended: true },
              { value: 'conservative', label: 'Conservador' },
              { value: 'aggressive', label: 'Agressivo', warning: true },
            ].map(strategy => (
              <label key={strategy.value} className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="strategy"
                  value={strategy.value}
                  checked={settings.strategy === strategy.value}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="mt-1 h-4 w-4 text-oracle-600 border-gray-300 focus:ring-oracle-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{strategy.label}</span>
                    {strategy.recommended && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Recomendado
                      </span>
                    )}
                    {strategy.warning && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        Cuidado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getStrategyDescription(strategy.value)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Cog6ToothIcon className="w-5 h-5 text-gray-500 mr-2" />
            Configurações Avançadas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  errors.delayMin ? 'border-error-500' : ''
                }`}
              />
              {errors.delayMin && (
                <p className="mt-1 text-sm text-error-600">{errors.delayMin}</p>
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
                  errors.delayMax ? 'border-error-500' : ''
                }`}
              />
              {errors.delayMax && (
                <p className="mt-1 text-sm text-error-600">{errors.delayMax}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite Diário
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.dailyLimit}
                onChange={(e) => handleChange('dailyLimit', parseInt(e.target.value))}
                className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                  errors.dailyLimit ? 'border-error-500' : ''
                }`}
              />
              {errors.dailyLimit && (
                <p className="mt-1 text-sm text-error-600">{errors.dailyLimit}</p>
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
                  errors.hourlyLimit ? 'border-error-500' : ''
                }`}
              />
              {errors.hourlyLimit && (
                <p className="mt-1 text-sm text-error-600">{errors.hourlyLimit}</p>
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
                  errors.batchSize ? 'border-error-500' : ''
                }`}
              />
              {errors.batchSize && (
                <p className="mt-1 text-sm text-error-600">{errors.batchSize}</p>
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
                  errors.pauseBetweenBatches ? 'border-error-500' : ''
                }`}
              />
              {errors.pauseBetweenBatches && (
                <p className="mt-1 text-sm text-error-600">{errors.pauseBetweenBatches}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={settings.respectWarmupPeriod}
                onChange={(e) => handleChange('respectWarmupPeriod', e.target.checked)}
                className="mt-1 h-4 w-4 text-oracle-600 border-gray-300 rounded focus:ring-oracle-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  Respeitar período de aquecimento
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Quando ativado, aplica limites reduzidos automaticamente para chips novos ou em aquecimento
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Warning for aggressive strategy */}
        {settings.strategy === 'aggressive' && (
          <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Atenção: Estratégia Agressiva</h4>
                <p className="text-sm text-red-700 mt-1">
                  Esta estratégia deve ser usada apenas com chips completamente maduros. 
                  Há maior risco de banimento se usada incorretamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstanceSettingsModal;