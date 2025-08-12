'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useApp } from '@/contexts/AppContext';
import { Template, TemplateVariation } from '@/contexts/AppContext';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTemplate?: Template | null;
}

interface TemplateFormData {
  name: string;
  clientId: string;
  content: string;
  variables: string[];
  variations: TemplateVariation[];
  category: 'marketing' | 'support' | 'notification' | 'recovery';
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  editTemplate,
}) => {
  const { clients, createTemplate, updateTemplate, loading } = useApp();
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    clientId: '',
    content: '',
    variables: [],
    variations: [],
    category: 'marketing',
  });

  const [newVariable, setNewVariable] = useState('');
  const [newVariation, setNewVariation] = useState<Omit<TemplateVariation, 'id'>>({
    name: '',
    content: '',
    weight: 20,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariationForm, setShowVariationForm] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editTemplate) {
      setFormData({
        name: editTemplate.name,
        clientId: editTemplate.clientId,
        content: editTemplate.content,
        variables: editTemplate.variables,
        variations: editTemplate.variations,
        category: editTemplate.category,
      });
    } else {
      setFormData({
        name: '',
        clientId: '',
        content: '',
        variables: [],
        variations: [],
        category: 'marketing',
      });
    }
  }, [editTemplate]);

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  // Auto-detect variables when content changes
  useEffect(() => {
    const detectedVars = extractVariables(formData.content);
    if (detectedVars.length > 0) {
      const existingVars = new Set(formData.variables);
      const newVars = detectedVars.filter(v => !existingVars.has(v));
      if (newVars.length > 0) {
        setFormData(prev => ({
          ...prev,
          variables: [...prev.variables, ...newVars]
        }));
      }
    }
  }, [formData.content]);

  const validateTemplate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.clientId) newErrors.clientId = 'Selecione um cliente';
    if (!formData.content.trim()) newErrors.content = 'Conteúdo é obrigatório';
    if (formData.content.length < 10) newErrors.content = 'Conteúdo muito curto (mínimo 10 caracteres)';
    if (formData.content.length > 4000) newErrors.content = 'Conteúdo muito longo (máximo 4000 caracteres)';

    // Validate variables in content
    const usedVars = extractVariables(formData.content);
    const missingVars = usedVars.filter(v => !formData.variables.includes(v));
    if (missingVars.length > 0) {
      newErrors.variables = `Variáveis não definidas: ${missingVars.join(', ')}`;
    }

    // Validate variations total weight
    if (formData.variations.length > 0) {
      const totalWeight = formData.variations.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        newErrors.variations = `Peso total das variações deve ser 100% (atual: ${totalWeight}%)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateTemplate()) return;

    try {
      if (editTemplate) {
        await updateTemplate(editTemplate.id, {
          name: formData.name,
          content: formData.content,
          variables: formData.variables,
          variations: formData.variations,
          category: formData.category,
        });
      } else {
        await createTemplate({
          name: formData.name,
          clientId: formData.clientId,
          content: formData.content,
          variables: formData.variables,
          variations: formData.variations,
          category: formData.category,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleAddVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const handleAddVariation = () => {
    if (!newVariation.name.trim() || !newVariation.content.trim()) return;

    const variation: TemplateVariation = {
      ...newVariation,
      id: `var_${Date.now()}`,
    };

    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, variation]
    }));

    setNewVariation({ name: '', content: '', weight: 20 });
    setShowVariationForm(false);
  };

  const handleRemoveVariation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter(v => v.id !== id)
    }));
  };

  const renderPreview = () => {
    let previewContent = formData.content;
    
    // Replace variables with example values
    formData.variables.forEach(variable => {
      const exampleValue = variable === 'nome' ? 'João Silva' : 
                          variable === 'produto' ? 'iPhone 15' :
                          variable === 'preco' ? 'R$ 2.999,00' :
                          variable === 'data' ? '15/12/2024' :
                          `[${variable}]`;
      previewContent = previewContent.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), exampleValue);
    });

    return previewContent;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTemplate ? 'Editar Template' : 'Novo Template'}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ex: Boas-vindas Black Friday"
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                errors.name ? 'border-error-500' : ''
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              disabled={!!editTemplate}
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                errors.clientId ? 'border-error-500' : ''
              } ${editTemplate ? 'bg-gray-100' : ''}`}
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-error-600">{errors.clientId}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
          >
            <option value="marketing">Marketing</option>
            <option value="support">Suporte</option>
            <option value="notification">Notificação</option>
            <option value="recovery">Recuperação</option>
          </select>
        </div>

        {/* Template Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo da Mensagem *
          </label>
          <div className="space-y-2">
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Olá {{nome}}! Temos uma oferta especial para você..."
              rows={6}
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm ${
                errors.content ? 'border-error-500' : ''
              }`}
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Use {`{{variavel}}`} para inserir dados dinâmicos</span>
              <span>{formData.content.length}/4000 caracteres</span>
            </div>
          </div>
          {errors.content && (
            <p className="mt-1 text-sm text-error-600">{errors.content}</p>
          )}
        </div>

        {/* Variables Management */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variáveis do Template
          </label>
          
          {formData.variables.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.variables.map(variable => (
                <Badge
                  key={variable}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <span>{`{{${variable}}}`}</span>
                  <button
                    onClick={() => handleRemoveVariable(variable)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type="text"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              placeholder="nome, produto, preco..."
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddVariable()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariable}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          {errors.variables && (
            <p className="mt-1 text-sm text-error-600">{errors.variables}</p>
          )}
        </div>

        {/* Template Variations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Variações do Template (para Anti-ban)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowVariationForm(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Variação
            </Button>
          </div>

          {formData.variations.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.variations.map(variation => (
                <div key={variation.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{variation.name}</span>
                      <Badge variant="info" size="sm">{variation.weight}%</Badge>
                    </div>
                    <button
                      onClick={() => handleRemoveVariation(variation.id)}
                      className="text-gray-400 hover:text-error-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {variation.content.substring(0, 100)}
                    {variation.content.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {errors.variations && (
            <p className="mt-1 text-sm text-error-600">{errors.variations}</p>
          )}

          {/* Add Variation Form */}
          {showVariationForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Nova Variação</h4>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={newVariation.name}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da variação"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>
                <div>
                  <textarea
                    value={newVariation.content}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Conteúdo da variação..."
                    rows={3}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Peso da variação (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newVariation.weight}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                    className="block w-24 rounded-lg border-gray-300 shadow-sm focus:border-oracle-500 focus:ring-oracle-500 sm:text-sm"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddVariation}
                  >
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariationForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {formData.content && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview da Mensagem
            </label>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center space-x-2 mb-2">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Como aparecerá para o cliente</span>
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {renderPreview()}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {formData.variations.length > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-4 h-4 text-success-500" />
                <span>{formData.variations.length} variações configuradas</span>
              </div>
            )}
            {formData.variables.length > 0 && (
              <div className="flex items-center space-x-1">
                <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                <span>{formData.variables.length} variáveis detectadas</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Salvando...' : editTemplate ? 'Atualizar' : 'Criar Template'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTemplateModal;