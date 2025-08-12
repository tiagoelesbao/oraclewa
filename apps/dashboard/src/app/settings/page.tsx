'use client';

import React, { useState } from 'react';
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  ServerIcon,
  KeyIcon,
  CircleStackIcon as DatabaseIcon,
  CloudIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Geral', icon: <CogIcon className="w-4 h-4" /> },
    { id: 'security', label: 'Segurança', icon: <ShieldCheckIcon className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notificações', icon: <BellIcon className="w-4 h-4" /> },
    { id: 'api', label: 'API', icon: <KeyIcon className="w-4 h-4" /> },
    { id: 'database', label: 'Banco de Dados', icon: <DatabaseIcon className="w-4 h-4" /> },
    { id: 'integration', label: 'Integrações', icon: <CloudIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie as configurações do sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Exportar Config
          </Button>
          <Button variant="primary" size="sm">
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Content>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-oracle-100 text-oracle-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card.Content>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome do Sistema
                        </label>
                        <input
                          type="text"
                          defaultValue="OracleWA SaaS"
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Versão
                        </label>
                        <input
                          type="text"
                          defaultValue="3.1.0"
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuso Horário
                      </label>
                      <select className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm">
                        <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                        <option value="America/New_York">América/Nova York (GMT-5)</option>
                        <option value="Europe/London">Europa/Londres (GMT+0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        <span className="ml-2 text-sm text-gray-700">Ativar logs detalhados</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        <span className="ml-2 text-sm text-gray-700">Modo de manutenção automática</span>
                      </label>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações de Segurança</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Autenticação</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                          <span className="ml-2 text-sm text-gray-700">Exigir autenticação JWT</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                          <span className="ml-2 text-sm text-gray-700">Autenticação de dois fatores (2FA)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Webhook Security</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                          <span className="ml-2 text-sm text-gray-700">Verificação HMAC signature</span>
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Webhook Secret
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="password"
                              defaultValue="webhook_secret_key_123"
                              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                            />
                            <Button variant="outline" size="sm">
                              Gerar Nova
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Rate Limiting</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requisições por minuto
                          </label>
                          <input
                            type="number"
                            defaultValue="100"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Janela de tempo (minutos)
                          </label>
                          <input
                            type="number"
                            defaultValue="1"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações de Notificações</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Alertas do Sistema</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Instância desconectada</span>
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Erro no envio de mensagem</span>
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Sistema indisponível</span>
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Email de Notificação</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email do Administrador
                          </label>
                          <input
                            type="email"
                            defaultValue="admin@oraclewa.com"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                          <span className="ml-2 text-sm text-gray-700">Ativar notificações por email</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações da API</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Evolution API</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL do Servidor
                          </label>
                          <input
                            type="url"
                            defaultValue="http://128.140.7.154:8080"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="password"
                              defaultValue="evolution_api_key_123"
                              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                            />
                            <Button variant="outline" size="sm">
                              Testar Conexão
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="info" size="sm">
                            Conectado
                          </Badge>
                          <span className="text-sm text-gray-500">Versão 2.3.1</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Configurações de Timeout</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timeout de Requisição (ms)
                          </label>
                          <input
                            type="number"
                            defaultValue="30000"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timeout de Webhook (ms)
                          </label>
                          <input
                            type="number"
                            defaultValue="120000"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações do Banco de Dados</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">PostgreSQL</h3>
                        <Badge variant="secondary" size="sm">Local only</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Host
                          </label>
                          <input
                            type="text"
                            defaultValue="localhost"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Porta
                          </label>
                          <input
                            type="number"
                            defaultValue="5432"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Redis Cache</h3>
                        <Badge variant="secondary" size="sm">Local only</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Host
                          </label>
                          <input
                            type="text"
                            defaultValue="localhost"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Porta
                          </label>
                          <input
                            type="number"
                            defaultValue="6379"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Manutenção</h3>
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                          Backup Manual
                        </Button>
                        <Button variant="outline" size="sm">
                          Limpar Cache
                        </Button>
                        <Button variant="outline" size="sm">
                          Otimizar DB
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Integration Settings */}
          {activeTab === 'integration' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900">Integrações</h2>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Hetzner Cloud</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <ServerIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Evolution API Server</p>
                              <p className="text-xs text-gray-500">128.140.7.154:8080</p>
                            </div>
                          </div>
                          <Badge variant="info" size="sm">Conectado</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">E-commerce Platforms</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CloudIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Webhooks Genéricos</p>
                              <p className="text-xs text-gray-500">order_paid, order_expired</p>
                            </div>
                          </div>
                          <Badge variant="info" size="sm">Ativo</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Monitoramento</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Prometheus Metrics</span>
                          <input type="checkbox" className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Health Check Endpoint</span>
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-oracle-600 shadow-sm focus:border-oracle-500 focus:ring-oracle-500" />
                        </label>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}