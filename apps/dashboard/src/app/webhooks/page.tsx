'use client';

import React, { useState, useEffect } from 'react';
import {
  ServerStackIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  SignalIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { useRealTime } from '@/contexts/RealTimeContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import { api } from '@/lib/api';

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

interface WebhookStats {
  totalMessages: number;
  successRate: number;
  averageDelay: number;
  lastMessage: string;
}

export default function WebhooksPage() {
  const { selectedClient, refreshData, loading } = useApp();
  const { isConnected, lastUpdate } = useRealTime();
  
  const [isLoading, setIsLoading] = useState(true);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [webhookPools, setWebhookPools] = useState<Record<string, WebhookPool>>({});
  const [webhookStats, setWebhookStats] = useState<WebhookStats>({
    totalMessages: 0,
    successRate: 0,
    averageDelay: 0,
    lastMessage: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pools' | 'events'>('pools');
  const [error, setError] = useState<string | null>(null);

  // Buscar dados dos pools e eventos
  useEffect(() => {
    if (activeTab === 'pools') {
      fetchWebhookPools();
      fetchWebhookStats();
    } else {
      loadWebhookEvents();
    }
  }, [selectedClient, activeTab]);

  // Eventos em tempo real
  useEffect(() => {
    if (lastUpdate) {
      switch (lastUpdate.type) {
        case 'qrcode_generated':
        case 'qrcode-generated':
          console.log('📱 QR Code gerado:', lastUpdate.data);
          break;
        case 'instance_status_updated':
        case 'instance-status-updated':
          console.log('🔄 Status da instância atualizado:', lastUpdate.data);
          fetchWebhookPools(); // Atualizar pools quando status mudar
          break;
        case 'webhook_received':
          console.log('🔗 Webhook recebido:', lastUpdate.data);
          loadWebhookEvents(); // Recarregar eventos
          break;
      }
    }
  }, [lastUpdate]);

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

  const fetchWebhookPools = async () => {
    try {
      setIsLoading(true);
      
      // Mock data para o webhook pool do império (similar ao /instances)
      const mockPools = {
        imperio: {
          clientId: 'imperio',
          strategy: 'round-robin',
          totalInstances: 4,
          instances: [
            {
              name: 'imperio-webhook-1',
              status: 'unknown' as const,
              state: 'connecting',
              lastCheck: new Date().toISOString(),
              score: 0
            },
            {
              name: 'imperio-webhook-2', 
              status: 'unknown' as const,
              state: 'connecting',
              lastCheck: new Date().toISOString(),
              score: 0
            },
            {
              name: 'imperio-webhook-3',
              status: 'unknown' as const,
              state: 'connecting', 
              lastCheck: new Date().toISOString(),
              score: 0
            },
            {
              name: 'imperio-webhook-4',
              status: 'unknown' as const,
              state: 'connecting',
              lastCheck: new Date().toISOString(),
              score: 0
            }
          ],
          healthyCount: 0,
          messageQueue: 0
        }
      };
      
      setWebhookPools(mockPools);
    } catch (error) {
      console.error('Error fetching webhook pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhookStats = async () => {
    try {
      const response = await fetch('http://localhost:3333/api/webhooks/stats');
      if (response.ok) {
        const data = await response.json();
        setWebhookStats(data.stats || webhookStats);
      }
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
    }
  };

  const createInstance = async (poolId: string, instanceName: string) => {
    try {
      const response = await fetch('/instance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName,
          clientId: poolId,
          functionType: 'webhook'
        })
      });

      if (response.ok) {
        await addInstanceToPool(poolId, instanceName);
        setNewInstanceName('');
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
    }
  };

  const addInstanceToPool = async (poolId: string, instanceName: string) => {
    try {
      const response = await fetch(`/api/webhooks/pools/${poolId}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      });

      if (response.ok) {
        fetchWebhookPools();
      }
    } catch (error) {
      console.error('Error adding instance to pool:', error);
    }
  };

  const removeInstanceFromPool = async (poolId: string, instanceName: string) => {
    try {
      const response = await fetch(`/api/webhooks/pools/${poolId}/instances/${instanceName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchWebhookPools();
      }
    } catch (error) {
      console.error('Error removing instance from pool:', error);
    }
  };

  const connectInstance = async (instanceName: string) => {
    try {
      const response = await fetch(`http://localhost:3333/api/instances/${instanceName}/qrcode`);
      if (response.ok) {
        const data = await response.json();
        if (data.qrcode) {
          // Criar nova janela com tamanho fixo para o QR code
          const qrWindow = window.open('', '_blank', 'width=500,height=600,resizable=yes,scrollbars=yes');
          if (qrWindow) {
            qrWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>QR Code - ${instanceName}</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: system-ui, -apple-system, sans-serif;
                      display: flex; 
                      flex-direction: column; 
                      align-items: center; 
                      padding: 20px;
                      margin: 0;
                      background: #f9fafb;
                      min-height: 100vh;
                      justify-content: center;
                    }
                    .container {
                      background: white;
                      padding: 30px;
                      border-radius: 12px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                      text-align: center;
                      max-width: 400px;
                    }
                    h2 { 
                      color: #1f2937; 
                      margin: 0 0 10px 0;
                      font-size: 1.5rem;
                    }
                    .subtitle {
                      color: #6b7280;
                      margin-bottom: 30px;
                      font-size: 0.95rem;
                    }
                    img { 
                      max-width: 100%; 
                      height: auto;
                      border: 2px solid #e5e7eb;
                      border-radius: 8px;
                      margin-bottom: 20px;
                    }
                    .instructions {
                      color: #374151;
                      font-size: 0.9rem;
                      line-height: 1.5;
                      background: #f3f4f6;
                      padding: 15px;
                      border-radius: 8px;
                      margin-top: 20px;
                    }
                    .status {
                      color: #059669;
                      font-weight: 500;
                      margin-top: 15px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>${instanceName}</h2>
                    <p class="subtitle">Webhook Pool - Império</p>
                    <img src="${data.qrcode}" alt="QR Code" />
                    <div class="instructions">
                      <strong>Como conectar:</strong><br>
                      1. Abra o WhatsApp no seu celular<br>
                      2. Toque nos três pontos (⋮) > WhatsApp Web<br>
                      3. Escaneie este código QR<br>
                      4. Aguarde a confirmação da conexão
                    </div>
                    <p class="status">✅ Aguardando conexão...</p>
                  </div>
                  <script>
                    // Auto-refresh QR code se necessário
                    setTimeout(() => {
                      if (window.opener && !window.opener.closed) {
                        window.close();
                      }
                    }, 300000); // 5 minutos
                  </script>
                </body>
              </html>
            `);
            qrWindow.document.close();
          } else {
            alert('Popup bloqueado! Permita popups para este site e tente novamente.');
          }
        }
      } else {
        throw new Error('Falha ao obter QR Code');
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      alert('Erro ao obter QR Code. Verifique se a instância está ativa e tente novamente.');
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'pools' ? 'Webhook Pools' : 'Webhook Events'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'pools' 
              ? 'Gerencie pools de instâncias com failover automático' 
              : 'Monitor de eventos e integrações'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Tab Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pools')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pools' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pools
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'events' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Eventos
            </button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={activeTab === 'pools' ? fetchWebhookPools : loadWebhookEvents}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {activeTab === 'pools' && (
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
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.length
                  )}
                </div>
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
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'processed').length
                  )}
                </div>
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
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'processing').length
                  )}
                </div>
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
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    webhookEvents.filter(e => e.status === 'failed').length
                  )}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Pool Management */}
      {activeTab === 'pools' && (
        <Card variant="elevated">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pool Império</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="info" size="sm">4 Instâncias</Badge>
                <Button variant="ghost" size="sm">
                  <Cog6ToothIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {/* Pool Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['imperio-webhook-1', 'imperio-webhook-2', 'imperio-webhook-3', 'imperio-webhook-4'].map((instanceName, index) => (
                  <div
                    key={instanceName}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Instance Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{instanceName}</span>
                        </div>
                        <Badge variant="secondary" size="sm">
                          Aguardando
                        </Badge>
                      </div>

                      {/* Instance Details */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <SignalIcon className="w-4 h-4" />
                          <span>Aguardando conexão</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4" />
                          <span>Número pendente</span>
                        </div>
                      </div>

                      {/* Instance Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => connectInstance(instanceName)}
                          className="flex-1 flex items-center gap-1"
                        >
                          <PlayIcon className="w-3 h-3" />
                          Conectar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pool Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <BoltIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Como configurar o Pool de Webhooks</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Clique em "Conectar" em cada instância</li>
                        <li>Escaneie o QR Code com um número WhatsApp diferente</li>
                        <li>Aguarde a conexão de todas as 4 instâncias</li>
                        <li>O sistema irá distribuir webhooks automaticamente</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Recent Events */}
      {activeTab === 'events' && (
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
      )}

      {/* Webhook Configuration */}
      {activeTab === 'events' && (
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
      )}

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nova Instância Webhook
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="ex: imperio-webhook-5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewInstanceName('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createInstance('imperio', newInstanceName)}
                disabled={!newInstanceName}
                className="flex-1"
              >
                Criar Instância
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}