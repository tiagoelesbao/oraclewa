'use client';

import React, { useState, useEffect } from 'react';
import { 
  CodeBracketIcon, 
  DocumentTextIcon, 
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: RealTemplate;
  onSave: (templateId: string, content: string) => Promise<void>;
}

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const [content, setContent] = useState(template.content);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(template.content);
    setHasChanges(false);
    setError(null);
    setSuccess(false);
  }, [template]);

  useEffect(() => {
    setHasChanges(content !== template.content);
  }, [content, template.content]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(template.id, content);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Erro ao salvar template. Tente novamente.');
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderPreview = () => {
    // Simple preview with variable placeholders
    let previewContent = content;
    
    // Replace common variables with example data
    previewContent = previewContent.replace(/\{\{customerName\}\}/g, 'João Silva');
    previewContent = previewContent.replace(/\{\{productName\}\}/g, 'Cota da Sorte Premium');
    previewContent = previewContent.replace(/\{\{total\}\}/g, '15,00');
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              W
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900">WhatsApp</div>
              <div className="text-sm text-gray-500">+55 11 9 7814-6855</div>
            </div>
          </div>
          <div className="bg-green-100 rounded-lg p-3 whitespace-pre-wrap text-sm">
            {previewContent}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            Agora • ✓✓
          </div>
        </div>
      </div>
    );
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Template: ${template.name}`}
      size="full"
    >
      <div className="h-[80vh] flex flex-col">
        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800">Template salvo com sucesso!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Template Info */}
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
              <Badge variant="info" size="sm">{template.client}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
              <Badge variant="secondary" size="sm">{template.type}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Categoria</label>
              <Badge variant="warning" size="sm">{template.category}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Arquivo</label>
              <div className="text-xs text-gray-600 font-mono truncate">
                {template.filePath.split('/').pop()}
              </div>
            </div>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !showPreview
                    ? 'bg-oracle-100 text-oracle-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CodeBracketIcon className="w-4 h-4 mr-1 inline" />
                Editor
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showPreview
                    ? 'bg-oracle-100 text-oracle-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <EyeIcon className="w-4 h-4 mr-1 inline" />
                Preview
              </button>
            </div>
            
            {hasChanges && (
              <Badge variant="warning" size="sm">
                Alterações não salvas
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{lineCount} linhas</span>
            <span>{charCount} caracteres</span>
          </div>
        </div>

        {/* Editor/Preview Content */}
        <div className="flex-1 min-h-0">
          {showPreview ? (
            <div className="h-full overflow-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview da Mensagem</h3>
              {renderPreview()}
            </div>
          ) : (
            <div className="h-full">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full font-mono text-sm border border-gray-300 rounded-lg p-4 resize-none focus:border-oracle-500 focus:ring-oracle-500"
                placeholder="Digite o conteúdo do template..."
                disabled={saving}
              />
            </div>
          )}
        </div>

        {/* Variable Helpers */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Variáveis Disponíveis:</h4>
          <div className="flex flex-wrap gap-2">
            {['{{customerName}}', '{{productName}}', '{{total}}'].map(variable => (
              <button
                key={variable}
                onClick={() => setContent(prev => prev + variable)}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-mono hover:bg-blue-200 transition-colors"
                disabled={saving || showPreview}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`vscode://file${template.filePath}`, '_blank')}
              disabled={saving}
            >
              <CodeBracketIcon className="w-4 h-4 mr-2" />
              Abrir no VS Code
            </Button>
            
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateEditorModal;