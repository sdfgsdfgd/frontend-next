import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHookProps {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

export default function useWebSocket({
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: WebSocketHookProps): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url);
      socketRef.current = socket;
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        setLastMessage(event.data);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('disconnected');
        
        // Attempt reconnection if not at max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  /**
   * Send a JSON string (caller is responsible for JSON.stringify).
   */
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  /**
   * Force a reconnect attempt, clearing any existing timeouts.
   */
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  /**
   * On first mount, connect. Also clean up on unmount.
   */
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage, lastMessage, connectionStatus, reconnect };
} 