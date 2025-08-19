'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

interface RealTimeUpdate {
  type: 'instance_status' | 'campaign_progress' | 'message_sent' | 'system_alert' | 'webhook_received';
  data: any;
  timestamp: string;
}

interface RealTimeContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: RealTimeUpdate | null;
  sendMessage: (message: any) => boolean;
  reconnect: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Don't use useApp here to avoid circular dependency
  // We'll get the functions through props or alternative methods

  // WebSocket connection (will fallback to polling if WebSocket is not available)
  const {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect,
  } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3333',
    onMessage: (message) => {
      handleRealTimeUpdate(message as RealTimeUpdate);
    },
    onConnect: () => {
      console.log('🔗 Real-time connection established');
    },
    onDisconnect: () => {
      console.log('🔌 Real-time connection lost');
    },
    onError: (error) => {
      console.warn('⚠️ WebSocket error, falling back to polling:', error);
    },
    reconnect: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 3,
  });

  const handleRealTimeUpdate = (update: RealTimeUpdate) => {
    console.log('📡 Real-time update received:', update.type, update.data);

    switch (update.type) {
      case 'instance_status':
        // Refresh instances when status changes
        console.log('🔄 Instance status update:', update.data);
        break;
        
      case 'campaign_progress':
        // Update campaign progress in real-time
        console.log('📊 Campaign progress update:', update.data);
        break;
        
      case 'message_sent':
        // Update message counts and statistics
        console.log('📨 Message sent update:', update.data);
        break;
        
      case 'system_alert':
        // Handle system alerts (could trigger notifications)
        console.log('🚨 System Alert:', update.data.message);
        break;
        
      case 'webhook_received':
        // Update webhook statistics
        console.log('🔗 Webhook received:', update.data);
        break;
        
      default:
        console.log('Unknown update type:', update.type);
    }
  };

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    if (!isConnected) {
      // Use polling as fallback - simplified to avoid circular dependency
      pollingInterval = setInterval(() => {
        console.log('📊 Polling fallback - WebSocket disconnected');
        // Note: Real data refresh will be handled by individual components
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isConnected]);

  // Subscribe to specific real-time events
  useEffect(() => {
    if (isConnected) {
      // Subscribe to instance updates
      sendMessage({
        type: 'subscribe',
        events: ['instance_status', 'campaign_progress', 'message_sent', 'webhook_received'],
      });
    }
  }, [isConnected, sendMessage]);

  const contextValue: RealTimeContextType = {
    isConnected,
    connectionStatus,
    lastUpdate: lastMessage as RealTimeUpdate | null,
    sendMessage,
    reconnect,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = (): RealTimeContextType => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export default RealTimeContext;