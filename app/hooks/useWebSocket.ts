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
      // Close existing connection if any
      if (socketRef.current?.readyState === WebSocket.OPEN || 
          socketRef.current?.readyState === WebSocket.CONNECTING) {
        console.log('Closing existing WebSocket connection before creating a new one');
        socketRef.current.close();
      }
      
      console.log(`Connecting to WebSocket at ${url}...`);
      const socket = new WebSocket(url);
      socketRef.current = socket;
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setLastMessage(event.data);
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed with code ${event.code}: ${event.reason}`);
        setConnectionStatus('disconnected');
        
        // Check for specific close reasons
        if (event.code === 1013) { // Try again later (server at capacity)
          console.warn('Server is at capacity, will try again later');
        }
        
        // Only attempt automatic reconnection for unexpected closures or if server requests retry
        if ((event.code >= 1001 && event.code <= 1013) && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`Reconnect attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${reconnectInterval}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error occurred:', error);
        // Don't close here, let the onclose handler deal with reconnection
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect after error
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(`Reconnect attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${reconnectInterval}ms`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, reconnectInterval);
      }
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  /**
   * Send a JSON string (caller is responsible for JSON.stringify).
   */
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      socketRef.current.send(message);
    } else {
      console.warn(`WebSocket is not connected (state: ${socketRef.current?.readyState}). Cannot send message.`);
      if (socketRef.current?.readyState === undefined || socketRef.current?.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect before sending message...');
        reconnect();
      }
    }
  }, []);

  /**
   * Force a reconnect attempt, clearing any existing timeouts.
   */
  const reconnect = useCallback(() => {
    console.log('Manually initiating WebSocket reconnection');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  /**
   * On first mount, connect. Also clean up on unmount.
   */
  useEffect(() => {
    console.log('WebSocket hook initialized, establishing connection...');
    connect();
    
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [connect]);

  return { sendMessage, lastMessage, connectionStatus, reconnect };
} 