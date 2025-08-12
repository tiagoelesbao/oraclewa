'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, getStatusColor } from '@/lib/utils';

// Mock data - será substituído por API calls
const mockClients = [
  {
    id: 'imperio',
    name: 'Império Prêmios',
    description: 'Sistema de recuperação de vendas e broadcast para Império Premiações',
    status: 'active',
    provider: 'evolution-baileys',
    services: ['webhooks', 'broadcast'],
    instances: {
      active: 1,
      total: 5,
    },
    limits: {
      messagesPerDay: 5000,
      messagesPerHour: 500,
    },
    billing: {
      plan: 'professional',
      monthlyBudget: 0,
    },
    stats: {
      messagesProcessed: 19821,
      contactsActive: 3786,
      chatsActive: 900,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-09T00:00:00Z',
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const LoadingSkeleton = () => (
    <Card variant="elevated" className="animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64 mb-4" />
          <div className="flex space-x-2 mb-4">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-12" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-18" />
              <div className="h-6 bg-gray-200 rounded w-14" />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-8" />
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie todos os clientes da plataforma</p>
        </div>
        <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
          Novo Cliente
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '--' : clients.length}
            </p>
            <p className="text-sm text-gray-500">Total de Clientes</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {isLoading ? '--' : clients.filter(c => c.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">Ativos</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-oracle-600">
              {isLoading ? '--' : clients.reduce((sum, c) => sum + c.instances.active, 0)}
            </p>
            <p className="text-sm text-gray-500">Instâncias Online</p>
          </div>
        </Card>
        
        <Card variant="border" padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {isLoading ? '--' : clients.reduce((sum, c) => sum + c.stats.messagesProcessed, 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-500">Mensagens Processadas</p>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="border" padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oracle-500 focus:border-oracle-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oracle-500 focus:border-oracle-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} variant="elevated" className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <Badge
                      variant={client.status === 'active' ? 'success' : 'secondary'}
                      size="sm"
                    >
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {client.provider}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{client.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {client.services.map((service) => (
                      <Badge key={service} variant="secondary" size="sm">
                        {service === 'webhooks' ? 'Webhooks' : 'Broadcast'}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Instâncias</p>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <DevicePhoneMobileIcon className="w-4 h-4 mr-1 text-oracle-500" />
                        {client.instances.active}/{client.instances.total}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500">Mensagens/Dia</p>
                      <p className="font-semibold text-gray-900">
                        {client.limits.messagesPerDay.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500">Plano</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {client.billing.plan}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Mensagens</p>
                        <p className="font-semibold text-purple-600">
                          {client.stats.messagesProcessed.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Contatos</p>
                        <p className="font-semibold text-success-600">
                          {client.stats.contactsActive.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Conversas</p>
                        <p className="font-semibold text-oracle-600">
                          {client.stats.chatsActive.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-6">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card variant="elevated" className="text-center py-12">
            <div className="text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
              <p>Não encontramos clientes com os filtros selecionados.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}