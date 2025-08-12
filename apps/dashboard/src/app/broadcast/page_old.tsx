'use client';

import React, { useEffect, useState } from 'react';
import {
  SpeakerWaveIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatDistanceToNowPtBR } from '@/lib/utils';

export default function BroadcastPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setIsLoading(true);
        const campaignsData = await api.getBroadcastCampaigns();
        setCampaigns(campaignsData);
      } catch (err: any) {
        console.error('Failed to load campaigns:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'running':
        return 'Executando';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'draft':
        return 'Rascunho';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-gray-600">Gerencie campanhas de disparo em massa</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <DocumentTextIcon className="w-4 h-4" />
            Importar CSV
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowNewCampaign(true)}
          >
            <PlusIcon className="w-4 h-4" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SpeakerWaveIcon className="w-8 h-8 text-oracle-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    campaigns.filter(c => c.status === 'active').length
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mensagens Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    campaigns.reduce((acc, c) => acc + (c.messagesSent || 0), 0).toLocaleString('pt-BR')
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${campaigns.length > 0 ? Math.round(campaigns.reduce((acc, c) => acc + (c.successRate || 0), 0) / campaigns.length) : 0}%`
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Campanhas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    campaigns.length
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card variant="elevated">
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campanhas</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Filtrar
              </Button>
              <Button variant="ghost" size="sm">
                Ordenar
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <SpeakerWaveIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-gray-500 mb-4">Crie sua primeira campanha de broadcast para começar</p>
              <Button 
                variant="primary" 
                onClick={() => setShowNewCampaign(true)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-oracle-300 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-oracle-100 rounded-lg flex items-center justify-center">
                      <SpeakerWaveIcon className="w-6 h-6 text-oracle-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {campaign.name}
                      </h3>
                      <Badge variant={getStatusVariant(campaign.status)} size="sm">
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{campaign.messagesSent?.toLocaleString('pt-BR') || 0} / {campaign.messagesTotal?.toLocaleString('pt-BR') || 0} mensagens</span>
                      <span>{campaign.successRate || 0}% sucesso</span>
                      <span>Criada {formatDistanceToNowPtBR(new Date(campaign.createdAt))}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm">
                          <PauseIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <StopIcon className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {campaign.status === 'paused' && (
                      <Button variant="ghost" size="sm">
                        <PlayIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <DocumentTextIcon className="w-6 h-6" />
              <span className="text-sm">Upload CSV</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <SpeakerWaveIcon className="w-6 h-6" />
              <span className="text-sm">Broadcast Rápido</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <CalendarIcon className="w-6 h-6" />
              <span className="text-sm">Agendar Campanha</span>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}