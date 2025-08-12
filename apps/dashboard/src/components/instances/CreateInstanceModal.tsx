'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { clients, createInstance, loading } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    provider: 'evolution',
    dailyLimit: 100,
    maturationLevel: 'new',
    antibanSettings: {
      strategy: 'conti_chips',
      delayMin: 30000,
      delayMax: 120000,
      dailyLimit: 100,
      hourlyLimit: 15,
      batchSize: 10,
      pauseBetweenBatches: 15,
      respectWarmupPeriod: true,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (formData.dailyLimit < 1 || formData.dailyLimit > 1000) {
      newErrors.dailyLimit = 'Limite diário deve estar entre 1 e 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createInstance({
        ...formData,
        status: 'disconnected',
      });
      
      // Reset form
      setFormData({
        name: '',
        clientId: '',
        provider: 'evolution',
        dailyLimit: 100,
        maturationLevel: 'new',
        antibanSettings: {
          strategy: 'conti_chips',
          delayMin: 30000,
          delayMax: 120000,
          dailyLimit: 100,
          hourlyLimit: 15,
          batchSize: 10,
          pauseBetweenBatches: 15,
          respectWarmupPeriod: true,
        },
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating instance:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
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

  const handleAntibanChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      antibanSettings: {
        ...prev.antibanSettings,
        [field]: value,
      },
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Instância WhatsApp"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Instância *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="ex: imperio-broadcast-1"
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                errors.name ? 'border-error-500' : ''
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provedor
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
            >
              <option value="evolution">Evolution API</option>
              <option value="baileys">Baileys (Local)</option>
              <option value="zapi">Z-API</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite Diário
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.dailyLimit}
              onChange={(e) => handleChange('dailyLimit', parseInt(e.target.value))}
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                errors.dailyLimit ? 'border-error-500' : ''
              }`}
            />
            {errors.dailyLimit && (
              <p className="mt-1 text-sm text-error-600">{errors.dailyLimit}</p>
            )}
          </div>
        </div>

        {/* Anti-ban Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Anti-ban</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estratégia
              </label>
              <select
                value={formData.antibanSettings.strategy}
                onChange={(e) => handleAntibanChange('strategy', e.target.value)}
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
                onChange={(e) => handleAntibanChange('hourlyLimit', parseInt(e.target.value))}
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
                value={formData.antibanSettings.delayMin / 1000}
                onChange={(e) => handleAntibanChange('delayMin', parseInt(e.target.value) * 1000)}
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
                value={formData.antibanSettings.delayMax / 1000}
                onChange={(e) => handleAntibanChange('delayMax', parseInt(e.target.value) * 1000)}
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
                onChange={(e) => handleAntibanChange('batchSize', parseInt(e.target.value))}
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
                onChange={(e) => handleAntibanChange('pauseBetweenBatches', parseInt(e.target.value))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.antibanSettings.respectWarmupPeriod}
                onChange={(e) => handleAntibanChange('respectWarmupPeriod', e.target.checked)}
                className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Respeitar período de aquecimento (recomendado para novos chips)
              </span>
            </label>
          </div>
        </div>

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
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Instância'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInstanceModal;