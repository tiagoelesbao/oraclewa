'use client';

import React, { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import CreateInstanceModal from '@/components/instances/CreateInstanceModal';
import InstanceDetailsModal from '@/components/instances/InstanceDetailsModal';
import InstanceSettingsModal from '@/components/instances/InstanceSettingsModal';
import QRCodeModal from '@/components/instances/QRCodeModal';

export default function InstancesPage() {
  const {
    instances,
    clients,
    selectedClient,
    selectClient,
    connectInstance,
    disconnectInstance,
    loading,
    refreshData,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Filter instances based on selected client and status filter
  const filteredInstances = instances.filter(instance => {
    const clientMatch = !selectedClient || instance.clientId === selectedClient.id;
    const statusMatch = filter === 'all' || instance.status === filter;
    return clientMatch && statusMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'warming':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />;
      case 'connecting':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-error-500" />;
      default:
        return <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'primary' | 'secondary' => {
    switch (status) {
      case 'connected': return 'success';
      case 'warming': return 'warning';
      case 'connecting': return 'primary';
      case 'disconnected':
      case 'error': return 'error';
      default: return 'secondary';
    }
  };

  const getMaturationBadge = (level: string) => {
    const colors = {
      new: 'error',
      warming: 'warning',
      mature: 'success',
    } as const;
    
    const labels = {
      new: 'Novo',
      warming: 'Aquecendo',
      mature: 'Maduro',
    };

    return (
      <Badge variant={colors[level as keyof typeof colors]} size="sm">
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  const handleConnect = async (instance: any) => {
    try {
      await connectInstance(instance.id);
      if (instance.provider === 'evolution') {
        setSelectedInstance(instance);
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('Error connecting instance:', error);
    }
  };

  const handleDisconnect = async (instance: any) => {
    try {
      await disconnectInstance(instance.id);
    } catch (error) {
      console.error('Error disconnecting instance:', error);
    }
  };

  const handleViewDetails = (instance: any) => {
    setSelectedInstance(instance);
    setShowDetailsModal(true);
  };

  const handleSettings = (instance: any) => {
    setSelectedInstance(instance);
    setShowSettingsModal(true);
  };

  const statusCounts = {
    all: filteredInstances.length,
    connected: filteredInstances.filter(i => i.status === 'connected').length,
    warming: filteredInstances.filter(i => i.status === 'warming').length,
    disconnected: filteredInstances.filter(i => i.status === 'disconnected').length,
    error: filteredInstances.filter(i => i.status === 'error').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instâncias WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp e configurações</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshData()}
            disabled={loading}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Client Selector */}
      <Card variant="border">
        <Card.Content>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Cliente:</label>
            <select
              value={selectedClient?.id || 'all'}
              onChange={(e) => {
                const clientId = e.target.value;
                if (clientId === 'all') {
                  selectClient(null);
                } else {
                  const client = clients.find(c => c.id === clientId);
                  selectClient(client || null);
                }
              }}
              className="block rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </Card.Content>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: 'Todas', count: statusCounts.all },
          { key: 'connected', label: 'Conectadas', count: statusCounts.connected },
          { key: 'warming', label: 'Aquecendo', count: statusCounts.warming },
          { key: 'disconnected', label: 'Desconectadas', count: statusCounts.disconnected },
          { key: 'error', label: 'Com Erro', count: statusCounts.error },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white text-oracle-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Instances Grid */}
      {filteredInstances.length === 0 ? (
        <Card variant="border">
          <Card.Content>
            <div className="text-center py-12">
              <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedClient ? `Nenhuma instância encontrada para ${selectedClient.name}` : 'Nenhuma instância encontrada'}
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira instância WhatsApp para começar a enviar mensagens.
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Primeira Instância
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInstances.map(instance => {
            const client = clients.find(c => c.id === instance.clientId);
            return (
              <Card key={instance.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                <Card.Content>
                  <div className="space-y-4">
                    {/* Instance Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(instance.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                          <p className="text-sm text-gray-600">{client?.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={getStatusColor(instance.status)} size="sm">
                          {instance.status === 'connected' ? 'Conectada' :
                           instance.status === 'connecting' ? 'Conectando' :
                           instance.status === 'warming' ? 'Aquecendo' :
                           instance.status === 'disconnected' ? 'Desconectada' : 'Erro'}
                        </Badge>
                        {getMaturationBadge(instance.maturationLevel)}
                      </div>
                    </div>

                    {/* Instance Info */}
                    <div className="space-y-2">
                      {instance.phone && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Telefone:</span>
                          <span className="font-medium">{instance.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Provedor:</span>
                        <span className="font-medium capitalize">{instance.provider}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Mensagens:</span>
                        <span className="font-medium">{instance.messagesCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Limite Diário:</span>
                        <span className="font-medium">{instance.dailyLimit}</span>
                      </div>
                      {instance.lastActivity && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Última Atividade:</span>
                          <span className="font-medium">{formatDistanceToNowPtBR(instance.lastActivity)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(instance)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettings(instance)}
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                        </Button>
                        {instance.status === 'connecting' && instance.qrCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInstance(instance);
                              setShowQRModal(true);
                            }}
                          >
                            <QrCodeIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {instance.status === 'connected' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDisconnect(instance)}
                          disabled={loading}
                        >
                          <StopIcon className="w-4 h-4 mr-1" />
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConnect(instance)}
                          disabled={loading || instance.status === 'connecting'}
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          {instance.status === 'connecting' ? 'Conectando...' : 'Conectar'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateInstanceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showDetailsModal && selectedInstance && (
        <InstanceDetailsModal
          instance={selectedInstance}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInstance(null);
          }}
        />
      )}

      {showSettingsModal && selectedInstance && (
        <InstanceSettingsModal
          instance={selectedInstance}
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedInstance(null);
          }}
        />
      )}

      {showQRModal && selectedInstance && (
        <QRCodeModal
          instance={selectedInstance}
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedInstance(null);
          }}
        />
      )}
    </div>
  );
}