'use client';

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  StarIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import CreateTemplateModal from '@/components/templates/CreateTemplateModal';
import { Template } from '@/contexts/AppContext';

export default function TemplatesPage() {
  const {
    templates,
    clients,
    selectedClient,
    selectClient,
    deleteTemplate,
    loading,
    refreshData,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter templates based on selected client, category, and search
  const filteredTemplates = templates.filter(template => {
    const clientMatch = !selectedClient || template.clientId === selectedClient.id;
    const categoryMatch = categoryFilter === 'all' || template.category === categoryFilter;
    const searchMatch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return clientMatch && categoryMatch && searchMatch;
  });

  const getCategoryColor = (category: string): 'success' | 'warning' | 'error' | 'primary' | 'secondary' => {
    switch (category) {
      case 'marketing': return 'primary';
      case 'support': return 'success';
      case 'notification': return 'warning';
      case 'recovery': return 'error';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      marketing: 'Marketing',
      support: 'Suporte',
      notification: 'Notificação',
      recovery: 'Recuperação',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const handleEditTemplate = (template: Template) => {
    setEditTemplate(template);
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    setEditTemplate({
      ...template,
      id: '', // Will be generated
      name: `${template.name} (Cópia)`,
      createdAt: new Date(),
      usageCount: 0,
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditTemplate(null);
  };

  const categoryCounts = {
    all: filteredTemplates.length,
    marketing: filteredTemplates.filter(t => t.category === 'marketing').length,
    support: filteredTemplates.filter(t => t.category === 'support').length,
    notification: filteredTemplates.filter(t => t.category === 'notification').length,
    recovery: filteredTemplates.filter(t => t.category === 'recovery').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="text-gray-600">Crie e gerencie templates para suas campanhas de broadcast</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshData()}
            disabled={loading}
          >
            <DocumentTextIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Client Selector */}
        <Card variant="border">
          <Card.Content>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Cliente:</label>
              <select
                value={selectedClient?.id || 'all'}
                onChange={(e) => {
                  const clientId = e.target.value;
                  if (clientId === 'all') {
                    selectClient(null);
                  } else {
                    const client = clients.find(c => c.id === clientId);
                    selectClient(client || null);
                  }
                }}
                className="block rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
              >
                <option value="all">Todos os Clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </Card.Content>
        </Card>

        {/* Search and Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'Todas', count: categoryCounts.all },
              { key: 'marketing', label: 'Marketing', count: categoryCounts.marketing },
              { key: 'support', label: 'Suporte', count: categoryCounts.support },
              { key: 'notification', label: 'Notificação', count: categoryCounts.notification },
              { key: 'recovery', label: 'Recuperação', count: categoryCounts.recovery },
            ].map(category => (
              <button
                key={category.key}
                onClick={() => setCategoryFilter(category.key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  categoryFilter === category.key
                    ? 'bg-white text-oracle-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <Card variant="border">
          <Card.Content>
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter !== 'all' ? 'Nenhum template encontrado' : 'Nenhum template criado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros ou criar um novo template.'
                  : 'Crie seu primeiro template para começar a enviar mensagens personalizadas.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const client = clients.find(c => c.id === template.clientId);
            
            return (
              <Card key={template.id} variant="elevated" className="hover:shadow-lg transition-shadow">
                <Card.Content>
                  <div className="space-y-4">
                    {/* Template Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600">{client?.name}</p>
                      </div>
                      <Badge variant={getCategoryColor(template.category)} size="sm">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>

                    {/* Template Content Preview */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {template.content.substring(0, 120)}
                        {template.content.length > 120 ? '...' : ''}
                      </p>
                    </div>

                    {/* Template Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Variáveis</div>
                          <div className="font-medium">{template.variables.length}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ChartBarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Variações</div>
                          <div className="font-medium">{template.variations.length}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <StarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Usado</div>
                          <div className="font-medium">{template.usageCount}x</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Criado</div>
                          <div className="font-medium">
                            {formatDistanceToNowPtBR(template.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variables Preview */}
                    {template.variables.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Variáveis:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map(variable => (
                            <Badge key={variable} variant="secondary" size="sm">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" size="sm">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                          Duplicar
                        </Button>
                      </div>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        disabled={loading}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          editTemplate={editTemplate}
        />
      )}
    </div>
  );
}