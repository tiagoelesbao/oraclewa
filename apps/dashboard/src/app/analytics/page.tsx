'use client';

import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAnalytics(selectedPeriod);
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Failed to load analytics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod]);

  const periods = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Relatórios detalhados e métricas do sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <CalendarIcon className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-oracle-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mensagens Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    analyticsData?.totalMessages?.toLocaleString('pt-BR') || '0'
                  )}
                </p>
                {analyticsData?.totalMessages && (
                  <div className="flex items-center mt-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-success-600 mr-1" />
                    <span className="text-xs text-success-600">+12% vs período anterior</span>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${analyticsData?.successRate || 0}%`
                  )}
                </p>
                {analyticsData?.successRate && (
                  <div className="flex items-center mt-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-success-600 mr-1" />
                    <span className="text-xs text-success-600">+2.1% vs período anterior</span>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contatos Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    analyticsData?.totalContacts?.toLocaleString('pt-BR') || '0'
                  )}
                </p>
                {analyticsData?.totalContacts && (
                  <div className="flex items-center mt-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-success-600 mr-1" />
                    <span className="text-xs text-success-600">+8.5% vs período anterior</span>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    analyticsData?.activeConversations?.toLocaleString('pt-BR') || '0'
                  )}
                </p>
                {analyticsData?.activeConversations && (
                  <div className="flex items-center mt-1">
                    <ArrowTrendingDownIcon className="w-4 h-4 text-warning-600 mr-1" />
                    <span className="text-xs text-warning-600">-3.2% vs período anterior</span>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Over Time */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Mensagens ao Longo do Tempo</h2>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="h-64">
                {/* Simplified chart representation */}
                <div className="h-full flex items-end justify-between space-x-2">
                  {analyticsData?.dailyStats?.map((day: any, index: number) => {
                    const height = Math.max(20, (day.messages / Math.max(...analyticsData.dailyStats.map((d: any) => d.messages))) * 200);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-oracle-500 rounded-t w-full mb-2" 
                          style={{ height: `${height}px` }}
                          title={`${day.messages} mensagens em ${new Date(day.date).toLocaleDateString('pt-BR')}`}
                        />
                        <span className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  }) || Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="bg-gray-200 rounded-t w-full mb-2 h-12" />
                      <span className="text-xs text-gray-500">--/--</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Success vs Failed Messages */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Taxa de Sucesso por Dia</h2>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="h-64">
                {/* Simplified success rate chart */}
                <div className="h-full flex items-end justify-between space-x-2">
                  {analyticsData?.dailyStats?.map((day: any, index: number) => {
                    const successRate = Math.round((day.success / day.messages) * 100);
                    const height = Math.max(20, (successRate / 100) * 200);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-success-500 rounded-t w-full mb-2" 
                          style={{ height: `${height}px` }}
                          title={`${successRate}% de sucesso em ${new Date(day.date).toLocaleDateString('pt-BR')}`}
                        />
                        <span className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  }) || Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="bg-gray-200 rounded-t w-full mb-2 h-12" />
                      <span className="text-xs text-gray-500">--/--</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Templates Performance & Client Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Templates */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Templates Mais Utilizados</h2>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded" />
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData?.topPerformingTemplates?.map((template: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-oracle-100 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-oracle-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{template.usage.toLocaleString('pt-BR')} envios</span>
                          <span>•</span>
                          <span>{template.successRate}% sucesso</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-success-600 mr-1" />
                        <span className="text-xs text-success-600">
                          {Math.round((template.usage / analyticsData.totalMessages) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <ChartBarIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Client Performance */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Performance por Cliente</h2>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-6 bg-gray-200 rounded w-16" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData?.clientBreakdown?.map((client: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{client.name}</h3>
                      <span className="text-sm font-bold text-oracle-600">
                        {client.successRate}%
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Mensagens:</span>
                        <span>{client.messages.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cliente ID:</span>
                        <span>{client.clientId}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-oracle-600 h-2 rounded-full" 
                          style={{ width: `${client.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhum cliente encontrado</p>
                  </div>
                )}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Resumo Executivo</h2>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                ) : (
                  analyticsData?.totalMessages?.toLocaleString('pt-BR') || '0'
                )}
              </p>
              <p className="text-sm text-gray-500">Total de Mensagens</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                ) : (
                  `${analyticsData?.successRate || 0}%`
                )}
              </p>
              <p className="text-sm text-gray-500">Taxa de Sucesso Média</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                ) : (
                  Math.round((analyticsData?.totalMessages || 0) / 7).toLocaleString('pt-BR')
                )}
              </p>
              <p className="text-sm text-gray-500">Mensagens/Dia (Média)</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                ) : (
                  `${Math.round(((analyticsData?.successfulMessages || 0) / (analyticsData?.totalMessages || 1)) * 100)}%`
                )}
              </p>
              <p className="text-sm text-gray-500">Eficiência do Sistema</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}