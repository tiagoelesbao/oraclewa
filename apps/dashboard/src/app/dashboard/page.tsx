'use client';

import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  ChartBarSquareIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '@/components/dashboard/StatsCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDistanceToNowPtBR, getStatusColor } from '@/lib/utils';

// Mock data - será substituído por API calls
const mockSystemStats = {
  activeClients: 1,
  totalInstances: 3,
  onlineInstances: 1,
  messagesProcessed: 19821,
  uptime: 172800, // 2 days in seconds
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'message_sent',
    description: 'Mensagem enviada para +55 (11) 98266-1537',
    client: 'Império Prêmios',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    status: 'success',
  },
  {
    id: 2,
    type: 'webhook_received',
    description: 'Webhook order_expired processado',
    client: 'Império Prêmios',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    status: 'success',
  },
  {
    id: 3,
    type: 'instance_disconnect',
    description: 'Instância broadcast-imperio-hoje desconectada',
    client: 'Sistema',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'warning',
  },
];

const mockInstances = [
  {
    name: 'imperio1',
    client: 'Império Prêmios',
    status: 'open',
    phone: '+55 (11) 98266-1537',
    messages: 19821,
    lastActivity: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    name: 'broadcast-imperio-hoje',
    client: 'Império Prêmios',
    status: 'close',
    phone: '+55 (11) 97562-3976',
    messages: 76,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    name: 'broadcast-limpo-final',
    client: 'Império Prêmios',
    status: 'connecting',
    phone: 'Aguardando conexão',
    messages: 0,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema OracleWA SaaS</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ClockIcon className="w-4 h-4" />
            Últimas 24h
          </Button>
          <Button variant="primary" size="sm">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Clientes Ativos"
          value={mockSystemStats.activeClients}
          subtitle="1 total configurados"
          icon={<UsersIcon className="w-6 h-6" />}
          color="blue"
          loading={isLoading}
        />
        
        <StatsCard
          title="Instâncias Online"
          value={`${mockSystemStats.onlineInstances}/${mockSystemStats.totalInstances}`}
          subtitle="33% de disponibilidade"
          trend={{ value: -67, isPositive: false }}
          icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
          color="green"
          loading={isLoading}
        />
        
        <StatsCard
          title="Mensagens Processadas"
          value={mockSystemStats.messagesProcessed}
          subtitle="Últimas 24h"
          trend={{ value: 12, isPositive: true }}
          icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
          color="purple"
          loading={isLoading}
        />
        
        <StatsCard
          title="Uptime do Sistema"
          value="48h"
          subtitle="99.5% disponibilidade"
          trend={{ value: 0.1, isPositive: true }}
          icon={<ChartBarSquareIcon className="w-6 h-6" />}
          color="green"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'success'
                          ? 'bg-success-100 text-success-600'
                          : activity.status === 'warning'
                          ? 'bg-warning-100 text-warning-600'
                          : 'bg-error-100 text-error-600'
                      }`}
                    >
                      {activity.status === 'warning' ? (
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      ) : (
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" size="sm">
                          {activity.client}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNowPtBR(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Instances Status */}
        <Card variant="elevated">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Status das Instâncias</h2>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                ))
              ) : (
                mockInstances.map((instance, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {instance.name}
                        </h3>
                        <Badge
                          variant={
                            instance.status === 'open'
                              ? 'success'
                              : instance.status === 'connecting'
                              ? 'info'
                              : 'error'
                          }
                          size="sm"
                        >
                          {instance.status === 'open'
                            ? 'Online'
                            : instance.status === 'connecting'
                            ? 'Conectando'
                            : 'Offline'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">{instance.phone}</span>
                        <span className="text-xs text-gray-500">
                          {instance.messages.toLocaleString('pt-BR')} msgs
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNowPtBR(instance.lastActivity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <DevicePhoneMobileIcon className="w-6 h-6" />
              <span className="text-sm">Nova Instância</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              <span className="text-sm">Enviar Broadcast</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <UsersIcon className="w-6 h-6" />
              <span className="text-sm">Novo Cliente</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <ChartBarSquareIcon className="w-6 h-6" />
              <span className="text-sm">Ver Relatórios</span>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}