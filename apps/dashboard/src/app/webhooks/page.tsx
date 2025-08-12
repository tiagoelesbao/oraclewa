'use client';

import React, { useEffect, useState } from 'react';
import {
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatDistanceToNowPtBR } from '@/lib/utils';

export default function WebhooksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWebhookEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await api.getWebhookEvents();
        setWebhookEvents(eventsData);
      } catch (err: any) {
        console.error('Failed to load webhook events:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadWebhookEvents();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon className="w-5 h-5 text-success-600" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-warning-600" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-error-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processado';
      case 'processing':
        return 'Processando';
      case 'failed':
        return 'Falhou';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order_paid':
        return 'Pedido Pago';
      case 'order_expired':
        return 'Pedido Expirado';
      case 'cart_abandoned':
        return 'Carrinho Abandonado';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order_paid':
        return 'text-success-600 bg-success-100';
      case 'order_expired':
        return 'text-warning-600 bg-warning-100';
      case 'cart_abandoned':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600">Monitor de eventos e integrações</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="primary" size="sm">
            Configurações
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BoltIcon className="w-8 h-8 text-oracle-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.length
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
                <CheckCircleIcon className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Processados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'processed').length
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
                <p className="text-sm font-medium text-gray-500">Processando</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'processing').length
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
                <XCircleIcon className="w-8 h-8 text-error-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Falharam</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'failed').length
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Recent Events */}
      <Card variant="elevated">
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Eventos Recentes</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Filtrar
              </Button>
              <Button variant="ghost" size="sm">
                Exportar
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : webhookEvents.length === 0 ? (
            <div className="text-center py-12">
              <BoltIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-500 mb-4">Os eventos de webhook aparecerão aqui quando forem recebidos</p>
              <Button variant="primary">
                Testar Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhookEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-oracle-300 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(event.type)}`}>
                      <BoltIcon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getTypeLabel(event.type)}
                      </h3>
                      <Badge variant={getStatusVariant(event.status)} size="sm">
                        {getStatusLabel(event.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Cliente: {event.clientId}</span>
                      {event.payload?.orderId && <span>Pedido: #{event.payload.orderId}</span>}
                      {event.payload?.amount && <span>R$ {event.payload.amount}</span>}
                      <span>Recebido {formatDistanceToNowPtBR(new Date(event.createdAt))}</span>
                      {event.processedAt && (
                        <span>Processado {formatDistanceToNowPtBR(new Date(event.processedAt))}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(event.status)}
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Webhook Configuration */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Configuração de Webhooks</h2>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Endpoints Ativos</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Paid</p>
                    <p className="text-xs text-gray-500">/api/webhook/temp-order-paid</p>
                  </div>
                  <Badge variant="info" size="sm">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Expired</p>
                    <p className="text-xs text-gray-500">/api/webhook/temp-order-expired</p>
                  </div>
                  <Badge variant="info" size="sm">Ativo</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Últimas 24 Horas</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Eventos recebidos:</span>
                  <span className="text-sm font-medium text-gray-900">{webhookEvents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Taxa de sucesso:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {webhookEvents.length > 0 
                      ? Math.round((webhookEvents.filter(e => e.status === 'processed').length / webhookEvents.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tempo médio:</span>
                  <span className="text-sm font-medium text-gray-900">~250ms</span>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}