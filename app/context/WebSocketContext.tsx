"use client";

import React, { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Singleton to store the WebSocket instance
let globalWebSocketInstance: WebSocket | null = null;
let activeListeners: Map<string, Set<(data: any) => void>> = new Map();
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type SyncStatus = 'idle' | 'initializing' | 'syncing' | 'synchronized' | 'error';

export interface GitHubRepoData {
  repoId: number;
  name: string;
  owner: string;
  url: string;
  branch?: string;
}

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  lastMessage: string | null;
  sendMessage: (message: string) => boolean;
  reconnect: () => void;
  addMessageListener: (type: string, callback: (data: any) => void) => () => void;
  
  // GitHub repository selection
  selectGitHubRepo: (repoData: GitHubRepoData, accessToken: string) => Promise<{ workspaceId: string }>;
  
  // Sync status
  syncStatus: SyncStatus;
  syncProgress: number;
  syncError: string | null;
  syncMessage: string | null;
  resetSyncStatus: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:80/ws';
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync state management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Map to store progress update callbacks by messageId
  const progressCallbacksRef = useRef<Map<string, Set<(progress: number) => void>>>(new Map());

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Skip if we already have a connected instance
    if (globalWebSocketInstance && 
        (globalWebSocketInstance.readyState === WebSocket.OPEN || 
         globalWebSocketInstance.readyState === WebSocket.CONNECTING)) {
      console.log('[WEBSOCKET-DEBUG] Using existing connection, readyState:', globalWebSocketInstance.readyState);
      return;
    }
    
    try {
      console.log(`[WEBSOCKET-DEBUG] Connecting to ${wsUrl}...`);
      console.log(`[WEBSOCKET-DEBUG] Full WebSocket URL:`, wsUrl);
      const socket = new WebSocket(wsUrl);
      globalWebSocketInstance = socket;
      setConnectionStatus('connecting');
      
      socket.onopen = () => {
        console.log('[WEBSOCKET-DEBUG] Connection established successfully');
        setConnectionStatus('connected');
        connectionAttempts = 0;
        
        // Send a test ping immediately after connection
        try {
          const pingMessage = JSON.stringify({
            type: 'ping',
            clientTimestamp: Date.now()
          });
          socket.send(pingMessage);
          console.log('[WEBSOCKET-DEBUG] Sent initial ping after connection');
        } catch (error) {
          console.error('[WEBSOCKET-DEBUG] Error sending initial ping:', error);
        }
      };
      
      socket.onmessage = (event) => {
        console.log('[WEBSOCKET-DEBUG] Message received:', event.data);
        setLastMessage(event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log('[WEBSOCKET-DEBUG] Parsed message:', data);
          
          // Notify all listeners for this message type
          if (data.type) {
            console.log('[WEBSOCKET-DEBUG] Processing message of type:', data.type);
            const listeners = activeListeners.get(data.type);
            if (listeners) {
              console.log('[WEBSOCKET-DEBUG] Found', listeners.size, 'listeners for message type:', data.type);
              listeners.forEach(callback => {
                try {
                  callback(data);
                } catch (error) {
                  console.error(`[WEBSOCKET-DEBUG] Error in listener for ${data.type}:`, error);
                }
              });
            } else {
              console.log('[WEBSOCKET-DEBUG] No listeners found for message type:', data.type);
            }
            
            // Handle sync status updates specifically
            if (data.type === 'workspace_select_github_response') {
              console.log('[WEBSOCKET-DEBUG] Processing repository sync update:', data);
              
              // Always update the message if provided
              if (data.message) {
                console.log('[WEBSOCKET-DEBUG] Setting sync message:', data.message);
                setSyncMessage(data.message);
              }
              
              if (data.progress !== undefined) {
                console.log('[WEBSOCKET-DEBUG] Updating sync progress to', data.progress);
                setSyncProgress(data.progress);
                
                if (data.status === 'error') {
                  console.log('[WEBSOCKET-DEBUG] Setting sync status to error:', data.message);
                  setSyncStatus('error');
                  setSyncError(data.message || 'Unknown error');
                } else if (data.status === 'success') {
                  console.log('[WEBSOCKET-DEBUG] Setting sync status to synchronized');
                  setSyncStatus('synchronized');
                  setSyncProgress(100);
                } else if (data.status === 'cloning') {
                  // Update status based on progress
                  if (data.progress < 10) {
                    console.log('[WEBSOCKET-DEBUG] Setting sync status to initializing');
                    setSyncStatus('initializing');
                  } else {
                    console.log('[WEBSOCKET-DEBUG] Setting sync status to syncing');
                    setSyncStatus('syncing');
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('[WEBSOCKET-DEBUG] Error processing message:', error);
        }
      };
      
      socket.onclose = (event) => {
        console.log(`[WEBSOCKET-DEBUG] Connection closed with code ${event.code}: ${event.reason}`);
        setConnectionStatus('disconnected');
        globalWebSocketInstance = null;
        
        // When connection closes, also reset sync status to idle
        setSyncStatus('idle');
        setSyncProgress(0);
        
        // Check if we should attempt reconnection
        if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          connectionAttempts++;
          console.log(`[WEBSOCKET-DEBUG] Reconnect attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_INTERVAL}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        } else {
          console.error('[WEBSOCKET-DEBUG] Max reconnection attempts reached');
        }
      };
      
      socket.onerror = (error) => {
        console.error('[WEBSOCKET-DEBUG] Error occurred:', error);
        // Let the onclose handler deal with reconnection
      };
    } catch (error) {
      console.error('[WEBSOCKET-DEBUG] Failed to connect:', error);
      setConnectionStatus('disconnected');
      globalWebSocketInstance = null;
      
      // Attempt to reconnect
      if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        connectionAttempts++;
        console.log(`[WEBSOCKET-DEBUG] Reconnect attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_INTERVAL}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      }
    }
  }, [wsUrl]);
  
  // Initialize the WebSocket connection
  useEffect(() => {
    console.log('[WEBSOCKET-DEBUG] Initializing WebSocket connection...');
    
    // Connect on initial render
    connectWebSocket();
    
    // Clean up on unmount - only clear the timeout, don't close the connection
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // We don't close the global instance on component unmount because
      // it's meant to be shared across the application lifetime
    };
  }, [connectWebSocket]);
  
  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: string) => {
    if (globalWebSocketInstance?.readyState === WebSocket.OPEN) {
      console.log('[WEBSOCKET-DEBUG] Sending message:', message);
      globalWebSocketInstance.send(message);
      return true;
    } else {
      console.warn(`[WEBSOCKET-DEBUG] Cannot send message - not connected (state: ${globalWebSocketInstance?.readyState})`);
      // Try to reconnect
      if (!globalWebSocketInstance || globalWebSocketInstance.readyState === WebSocket.CLOSED) {
        console.log('[WEBSOCKET-DEBUG] Attempting to reconnect before sending message...');
        connectWebSocket();
        
        // Queue message to be sent when connection is established
        // This is a simple approach - for production, a more robust message queue would be better
        setTimeout(() => {
          if (globalWebSocketInstance?.readyState === WebSocket.OPEN) {
            console.log('[WEBSOCKET-DEBUG] Sending delayed message after reconnection:', message);
            globalWebSocketInstance.send(message);
            return true;
          } else {
            console.error('[WEBSOCKET-DEBUG] Failed to send message - still not connected');
            return false;
          }
        }, 1000);
      }
      return false;
    }
  }, [connectWebSocket]);
  
  // Function to force sync with a pre-defined test repository (for debugging)
  const forceSyncTestRepo = useCallback(async () => {
    console.log('[WEBSOCKET-DEBUG] Forcing test repository sync');
    
    // Reset sync status
    setSyncStatus('initializing');
    setSyncProgress(0);
    setSyncError(null);
    
    // Create message with test repository data
    const messageId = uuidv4();
    const testRepoData = {
      repoId: 123456789,
      name: 'test-repository',
      owner: 'test-user',
      url: 'https://github.com/test-user/test-repository',
      branch: 'main'
    };
    
    const message = {
      type: 'workspace_select_github',
      messageId,
      repoData: testRepoData,
      accessToken: 'test-token',
      clientTimestamp: Date.now()
    };
    
    // Send the message
    const messageSent = sendMessage(JSON.stringify(message));
    
    if (!messageSent) {
      console.error('[WEBSOCKET-DEBUG] Failed to send test sync message - not connected');
      setSyncStatus('error');
      setSyncError('Failed to send test sync message - not connected');
      return { success: false, error: 'Not connected' };
    }
    
    // Simulate response for testing UI (since backend might not respond)
    setTimeout(() => {
      console.log('[WEBSOCKET-DEBUG] Simulating sync response for testing...');
      // Initial progress
      setSyncStatus('initializing');
      setSyncProgress(5);
      
      // Simulate progress
      let progress = 5;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setSyncProgress(progress);
          setSyncStatus(progress < 10 ? 'initializing' : 'syncing');
        } else {
          clearInterval(interval);
          setSyncProgress(100);
          setSyncStatus('synchronized');
          console.log('[WEBSOCKET-DEBUG] Test sync simulation complete');
        }
      }, 1000);
    }, 500);
    
    return { success: true };
  }, [sendMessage]);
  
  // Function to force reconnection
  const reconnect = useCallback(() => {
    console.log('[WEBSOCKET] Manually initiating reconnection');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (globalWebSocketInstance) {
      try {
        globalWebSocketInstance.close(1000, 'Reconnecting...');
      } catch (err) {
        console.error('[WEBSOCKET] Error closing socket for reconnect:', err);
      }
      globalWebSocketInstance = null;
    }
    
    connectionAttempts = 0;
    connectWebSocket();
  }, [connectWebSocket]);
  
  // Function to add a message listener
  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    if (!activeListeners.has(type)) {
      activeListeners.set(type, new Set());
    }
    
    const listeners = activeListeners.get(type);
    if (listeners) {
      listeners.add(callback);
    }
    
    // Return a function to remove the listener
    return () => {
      const listeners = activeListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        
        // Clean up the map entry if there are no more listeners
        if (listeners.size === 0) {
          activeListeners.delete(type);
        }
      }
    };
  }, []);
  
  // Function to select a GitHub repository and trigger sync via WebSocket
  const selectGitHubRepo = useCallback(async (repoData: GitHubRepoData, accessToken: string): Promise<{ workspaceId: string }> => {
    // Reset sync state to initializing at 0% progress
    setSyncStatus('initializing');
    setSyncProgress(0);
    setSyncError(null);
    setSyncMessage(null);
    
    console.log('[WEBSOCKET-DEBUG] Sending repository selection request:', {
      type: 'workspace_select_github',
      messageId: 'xxx',
      repoData,
      accessToken: '[REDACTED]'
    });
    
    // Generate unique message ID
    const messageId = uuidv4();
    
    // Create the message
    const message = {
      type: 'workspace_select_github',
      messageId,
      repoData,
      accessToken,
      clientTimestamp: Date.now()
    };
    
    console.log('[WEBSOCKET-DEBUG] Sending repository selection request:', {
      ...message,
      accessToken: '[REDACTED]'
    });
    
    return new Promise((resolve, reject) => {
      // Function to handle response messages
      const handleResponse = (data: any) => {
        // Only process messages for our request
        if (data.messageId !== messageId) return;
        
        console.log('[WEBSOCKET-DEBUG] Got repository selection response:', data);
        
        if (data.status === 'error') {
          console.error('[WEBSOCKET-DEBUG] Repository selection error:', data.message);
          setSyncStatus('error');
          setSyncError(data.message || 'Repository selection failed');
          
          // Clean up both listener and timeout
          cleanupListeners();
          
          // Reject the promise
          reject(new Error(data.message || 'Repository selection failed'));
          return;
        }
        
        if (data.status === 'success') {
          console.log('[WEBSOCKET-DEBUG] Repository selection successful, workspace ID:', data.workspaceId);
          setSyncStatus('synchronized');
          setSyncProgress(100);
          
          // Clean up both listener and timeout
          cleanupListeners();
          
          // Resolve promise with workspace ID
          resolve({ workspaceId: data.workspaceId });
          return;
        }
        
        // For progress updates, just update the UI but keep listening
        if (data.status === 'cloning' && data.progress) {
          console.log(`[WEBSOCKET-DEBUG] Cloning progress: ${data.progress}%`);
        }
      };
      
      // Set timeout for request
      const timeout = setTimeout(() => {
        console.warn('[WEBSOCKET-DEBUG] Repository selection request timed out');
        cleanupListeners();
        setSyncStatus('error');
        setSyncError('Request timed out');
        reject(new Error('Repository selection request timed out'));
      }, 60000); // 1 minute timeout
      
      // Add listener for responses
      const removeListener = addMessageListener('workspace_select_github_response', handleResponse);
      
      // Create a function to clean up both the timeout and listener
      const cleanupListeners = () => {
        clearTimeout(timeout);
        removeListener();
      };
      
      // Send the request
      sendMessage(JSON.stringify(message));
    });
  }, [addMessageListener, sendMessage]);
  
  // Function to reset sync status
  const resetSyncStatus = useCallback(() => {
    setSyncStatus('idle');
    setSyncProgress(0);
    setSyncError(null);
    setSyncMessage(null);
  }, []);
  
  // Context value
  const contextValue: WebSocketContextType = {
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect,
    addMessageListener,
    selectGitHubRepo,
    syncStatus,
    syncProgress,
    syncError,
    syncMessage,
    resetSyncStatus
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
} 