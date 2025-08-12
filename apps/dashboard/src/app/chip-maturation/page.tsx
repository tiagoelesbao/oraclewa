'use client';

import React, { useEffect, useState } from 'react';
import {
  CpuChipIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function ChipMaturationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [maturationStats, setMaturationStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaturationData = async () => {
      try {
        setIsLoading(true);
        const statsData = await api.getChipMaturationStats();
        setMaturationStats(statsData);
      } catch (err: any) {
        console.error('Failed to load chip maturation data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaturationData();
  }, []);

  const mockMaturationData = {
    totalChips: 15,
    activeChips: 8,
    maturingChips: 5,
    readyChips: 2,
    averageMaturationTime: 7, // days
    successRate: 87.5,
    groups: [
      { name: 'Grupo A', members: 245, status: 'active' },
      { name: 'Grupo B', members: 189, status: 'active' },
      { name: 'Grupo C', members: 156, status: 'maturing' },
      { name: 'Grupo D', members: 78, status: 'pending' },
    ],
    recentActivity: [
      { id: 1, chip: 'Chip #001', action: 'Iniciou maturação', time: '2 horas atrás' },
      { id: 2, chip: 'Chip #003', action: 'Entrou em grupo', time: '4 horas atrás' },
      { id: 3, chip: 'Chip #007', action: 'Maturação completa', time: '6 horas atrás' },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maturing':
        return 'warning';
      case 'pending':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'maturing':
        return 'Maturando';
      case 'pending':
        return 'Pendente';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chip Maturation</h1>
          <p className="text-gray-600">Sistema de maturação automática de números</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ChartBarIcon className="w-4 h-4" />
            Relatório
          </Button>
          <Button variant="primary" size="sm">
            <PlusIcon className="w-4 h-4" />
            Adicionar Chips
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="w-8 h-8 text-oracle-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Chips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    mockMaturationData.totalChips
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
                <PlayIcon className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chips Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    mockMaturationData.activeChips
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
                <ClockIcon className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Em Maturação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    mockMaturationData.maturingChips
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
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${mockMaturationData.successRate}%`
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chips Status */}
        <Card variant="elevated">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Status dos Chips</h2>
              <Button variant="ghost" size="sm">
                Ver Todos
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: mockMaturationData.totalChips }).map((_, i) => {
                  const chipNumber = String(i + 1).padStart(3, '0');
                  const statuses = ['active', 'maturing', 'pending'];
                  const status = statuses[i % 3];
                  
                  return (
                    <div key={i} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-oracle-100 rounded-lg flex items-center justify-center">
                          <CpuChipIcon className="w-5 h-5 text-oracle-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Chip #{chipNumber}
                          </h3>
                          <Badge variant={getStatusColor(status)} size="sm">
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                        <div className="mt-1">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Telefone: +55 11 9{chipNumber}-{chipNumber}</span>
                            <span>Dia {Math.floor(Math.random() * 14) + 1}/14</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {status === 'active' ? (
                          <Button variant="ghost" size="sm">
                            <PauseIcon className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Groups Activity */}
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">Grupos de Maturação</h2>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockMaturationData.groups.map((group, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {group.name}
                        </h3>
                        <Badge variant={getStatusColor(group.status)} size="sm">
                          {getStatusLabel(group.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {group.members} membros
                      </p>
                    </div>

                    <Button variant="ghost" size="sm">
                      Ver Grupo
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mockMaturationData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-oracle-100 flex items-center justify-center">
                    <CpuChipIcon className="w-4 h-4 text-oracle-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.chip}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Configuration */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Configuração do Sistema</h2>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Parâmetros de Maturação</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Período de aquecimento:</span>
                  <span>7 dias</span>
                </div>
                <div className="flex justify-between">
                  <span>Mensagens por dia:</span>
                  <span>10 → 70</span>
                </div>
                <div className="flex justify-between">
                  <span>Intervalo entre msgs:</span>
                  <span>90-120s</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Status do Pool</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Pool ativo:</span>
                  <Badge variant="info" size="sm">Executando</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Último sync:</span>
                  <span>2 min atrás</span>
                </div>
                <div className="flex justify-between">
                  <span>Próxima verificação:</span>
                  <span>Em 58 min</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Ações</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Pausar Sistema
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Backup Pool
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Ver Logs
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}