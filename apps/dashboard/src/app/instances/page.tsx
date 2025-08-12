'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  QrCodeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNowPtBR, formatPhone } from '@/lib/utils';

// Mock data baseado nos dados reais do Hetzner
const mockInstances = [
  {
    id: '50b79573-5f46-4631-bcbd-5490841a7deb',
    name: 'imperio1',
    clientId: 'imperio',
    clientName: 'Império Prêmios',
    type: 'recovery',
    provider: 'evolution-baileys',
    status: 'open',
    ownerJid: '5511982661537@s.whatsapp.net',
    profileName: 'imp',
    profilePicUrl: 'https://pps.whatsapp.net/v/t61.24694-24/379772445_1118525192923529_716948160001277468_n.jpg',
    phone: '+5511982661537',
    token: 'imperio1_token',
    connectionStatus: 'open',
    createdAt: '2025-08-05T19:34:28.318Z',
    updatedAt: '2025-08-12T01:38:54.309Z',
    stats: {
      messages: 19821,
      contacts: 3786,
      chats: 900,
    },
    lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
  {
    id: '452f262f-d717-44b6-9dee-637369a9fec9',
    name: 'broadcast-imperio-hoje',
    clientId: 'imperio',
    clientName: 'Império Prêmios',
    type: 'broadcast',
    provider: 'evolution-baileys',
    status: 'close',
    ownerJid: '5511975623976@s.whatsapp.net',
    profileName: 'Império Suporte',
    profilePicUrl: 'https://pps.whatsapp.net/v/t61.24694-24/510221929_1489267189091137_4038585164991291430_n.jpg',
    phone: '+5511975623976',
    token: '7D134D1A-DF2A-474A-985E-1CD0C16FF3A6',
    connectionStatus: 'close',
    disconnectionReasonCode: 403,
    disconnectionAt: '2025-08-07T18:44:33.314Z',
    createdAt: '2025-08-07T01:28:46.338Z',
    updatedAt: '2025-08-07T18:44:33.336Z',
    stats: {
      messages: 76,
      contacts: 41,
      chats: 35,
    },
    lastActivity: new Date('2025-08-07T18:44:33.314Z'),
  },
  {
    id: 'f732f0a4-9a42-4470-b7dd-3685f0a16e1e',
    name: 'broadcast-limpo-final',
    clientId: 'imperio',
    clientName: 'Império Prêmios',
    type: 'broadcast',
    provider: 'evolution-baileys',
    status: 'connecting',
    ownerJid: null,
    profileName: null,
    profilePicUrl: null,
    phone: null,
    token: 'C0D7BF23-E1BA-425A-92F2-8332DB352C77',
    connectionStatus: 'connecting',
    createdAt: '2025-08-07T00:34:57.534Z',
    updatedAt: '2025-08-07T04:12:06.505Z',
    stats: {
      messages: 0,
      contacts: 0,
      chats: 0,
    },
    lastActivity: new Date('2025-08-07T04:12:06.505Z'),
  },
];

export default function InstancesPage() {
  const [instances, setInstances] = useState(mockInstances);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredInstances = instances.filter(instance => {
    if (selectedStatus === 'all') return true;
    return instance.status === selectedStatus;
  });

  const getStatusInfo = (status: string, disconnectionReasonCode?: number) => {
    switch (status) {
      case 'open':
        return {
          icon: CheckCircleIcon,
          color: 'text-success-600',
          bg: 'bg-success-50',
          label: 'Online',
          variant: 'success' as const,
        };
      case 'close':
        return {
          icon: XCircleIcon,
          color: 'text-error-600',
          bg: 'bg-error-50',
          label: `Offline ${disconnectionReasonCode ? `(${disconnectionReasonCode})` : ''}`,
          variant: 'error' as const,
        };
      case 'connecting':
        return {
          icon: ClockIcon,
          color: 'text-oracle-600',
          bg: 'bg-oracle-50',
          label: 'Conectando',
          variant: 'info' as const,
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-warning-600',
          bg: 'bg-warning-50',
          label: 'Desconhecido',
          variant: 'warning' as const,
        };
    }
  };

  const LoadingSkeleton = () => (
    <Card variant="elevated" className="animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
            <div className="flex space-x-2 mb-3">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-8" />
          <div className="h-8 bg-gray-200 rounded w-8" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instâncias WhatsApp</h1>
          <p className="text-gray-600">Gerencie todas as instâncias do sistema</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" leftIcon={<ArrowPathIcon className="w-4 h-4" />}>
            Sincronizar
          </Button>
          <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '--' : instances.length}
            </p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {isLoading ? '--' : instances.filter(i => i.status === 'open').length}
            </p>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-error-600">
              {isLoading ? '--' : instances.filter(i => i.status === 'close').length}
            </p>
            <p className="text-sm text-gray-500">Offline</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-oracle-600">
              {isLoading ? '--' : instances.filter(i => i.status === 'connecting').length}
            </p>
            <p className="text-sm text-gray-500">Conectando</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="border" padding="sm">
        <div className="flex space-x-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oracle-500 focus:border-oracle-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="open">Online</option>
            <option value="close">Offline</option>
            <option value="connecting">Conectando</option>
          </select>
        </div>
      </Card>

      {/* Instances List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))
        ) : filteredInstances.length > 0 ? (
          filteredInstances.map((instance) => {
            const statusInfo = getStatusInfo(instance.status, instance.disconnectionReasonCode);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={instance.id} variant="elevated" className="hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {instance.profilePicUrl ? (
                        <img
                          src={instance.profilePicUrl}
                          alt={instance.profileName || 'Profile'}
                          className="w-12 h-12 rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-xs font-medium">
                            {instance.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Instance Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                        <Badge variant={statusInfo.variant} size="sm">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge 
                          variant={instance.type === 'recovery' ? 'info' : 'secondary'} 
                          size="sm"
                        >
                          {instance.type === 'recovery' ? 'Recuperação' : 'Broadcast'}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>{instance.clientName}</span>
                        {instance.phone && (
                          <>
                            <span>•</span>
                            <span>{formatPhone(instance.phone)}</span>
                          </>
                        )}
                        {instance.profileName && (
                          <>
                            <span>•</span>
                            <span>{instance.profileName}</span>
                          </>
                        )}
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Mensagens</p>
                          <p className="font-semibold text-purple-600">
                            {instance.stats.messages.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Contatos</p>
                          <p className="font-semibold text-success-600">
                            {instance.stats.contacts.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Conversas</p>
                          <p className="font-semibold text-oracle-600">
                            {instance.stats.chats.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Última atividade: {formatDistanceToNowPtBR(instance.lastActivity)}
                        </p>
                        {instance.disconnectionAt && (
                          <p className="text-xs text-error-500">
                            Desconectado: {formatDistanceToNowPtBR(new Date(instance.disconnectionAt))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-6">
                    {instance.status === 'open' ? (
                      <>
                        <Button variant="outline" size="sm">
                          <QrCodeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm">
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="primary" size="sm">
                          <QrCodeIcon className="w-4 h-4" />
                          Conectar
                        </Button>
                        <Button variant="outline" size="sm">
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card variant="elevated" className="text-center py-12">
            <div className="text-gray-500">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma instância encontrada</h3>
              <p>Não encontramos instâncias com os filtros selecionados.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}