'use client';

import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';

interface CampaignDetailsModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
}) => {
  const { clients, instances, templates, getCampaignLogs, startCampaign, pauseCampaign, cancelCampaign, loading } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const client = clients.find(c => c.id === campaign.clientId);
  const template = templates.find(t => t.id === campaign.templateId);
  const campaignInstances = instances.filter(i => campaign.instanceIds.includes(i.id));

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const campaignLogs = await getCampaignLogs(campaign.id, true);
      setLogs(campaignLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
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

  const getProgressPercentage = () => {
    if (!campaign.progress || campaign.progress.total === 0) return 0;
    return Math.round(((campaign.progress.sent + campaign.progress.failed) / campaign.progress.total) * 100);
  };

  const getSuccessRate = () => {
    if (!campaign.progress || campaign.progress.sent === 0) return 0;
    return Math.round((campaign.progress.delivered / campaign.progress.sent) * 100);
  };

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'start':
          await startCampaign(campaign.id);
          break;
        case 'pause':
          await pauseCampaign(campaign.id);
          break;
        case 'cancel':
          await cancelCampaign(campaign.id);
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
            <span className="text-gray-900">{client?.name}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <Badge variant={getStatusColor(campaign.status)}>
              {getStatusLabel(campaign.status)}
            </Badge>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Template</label>
            <span className="text-gray-900">{template?.name || 'N/A'}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Instâncias</label>
            <div className="space-y-1">
              {campaignInstances.map(instance => (
                <div key={instance.id} className="text-sm text-gray-600">
                  {instance.name} ({instance.phone})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Criada</label>
            <span className="text-gray-900">{formatDistanceToNowPtBR(campaign.createdAt)}</span>
          </div>
          
          {campaign.startedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Iniciada</label>
              <span className="text-gray-900">{formatDistanceToNowPtBR(campaign.startedAt)}</span>
            </div>
          )}
          
          {campaign.completedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Concluída</label>
              <span className="text-gray-900">{formatDistanceToNowPtBR(campaign.completedAt)}</span>
            </div>
          )}
          
          {campaign.scheduledAt && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Agendada para</label>
              <span className="text-gray-900">{new Date(campaign.scheduledAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {campaign.progress && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progresso da Campanha</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <UserGroupIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{campaign.progress.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <PlayIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{campaign.progress.sent}</div>
              <div className="text-sm text-blue-600">Enviadas</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{campaign.progress.delivered}</div>
              <div className="text-sm text-green-600">Entregues</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{campaign.progress.failed}</div>
              <div className="text-sm text-red-600">Falharam</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso Geral</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-oracle-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {campaign.progress.sent > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxa de Sucesso</span>
                <span className="font-medium">{getSuccessRate()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getSuccessRate()}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Logs em Tempo Real</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loadingLogs}
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loadingLogs ? (
        <div className="text-center py-8">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500">Carregando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum log disponível ainda</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2 text-sm font-mono">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  log.level === 'error' ? 'bg-red-900 text-red-100' :
                  log.level === 'warning' ? 'bg-yellow-900 text-yellow-100' :
                  log.level === 'success' ? 'bg-green-900 text-green-100' :
                  'bg-blue-900 text-blue-100'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-gray-300 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaign.name}
      size="xl"
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {campaign.status === 'running' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction('pause')}
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
                onClick={() => handleAction('start')}
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
                onClick={() => handleAction('start')}
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
                onClick={() => handleAction('cancel')}
                disabled={loading}
              >
                <StopIcon className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: EyeIcon },
              { id: 'logs', label: 'Logs', icon: ClockIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-oracle-500 text-oracle-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'logs' && renderLogs()}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CampaignDetailsModal;