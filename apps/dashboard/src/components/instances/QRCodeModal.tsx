'use client';

import React, { useState, useEffect } from 'react';
import { QrCodeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface QRCodeModalProps {
  instance: any;
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  instance,
  isOpen,
  onClose,
}) => {
  const [qrCode, setQrCode] = useState(instance.qrCode || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (instance.status === 'connected') {
      setIsConnected(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [instance.status, onClose]);

  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    // In a real implementation, this would call the API to get a new QR code
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update QR code (this would come from the API response)
      setQrCode(`data:image/png;base64,${Math.random().toString(36).substring(7)}`);
    } catch (error) {
      console.error('Error refreshing QR code:', error);
    } finally {
      setIsRefreshing(false);
    }
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
          <p className="text-gray-600 mb-6">
            A instância <strong>{instance.name}</strong> foi conectada com sucesso.
          </p>
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
          {qrCode ? (
            <div className="flex justify-center">
              {/* In a real implementation, this would display the actual QR code */}
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR Code seria exibido aqui</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Base64: {qrCode.substring(0, 20)}...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Gerando QR Code...</p>
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
            disabled={isRefreshing}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Novo QR Code'}
          </Button>
          
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Aguardando conexão...
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;