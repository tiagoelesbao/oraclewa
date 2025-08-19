'use client';

import React, { useState, useEffect } from 'react';
import { QrCodeIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api';

interface QRCodeModalProps {
  instance: any;
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  instance,
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('disconnected');
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Monitorar status da conexão a cada 3 segundos
  useEffect(() => {
    const instanceId = instance?.instanceName || instance?.name;
    if (!isOpen || !instanceId) return;

    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const instanceId = instance?.instanceName || instance?.name;
        if (!instanceId) return;
        
        const response = await api.get(`/api/instances/${instanceId}/status`);
        const newStatus = response.data.status;
        setStatus(newStatus);

        if (newStatus === 'open') {
          setIsConnected(true);
          setIsMonitoring(false);
          if (onConnectionSuccess) {
            onConnectionSuccess();
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    if (isMonitoring) {
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen, instance?.instanceName, api, isMonitoring, onConnectionSuccess]);

  // Buscar QR Code quando o modal abre
  useEffect(() => {
    const instanceId = instance?.instanceName || instance?.name;
    if (isOpen && instanceId && !isConnected) {
      fetchQRCode();
    }
  }, [isOpen, instance?.instanceName, instance?.name, isConnected]);

  const fetchQRCode = async () => {
    // Use instanceName or fallback to name
    const instanceId = instance?.instanceName || instance?.name;
    
    if (!instanceId) {
      console.error('No instance ID available:', instance);
      setError('ID da instância não encontrado');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Fetching QR Code for instance:', instanceId);
      const response = await api.get(`/api/instances/${instanceId}/qrcode`);
      
      if (response.data.success && response.data.qrcode) {
        setQrCode(response.data.qrcode);
        setIsMonitoring(true); // Começar a monitorar status
      } else {
        setError('QR Code não disponível. A instância pode já estar conectada.');
      }
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao buscar QR Code';
      setError(`Erro ao carregar QR Code - ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    await fetchQRCode();
  };

  if (isConnected) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Conexão Estabelecida"
        size="md"
      >
        <div className="text-center py-8">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            WhatsApp Conectado!
          </h3>
          <p className="text-gray-600 mb-4">
            A instância <strong>{instance.instanceName || instance.name}</strong> foi conectada com sucesso.
          </p>
          
          {/* Informações da instância */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes da Conexão:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Instância:</span>
                <span className="font-medium">{instance.instanceName || instance.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Conectado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium">{instance.phone || 'Aguardando...'}</span>
              </div>
            </div>
          </div>
          
          <Button variant="primary" onClick={onClose}>
            Continuar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Conectar WhatsApp: ${instance.name}`}
      size="md"
    >
      <div className="text-center">
        <div className="mb-6">
          <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Escaneie o QR Code
          </h3>
          <p className="text-gray-600">
            Abra o WhatsApp no seu celular e escaneie o código abaixo para conectar a instância.
          </p>
        </div>

        {/* QR Code Display */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          {error ? (
            <div className="w-64 h-64 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center mx-auto">
              <div className="text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-2">Erro ao carregar QR Code</p>
                <p className="text-xs text-red-500">{error}</p>
              </div>
            </div>
          ) : qrCode ? (
            <div>
              {/* Status badge - moved above QR code */}
              <div className="flex justify-center mb-3">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  status === 'open' ? 'bg-green-100 text-green-800' :
                  status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'open' ? 'bg-green-500' :
                    status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-500'
                  }`}></div>
                  {status === 'open' ? 'Conectado' :
                   status === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </div>
              </div>
              {/* QR Code image */}
              <div className="flex justify-center">
                <img 
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          ) : isLoading ? (
            <div className="w-64 h-64 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Carregando QR Code...</p>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
              <div className="text-center">
                <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">QR Code não disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Como conectar:</h4>
          <ol className="text-sm text-blue-800 text-left space-y-1">
            <li>1. Abra o WhatsApp no seu celular</li>
            <li>2. Toque nos três pontinhos (menu)</li>
            <li>3. Selecione "Dispositivos conectados"</li>
            <li>4. Toque em "Conectar um dispositivo"</li>
            <li>5. Escaneie este QR code</li>
          </ol>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Importante:</strong> Use apenas números WhatsApp dedicados para automação. 
            Não use seu WhatsApp pessoal para evitar possíveis banimentos.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleRefreshQR}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Carregando...' : 'Novo QR Code'}
          </Button>
          
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mt-4 text-center">
          {isMonitoring ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              Aguardando conexão...
            </div>
          ) : error ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Erro na conexão
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
              <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
              Pronto para conectar
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;