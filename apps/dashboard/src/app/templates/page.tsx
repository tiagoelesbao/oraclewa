'use client';

import React, { useState, useEffect } from 'react';
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
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNowPtBR } from '@/lib/utils';
import { api } from '@/lib/api';
import TemplateEditorModal from '@/components/templates/TemplateEditorModal';

interface RealTemplate {
  id: string;
  client: string;
  type: string;
  name: string;
  category: string;
  content: string;
  filePath: string;
  lastModified: string;
}

export default function TemplatesPage() {
  const { clients, selectedClient, selectClient, loading } = useApp();
  
  const [realTemplates, setRealTemplates] = useState<RealTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<RealTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load real templates from API
  useEffect(() => {
    loadRealTemplates();
  }, []);

  const loadRealTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await api.get('/api/templates');
      if (response.data.success) {
        setRealTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Filter templates based on selected client, category, and search
  const filteredTemplates = realTemplates.filter(template => {
    const clientMatch = !selectedClient || template.client === selectedClient.id;
    const categoryMatch = categoryFilter === 'all' || template.category.toLowerCase() === categoryFilter;
    const searchMatch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return clientMatch && categoryMatch && searchMatch;
  });

  const getCategoryColor = (category: string): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    switch (category.toLowerCase()) {
      case 'marketing': return 'info';
      case 'suporte': return 'success';
      case 'notificação': return 'warning';
      case 'recuperação': return 'error';
      case 'variações': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category;
  };

  const handleEditTemplate = (template: RealTemplate) => {
    setEditTemplate(template);
    setShowEditorModal(true);
  };

  const handleDeleteTemplate = async (template: RealTemplate) => {
    if (confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      console.log('Delete template:', template.id);
      // TODO: Implement delete functionality
    }
  };

  const handleDuplicateTemplate = async (template: RealTemplate) => {
    console.log('Duplicate template:', template.id);
    // TODO: Implement duplicate functionality
  };

  const handleCloseModal = () => {
    setShowEditorModal(false);
    setEditTemplate(null);
  };

  const handleSaveTemplate = async (templateId: string, content: string) => {
    try {
      const response = await api.put(`/api/templates/${templateId}`, { content });
      if (response.data.success) {
        await loadRealTemplates(); // Refresh templates
        setShowEditorModal(false);
        setEditTemplate(null);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const categoryCounts = {
    all: filteredTemplates.length,
    marketing: filteredTemplates.filter(t => t.category.toLowerCase() === 'marketing').length,
    suporte: filteredTemplates.filter(t => t.category.toLowerCase() === 'suporte').length,
    notificação: filteredTemplates.filter(t => t.category.toLowerCase() === 'notificação').length,
    recuperação: filteredTemplates.filter(t => t.category.toLowerCase() === 'recuperação').length,
    variações: filteredTemplates.filter(t => t.category.toLowerCase() === 'variações').length,
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
            onClick={loadRealTemplates}
            disabled={loadingTemplates}
          >
            <DocumentTextIcon className={`w-4 h-4 mr-2 ${loadingTemplates ? 'animate-pulse' : ''}`} />
            Atualizar
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
              { key: 'suporte', label: 'Suporte', count: categoryCounts.suporte },
              { key: 'notificação', label: 'Notificação', count: categoryCounts.notificação },
              { key: 'recuperação', label: 'Recuperação', count: categoryCounts.recuperação },
              { key: 'variações', label: 'Variações', count: categoryCounts.variações },
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
      {loadingTemplates ? (
        <Card variant="border">
          <Card.Content>
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando templates...</h3>
              <p className="text-gray-600">Buscando templates reais do sistema de arquivos</p>
            </div>
          </Card.Content>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card variant="border">
          <Card.Content>
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter !== 'all' ? 'Nenhum template encontrado' : 'Nenhum template encontrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros.'
                  : 'Os templates estão sendo carregados diretamente do sistema de arquivos.'
                }
              </p>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const client = clients.find(c => c.id === template.client);
            
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
                        <p className="text-sm text-gray-600">{template.client}</p>
                        <p className="text-xs text-gray-500">{template.type}</p>
                      </div>
                      <Badge variant={getCategoryColor(template.category)} size="sm">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>

                    {/* Template Content Preview */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-4 font-mono whitespace-pre-wrap">
                        {template.content.substring(0, 200)}
                        {template.content.length > 200 ? '...' : ''}
                      </p>
                    </div>

                    {/* Template Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CodeBracketIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Tipo</div>
                          <div className="font-medium">{template.type}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Cliente</div>
                          <div className="font-medium">{template.client}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Modificado</div>
                          <div className="font-medium">
                            {formatDistanceToNowPtBR(new Date(template.lastModified))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-500">Linhas</div>
                          <div className="font-medium">{template.content.split('\n').length}</div>
                        </div>
                      </div>
                    </div>

                    {/* File Path */}
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-xs text-blue-700 font-mono truncate">
                        {template.filePath.replace('/mnt/c/Users/Pichau/Desktop/Sistemas/OracleWA/OracleWA-SaaS/', '')}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`vscode://file${template.filePath}`, '_blank')}
                        >
                          <CodeBracketIcon className="w-4 h-4 mr-1" />
                          VS Code
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditorModal && editTemplate && (
        <TemplateEditorModal
          isOpen={showEditorModal}
          onClose={handleCloseModal}
          template={editTemplate}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
}