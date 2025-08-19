'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    url,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const socket = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      // Parse URL to get base URL for Socket.IO
      const baseUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
      
      socket.current = io(baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: reconnect,
        reconnectionDelay: reconnectDelay,
        reconnectionAttempts: maxReconnectAttempts
      });

      socket.current.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        onConnect?.();
      });

      socket.current.on('disconnect', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
      });

      socket.current.on('connect_error', (error) => {
        setConnectionStatus('error');
        onError?.(error);
      });

      // Listen for real-time events
      socket.current.on('qrcode-generated', (data) => {
        const message: WebSocketMessage = {
          type: 'qrcode-generated',
          data,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.current.on('instance-status-updated', (data) => {
        const message: WebSocketMessage = {
          type: 'instance-status-updated',
          data,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setLastMessage(message);
        onMessage?.(message);
      });

    } catch (error) {
      setConnectionStatus('error');
      console.error('Socket.IO connection error:', error);
      onError?.(error);
    }
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const sendMessage = (data: any) => {
    if (socket.current && socket.current.connected) {
      try {
        // If data has a type field, use it as the event name
        if (data.type) {
          socket.current.emit(data.type, data);
        } else {
          socket.current.emit('message', data);
        }
        return true;
      } catch (error) {
        console.error('Error sending Socket.IO message:', error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect,
  };
};

export default useWebSocket;