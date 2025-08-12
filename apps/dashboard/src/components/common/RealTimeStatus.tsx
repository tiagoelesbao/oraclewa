'use client';

import React from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { 
  SignalIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

const RealTimeStatus: React.FC = () => {
  const { isConnected, connectionStatus, reconnect } = useRealTime();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: SignalIcon,
          text: 'Tempo Real',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          pulse: true,
        };
      case 'connecting':
        return {
          icon: ArrowPathIcon,
          text: 'Conectando...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          pulse: false,
          animate: 'animate-spin',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          text: 'Erro de Conexão',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          pulse: false,
        };
      default:
        return {
          icon: XCircleIcon,
          text: 'Offline (Polling)',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor}`}>
      <div className="relative">
        <IconComponent 
          className={`w-4 h-4 ${config.color} ${config.animate || ''}`} 
        />
        {config.pulse && (
          <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
        )}
      </div>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
      
      {!isConnected && connectionStatus !== 'connecting' && (
        <button
          onClick={reconnect}
          className="ml-1 text-xs text-gray-500 hover:text-gray-700 underline"
          title="Tentar reconectar"
        >
          Reconectar
        </button>
      )}
    </div>
  );
};

export default RealTimeStatus;