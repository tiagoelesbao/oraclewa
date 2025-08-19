'use client';

import React from 'react';
import {
  DevicePhoneMobileIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  WifiIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface InstanceDetailsModalProps {
  instance: any;
  isOpen: boolean;
  onClose: () => void;
}

const InstanceDetailsModal: React.FC<InstanceDetailsModalProps> = ({
  instance,
  isOpen,
  onClose,
}) => {
  const { clients } = useApp();
  const client = clients.find(c => c.id === instance.clientId);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    switch (status) {
      case 'connected': return 'success';
      case 'warming': return 'warning';
      case 'connecting': return 'info';
      case 'disconnected':
      case 'error': return 'error';
      default: return 'secondary';
    }
  };

  const getMaturationColor = (level: string) => {
    switch (level) {
      case 'mature': return 'success';
      case 'warming': return 'warning';
      case 'new': return 'error';
      default: return 'secondary';
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'evolution':
        return { name: 'Evolution API', description: 'Servidor Evolution API oficial' };
      case 'baileys':
        return { name: 'Baileys', description: 'Protocolo Baileys local' };
      case 'zapi':
        return { name: 'Z-API', description: 'Provedor Z-API' };
      default:
        return { name: provider, description: 'Provedor personalizado' };
    }
  };

  const providerInfo = getProviderInfo(instance.provider);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes: ${instance.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nome da Instância
              </label>
              <div className="flex items-center space-x-2">
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">{instance.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Cliente
              </label>
              <span className="text-gray-900">{client?.name || 'N/A'}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(instance.status || instance.connectionState)}>
                  {instance.status === 'connected' || instance.connectionState === 'open' ? 'Conectada' :
                   instance.status === 'connecting' || instance.connectionState === 'connecting' ? 'Conectando' :
                   instance.status === 'warming' ? 'Aquecendo' :
                   'Desconectada'}
                </Badge>
                {instance.functionType && (
                  <Badge variant={instance.functionType === 'webhook' ? 'info' : 'warning'} size="sm">
                    {instance.functionType === 'webhook' ? '🔗 Webhook' :
                     instance.functionType === 'broadcast' ? '📢 Broadcast' : 
                     '💬 Suporte'}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nível de Maturação
              </label>
              <Badge variant={getMaturationColor(instance.maturationLevel)}>
                {instance.maturationLevel === 'mature' ? 'Maduro' :
                 instance.maturationLevel === 'warming' ? 'Aquecendo' : 'Novo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Número WhatsApp
              </label>
              <span className="text-gray-900 font-mono">
                {instance.phone || instance.instanceName || 'Não conectado'}
              </span>
            </div>

            {instance.profileName && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nome do Perfil
                </label>
                <span className="text-gray-900">{instance.profileName}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Provedor
              </label>
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-gray-900 font-medium">{providerInfo.name}</div>
                  <div className="text-sm text-gray-500">{providerInfo.description}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Mensagens Enviadas
              </label>
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-semibold">{instance.messagesCount.toLocaleString()}</span>
              </div>
            </div>

            {instance.lastActivity && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Última Atividade
                </label>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{formatDistanceToNowPtBR(instance.lastActivity)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Anti-ban Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
            Configurações Anti-ban
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Estratégia</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {instance.antibanSettings?.strategy || 'N/A'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Limite Diário</div>
              <div className="text-lg font-semibold text-gray-900">
                {instance.dailyLimit} mensagens
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Limite por Hora</div>
              <div className="text-lg font-semibold text-gray-900">
                {instance.antibanSettings?.hourlyLimit || 'N/A'} mensagens
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Delay Mínimo</div>
              <div className="text-lg font-semibold text-gray-900">
                {instance.antibanSettings?.delayMin ? 
                  `${instance.antibanSettings.delayMin / 1000}s` : 'N/A'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Delay Máximo</div>
              <div className="text-lg font-semibold text-gray-900">
                {instance.antibanSettings?.delayMax ? 
                  `${instance.antibanSettings.delayMax / 1000}s` : 'N/A'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Tamanho do Lote</div>
              <div className="text-lg font-semibold text-gray-900">
                {instance.antibanSettings?.batchSize || 'N/A'} mensagens
              </div>
            </div>
          </div>

          {instance.antibanSettings?.respectWarmupPeriod && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Período de aquecimento ativo - limites reduzidos para proteção
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Connection Info */}
        {instance.status === 'connected' && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <WifiIcon className="w-5 h-5 text-green-500 mr-2" />
              Informações de Conexão
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600">Status da Conexão</div>
                <div className="text-lg font-semibold text-green-900">Conectado</div>
                <div className="text-sm text-green-700">WhatsApp ativo e funcional</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-600">Servidor</div>
                <div className="text-lg font-semibold text-blue-900">{providerInfo.name}</div>
                <div className="text-sm text-blue-700">Conexão estável</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-oracle-500 focus:border-oracle-500"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InstanceDetailsModal;