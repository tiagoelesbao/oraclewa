'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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
  TrashIcon,
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

interface WebhookPool {
  clientId: string;
  strategy: string;
  totalInstances: number;
  instances: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    state: string;
    lastCheck: string;
    score: number;
  }>;
  healthyCount: number;
  messageQueue: number;
}

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
  const [activeTab, setActiveTab] = useState<'instances' | 'webhook-pool'>('webhook-pool');
  const [webhookPools, setWebhookPools] = useState<Record<string, WebhookPool>>({});
  const [isPoolUpdating, setIsPoolUpdating] = useState(false);

  // Buscar webhook pools ao inicializar e atualizar periodicamente
  useEffect(() => {
    if (activeTab === 'webhook-pool') {
      // Buscar imediatamente
      fetchWebhookPools();
      
      // Configurar intervalo de atualização a cada 5 segundos
      const interval = setInterval(() => {
        fetchWebhookPools();
      }, 5000);
      
      // Limpar intervalo ao desmontar ou trocar de aba
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedClient]);

  const fetchWebhookPools = async () => {
    try {
      setIsPoolUpdating(true);
      // Buscar dados reais das instâncias do pool
      const instancesRes = await api.getInstances();
      
      // Filtrar apenas as instâncias do webhook pool
      const webhookInstances = instancesRes.filter(instance => 
        instance.instanceName?.includes('webhook')
      );
      
      // Mapear para o formato esperado pelo componente
      const poolInstances = webhookInstances.map(instance => ({
        name: instance.instanceName,
        status: instance.isConnected ? 'healthy' : 
                instance.connectionStatus === 'connecting' ? 'unknown' : 'unhealthy',
        state: instance.isConnected ? 'Conectada' : 
               instance.connectionStatus === 'connecting' ? 'Conectando' : 'Aguardando conexão',
        lastCheck: new Date(instance.lastConnection || instance.updatedAt || Date.now()).toLocaleString(),
        score: instance.isConnected ? 100 : 0,
        isConnected: instance.isConnected,
        connectionStatus: instance.connectionStatus,
        ownerJid: instance.ownerJid,
        profileName: instance.profileName,
        messageCount: instance.messageCount
      }));
      
      const healthyCount = poolInstances.filter(i => i.status === 'healthy').length;
      
      const pools = {
        imperio: {
          clientId: 'imperio',
          strategy: 'round-robin',
          totalInstances: poolInstances.length,
          instances: poolInstances,
          healthyCount,
          healthStatus: {
            total: poolInstances.length,
            healthy: healthyCount,
            unhealthy: poolInstances.length - healthyCount
          },
          messageQueue: poolInstances.reduce((total, instance) => total + (instance.messageCount || 0), 0),
          status: healthyCount > 0 ? 'active' : 'inactive'
        }
      };
      
      setWebhookPools(pools);
    } catch (error) {
      console.error('Error fetching webhook pools:', error);
    } finally {
      setIsPoolUpdating(false);
    }
  };

  const connectWebhookInstance = async (instanceName: string) => {
    try {
      // Criar objeto instance mock para o webhook pool
      const webhookInstance = {
        id: instanceName,
        name: instanceName,
        instanceName: instanceName,
        connectionStatus: 'open',
        provider: 'evolution-baileys'
      };
      
      // Usar o modal existente
      setSelectedInstance(webhookInstance);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error connecting webhook instance:', error);
      alert('Erro ao conectar instância. Tente novamente.');
    }
  };

  const resetMessageCount = async () => {
    try {
      const confirmReset = window.confirm(
        'Tem certeza que deseja resetar a contagem de mensagens?\n\n' +
        'Isso irá zerar o contador e começar a contar apenas mensagens novas a partir de agora.'
      );
      
      if (!confirmReset) return;
      
      const response = await fetch('http://localhost:3333/api/instances/reset-messages/imperio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao resetar contagem');
      }
      
      const result = await response.json();
      
      // Atualizar dados após reset
      await fetchWebhookPools();
      
      alert(`✅ Contagem resetada com sucesso!\n\n${result.data.instancesReset} instâncias foram resetadas.`);
    } catch (error) {
      console.error('Error resetting message count:', error);
      alert('Erro ao resetar contagem de mensagens. Tente novamente.');
    }
  };

  const clearMessageQueue = async () => {
    try {
      const confirmClear = window.confirm(
        'Tem certeza que deseja limpar a fila de mensagens pendentes?\n\n' +
        'Isso irá cancelar todas as mensagens que estão aguardando para serem enviadas.\n\n' +
        'Use isto quando quiser garantir que não há mensagens antigas na fila.'
      );
      
      if (!confirmClear) return;
      
      const response = await fetch('http://localhost:3333/api/queue/clear/imperio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao limpar fila');
      }
      
      const result = await response.json();
      
      alert(`✅ Fila de mensagens limpa com sucesso!\n\nTodas as mensagens pendentes foram removidas.`);
    } catch (error) {
      console.error('Error clearing message queue:', error);
      alert('Erro ao limpar fila de mensagens. Tente novamente.');
    }
  };

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
      // Para Evolution API, mostrar QR Code diretamente
      setSelectedInstance(instance);
      setShowQRModal(true);
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

  const handleDelete = async (instance: any) => {
    // Confirmação antes de deletar
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a instância "${instance.instanceName || instance.name}"?\n\nEsta ação não pode ser desfeita!`
    );
    
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`http://localhost:3333/instance/delete/${instance.instanceName || instance.name}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete instance');
      }
      
      // Recarregar a lista de instâncias
      await refreshData();
      
      // Mostrar mensagem de sucesso (opcional)
      alert(`Instância "${instance.instanceName || instance.name}" excluída com sucesso!`);
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      alert(`Erro ao excluir instância: ${errorMessage}\n\nTente novamente.`);
    }
  };

  const handleShowQRCode = (instance: any) => {
    setSelectedInstance(instance);
    setShowQRModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'webhook-pool' ? 'Pool de Webhooks' : 'Instâncias WhatsApp'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'webhook-pool' 
              ? 'Pool de 4 instâncias com failover automático para webhooks'
              : 'Gerencie suas conexões WhatsApp e configurações'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Tab Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('webhook-pool')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'webhook-pool' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Webhook Pool
            </button>
            <button
              onClick={() => setActiveTab('instances')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'instances' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Instâncias
            </button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={activeTab === 'webhook-pool' ? fetchWebhookPools : () => refreshData()}
            disabled={loading}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {activeTab === 'instances' && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          )}
        </div>
      </div>

      {/* Webhook Pool Section */}
      {activeTab === 'webhook-pool' && (
        <Card variant="elevated">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Pool Império - Webhooks</h2>
                {isPoolUpdating && (
                  <ArrowPathIcon className="w-4 h-4 text-gray-500 animate-spin" />
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="info" size="sm">4 Instâncias</Badge>
                <div className="text-xs text-gray-500">
                  Atualização automática a cada 5s
                </div>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {/* Pool Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(webhookPools['imperio']?.instances || []).map((poolInstance, index) => {
                  const isConnected = poolInstance?.status === 'healthy';
                  
                  return (
                    <div
                      key={poolInstance.name}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="space-y-3">
                        {/* Instance Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isConnected ? (
                              <CheckCircleIcon className="w-5 h-5 text-success-500" />
                            ) : (
                              <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />
                            )}
                            <span className="font-medium text-gray-900">{poolInstance.name}</span>
                          </div>
                          <Badge 
                            variant={isConnected ? 'success' : 'warning'} 
                            size="sm"
                          >
                            {isConnected ? 'Conectado' : 'Aguardando'}
                          </Badge>
                        </div>

                        {/* Instance Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <DevicePhoneMobileIcon className="w-4 h-4" />
                            <span>{poolInstance?.state || 'Aguardando conexão'}</span>
                          </div>
                          {poolInstance?.score !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 flex items-center">
                                <div className={`w-2 h-2 rounded-full ${
                                  poolInstance.score >= 75 ? 'bg-success-500' :
                                  poolInstance.score >= 50 ? 'bg-warning-500' : 'bg-error-500'
                                }`}></div>
                              </div>
                              <span>Score: {poolInstance.score}/100</span>
                            </div>
                          )}
                        </div>

                        {/* Instance Actions */}
                        <div className="flex gap-2">
                          {!isConnected && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => connectWebhookInstance(poolInstance.name)}
                              className="flex-1 flex items-center gap-1"
                            >
                              <QrCodeIcon className="w-3 h-3" />
                              Conectar
                            </Button>
                          )}
                          {isConnected && (
                            <div className="flex-1 text-center py-1 text-xs text-success-600 font-medium">
                              ✅ Ativo no pool
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pool Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Como configurar o Pool de Webhooks</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Clique em "Conectar" em cada instância que ainda não está conectada</li>
                        <li>Escaneie o QR Code que aparece com um número WhatsApp diferente</li>
                        <li>Aguarde a conexão (status mudará para "Conectado" 🟢)</li>
                        <li>O sistema distribuirá webhooks automaticamente entre as 4 instâncias</li>
                      </ol>
                      <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                        💡 <strong>Dica:</strong> Use 4 números WhatsApp diferentes para máxima redundância e performance.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pool Stats */}
              {webhookPools['imperio'] && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {webhookPools['imperio'].healthyCount}/{webhookPools['imperio'].totalInstances}
                    </div>
                    <div className="text-sm text-gray-600">Instâncias Conectadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {webhookPools['imperio'].strategy}
                    </div>
                    <div className="text-sm text-gray-600">Estratégia</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {webhookPools['imperio'].messageQueue || 0}
                    </div>
                    <div className="text-sm text-gray-600">Fila de Mensagens</div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={resetMessageCount}
                        title="Resetar contagem de mensagens"
                        className="flex-1"
                      >
                        <ArrowPathIcon className="w-3 h-3 mr-1" />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={clearMessageQueue}
                        title="Limpar fila de mensagens pendentes"
                        className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        🗑️ Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Client Selector - Only show in instances tab */}
      {activeTab === 'instances' && (
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
      )}

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
                      {instance.functionType && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Função:</span>
                          <Badge 
                            variant={
                              instance.functionType === 'webhook' ? 'info' :
                              instance.functionType === 'broadcast' ? 'warning' : 'secondary'
                            } 
                            size="sm"
                          >
                            {instance.functionType === 'webhook' ? 'Webhook' :
                             instance.functionType === 'broadcast' ? 'Broadcast' :
                             instance.functionType === 'support' ? 'Suporte' : 
                             instance.functionType}
                          </Badge>
                        </div>
                      )}
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
                        {(instance.status === 'disconnected' || instance.status === 'connecting') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowQRCode(instance)}
                            title="Ver QR Code"
                          >
                            <QrCodeIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(instance)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          title="Excluir instância"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
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
          onConnectionSuccess={() => {
            // Atualizar dados quando conectar com sucesso
            refreshData();
            setTimeout(() => {
              setShowQRModal(false);
              setSelectedInstance(null);
            }, 2000);
          }}
        />
      )}
    </div>
  );
}