'use client';

import React, { useState } from 'react';
import {
  SpeakerWaveIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import CreateCampaignModal from '@/components/broadcast/CreateCampaignModal';
import CampaignDetailsModal from '@/components/broadcast/CampaignDetailsModal';

export default function BroadcastPage() {
  const {
    campaigns,
    clients,
    selectedClient,
    selectClient,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    loading,
    refreshData,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Filter campaigns based on selected client and status filter
  const filteredCampaigns = campaigns.filter(campaign => {
    const clientMatch = !selectedClient || campaign.clientId === selectedClient.id;
    const statusMatch = filter === 'all' || campaign.status === filter;
    return clientMatch && statusMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'running':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'paused':
        return <PauseIcon className="w-5 h-5 text-warning-500" />;
      case 'cancelled':
        return <StopIcon className="w-5 h-5 text-error-500" />;
      case 'scheduled':
        return <ClockIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <DocumentDuplicateIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'info';
      case 'paused': return 'warning';
      case 'cancelled':
      case 'error': return 'error';
      case 'scheduled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Rascunho',
      scheduled: 'Agendada',
      running: 'Executando',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleStartCampaign = async (campaign: any) => {
    try {
      await startCampaign(campaign.id);
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaign: any) => {
    try {
      await pauseCampaign(campaign.id);
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleCancelCampaign = async (campaign: any) => {
    try {
      await cancelCampaign(campaign.id);
    } catch (error) {
      console.error('Error cancelling campaign:', error);
    }
  };

  const handleViewDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
  };

  const getProgressPercentage = (progress: any) => {
    if (!progress || progress.total === 0) return 0;
    return Math.round(((progress.sent + progress.failed) / progress.total) * 100);
  };

  const statusCounts = {
    all: filteredCampaigns.length,
    running: filteredCampaigns.filter(c => c.status === 'running').length,
    scheduled: filteredCampaigns.filter(c => c.status === 'scheduled').length,
    completed: filteredCampaigns.filter(c => c.status === 'completed').length,
    paused: filteredCampaigns.filter(c => c.status === 'paused').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas de Broadcast</h1>
          <p className="text-gray-600">Gerencie e monitore suas campanhas de mensagens em massa</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshData()}
            disabled={loading}
          >
            <SpeakerWaveIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Campanha
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
          { key: 'running', label: 'Executando', count: statusCounts.running },
          { key: 'scheduled', label: 'Agendadas', count: statusCounts.scheduled },
          { key: 'completed', label: 'Concluídas', count: statusCounts.completed },
          { key: 'paused', label: 'Pausadas', count: statusCounts.paused },
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

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <Card variant="border">
          <Card.Content>
            <div className="text-center py-12">
              <SpeakerWaveIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedClient ? `Nenhuma campanha encontrada para ${selectedClient.name}` : 'Nenhuma campanha encontrada'}
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira campanha de broadcast para começar a enviar mensagens em massa.
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map(campaign => {
            const client = clients.find(c => c.id === campaign.clientId);
            const progressPercentage = getProgressPercentage(campaign.progress);
            
            return (
              <Card key={campaign.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                <Card.Content>
                  <div className="space-y-4">
                    {/* Campaign Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(campaign.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{client?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(campaign.status)} size="sm">
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Campaign Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Contatos</div>
                          <div className="font-medium">{campaign.progress?.total || 0}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-success-500" />
                        <div>
                          <div className="text-sm text-gray-500">Enviadas</div>
                          <div className="font-medium text-success-600">
                            {campaign.progress?.sent || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-error-500" />
                        <div>
                          <div className="text-sm text-gray-500">Falharam</div>
                          <div className="font-medium text-error-600">
                            {campaign.progress?.failed || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Criada</div>
                          <div className="font-medium">
                            {formatDistanceToNowPtBR(campaign.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {campaign.status === 'running' && (
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progresso</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-oracle-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(campaign)}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                        
                        {campaign.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Duplicate campaign */}}
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                            Duplicar
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {campaign.status === 'running' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePauseCampaign(campaign)}
                            disabled={loading}
                          >
                            <PauseIcon className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        
                        {campaign.status === 'paused' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartCampaign(campaign)}
                            disabled={loading}
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Continuar
                          </Button>
                        )}
                        
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartCampaign(campaign)}
                            disabled={loading}
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        
                        {['running', 'paused', 'scheduled'].includes(campaign.status) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelCampaign(campaign)}
                            disabled={loading}
                          >
                            <StopIcon className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
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
        <CreateCampaignModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showDetailsModal && selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}