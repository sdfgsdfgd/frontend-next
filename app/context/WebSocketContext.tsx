"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useOpenAI } from './OpenAIContext';

// ---------------------------
//  Singleton & State
// ---------------------------
let globalWebSocketInstance: WebSocket | null = null;
let activeListeners: Map<string, Set<(data: any) => void>> = new Map();
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

// ---------------------------
//  Type Definitions
// ---------------------------
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type SyncStatus = 'idle' | 'initializing' | 'syncing' | 'synchronized' | 'error';
export type ContainerStatus = 'idle' | 'starting' | 'running' | 'input_needed' | 'error' | 'exited';

export interface ContainerOutputMessage {
  type: 'output' | 'error' | 'input';
  content: string;
  timestamp: number;
}

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

  // Container management
  containerStatus: ContainerStatus;
  containerOutput: ContainerOutputMessage[];
  containerError: string | null;
  inputRequired: boolean;
  startArcanaContainer: (scriptOptions?: string) => Promise<void>;
  sendContainerInput: (input: string) => Promise<void>;
  stopContainer: () => Promise<void>;
  resetContainerState: () => void;
}

// ---------------------------
//  Context & Hook
// ---------------------------
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

// ---------------------------
//  Provider Component
// ---------------------------
export function WebSocketProvider({children}: { children: ReactNode }) {
  const { apiKey } = useOpenAI();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:80/ws';
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Container state management
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>('idle');
  const [containerOutput, setContainerOutput] = useState<ContainerOutputMessage[]>([]);
  const [containerError, setContainerError] = useState<string | null>(null);
  const [inputRequired, setInputRequired] = useState(false);

  // Track # of container messages for debug
  const containerMsgCountRef = useRef<{ total: number; unique: Set<string> }>({
    total: 0,
    unique: new Set<string>()
  });

  // ---------------------------
  //  Internal WS Connection
  // ---------------------------
  const connectWebSocket = useCallback(() => {
    // If we already have an OPEN or CONNECTING socket, do nothing
    if (globalWebSocketInstance &&
      (globalWebSocketInstance.readyState === WebSocket.OPEN ||
        globalWebSocketInstance.readyState === WebSocket.CONNECTING)) {
      console.log('[WEBSOCKET-DEBUG] Using existing connection, readyState:', globalWebSocketInstance.readyState);
      return;
    }

    try {
      console.log(`[WEBSOCKET-DEBUG] Connecting to ${wsUrl}...`);
      console.log('[WEBSOCKET-DEBUG] Full WebSocket URL:', wsUrl);

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

        // Reset sync status
        setSyncStatus('idle');
        setSyncProgress(0);

        // Attempt reconnection if we haven't exceeded attempts
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
        // onclose will handle reconnect
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
      // We do NOT close the global WS instance here, so that it can remain valid across pages.
    };
  }, [connectWebSocket]);

  // ---------------------------
  //  sendMessage
  // ---------------------------
  const sendMessage = useCallback((message: string) => {
    if (globalWebSocketInstance?.readyState === WebSocket.OPEN) {
      console.log('[WEBSOCKET-DEBUG] Sending message:', message);
      globalWebSocketInstance.send(message);
      return true;
    } else {
      console.warn(
        `[WEBSOCKET-DEBUG] Cannot send message - not connected (state: ${globalWebSocketInstance?.readyState})`
      );
      // Attempt reconnect
      if (!globalWebSocketInstance || globalWebSocketInstance.readyState === WebSocket.CLOSED) {
        console.log('[WEBSOCKET-DEBUG] Attempting to reconnect before sending message...');
        connectWebSocket();

        // Simple delayed send attempt
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


  // ---------------------------
  //  Reconnect
  // ---------------------------
  const reconnect = useCallback(() => {
    console.log('[WEBSOCKET-DEBUG] Manually initiating reconnection');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (globalWebSocketInstance) {
      try {
        globalWebSocketInstance.close(1000, 'Reconnecting...');
      } catch (err) {
        console.error('[WEBSOCKET-DEBUG] Error closing socket for reconnect:', err);
      }
      globalWebSocketInstance = null;
    }

    connectionAttempts = 0;
    connectWebSocket();
  }, [connectWebSocket]);

  // ---------------------------
  //  addMessageListener
  // ---------------------------
  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    if (!activeListeners.has(type)) {
      activeListeners.set(type, new Set());
    }

    const listeners = activeListeners.get(type);
    if (listeners) {
      listeners.add(callback);
    }

    // Return a cleanup function
    return () => {
      const lst = activeListeners.get(type);
      if (lst) {
        lst.delete(callback);
        if (lst.size === 0) {
          activeListeners.delete(type);
        }
      }
    };
  }, []);

  // ---------------------------
  //  selectGitHubRepo
  // ---------------------------
  const selectGitHubRepo = useCallback(
    async (repoData: GitHubRepoData, accessToken: string): Promise<{ workspaceId: string }> => {
      // Reset sync state
      setSyncStatus('initializing');
      setSyncProgress(0);
      setSyncError(null);
      setSyncMessage(null);

      console.log('[WEBSOCKET-DEBUG] Sending repository selection request (GitHub)...');

      // Generate unique message ID
      const messageId = uuidv4();
      const message = {
        type: 'workspace_select_github',
        messageId,
        repoData,
        accessToken,
        clientTimestamp: Date.now()
      };

      return new Promise((resolve, reject) => {
        // Handle response
        const handleResponse = (data: any) => {
          if (data.messageId !== messageId) return;

          console.log('[WEBSOCKET-DEBUG] Got repository selection response:', data);

          if (data.status === 'error') {
            console.error('[WEBSOCKET-DEBUG] Repository selection error:', data.message);
            setSyncStatus('error');
            setSyncError(data.message || 'Repository selection failed');
            cleanupListeners();
            reject(new Error(data.message || 'Repository selection failed'));
            return;
          }

          if (data.status === 'success') {
            console.log('[WEBSOCKET-DEBUG] Repository selection successful:', data);
            setSyncStatus('synchronized');
            setSyncProgress(100);
            cleanupListeners();
            resolve({workspaceId: data.workspaceId});
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

        // Add listener & send
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

  // ---------------------------
  //  resetSyncStatus
  // ---------------------------
  const resetSyncStatus = useCallback(() => {
    setSyncStatus('idle');
    setSyncProgress(0);
    setSyncError(null);
    setSyncMessage(null);
  }, []);

  // ---------------------------
  //  Container: Incoming
  // ---------------------------
  useEffect(() => {
    // Listen for container_response messages
    const removeListener = addMessageListener('container_response', (data) => {
      console.log('[WEBSOCKET-DEBUG] Container response received:', data);

      // Increment counters
      containerMsgCountRef.current.total++;
      const contentHash = data.output ? `${data.status}:${data.output.substring(0, 100)}` : `${data.status}:no-content`;
      containerMsgCountRef.current.unique.add(contentHash);

      console.log('[WEBSOCKET-DEBUG] Container details:', {
        messageId: data.messageId,
        status: data.status,
        timestamp: data.serverTimestamp,
        outputPreview: data.output ? data.output.substring(0, 50) : null,
        outputLength: data.output ? data.output.length : 0,
        totalMsgCount: containerMsgCountRef.current.total,
        uniqueMsgCount: containerMsgCountRef.current.unique.size,
        contentHash
      });

      // Input needed?
      const hasInputMarker = data.output && (data.output.includes('`````INPUT`````') || data.output.includes('`````INPUT'));
      if (data.status === 'input_needed' || hasInputMarker) {
        console.log('[WEBSOCKET-DEBUG] Input required detected:', {
          fromStatus: data.status === 'input_needed',
          fromMarker: hasInputMarker,
          markerContent: hasInputMarker ? data.output?.substring(0, 100) : null
        });
        setInputRequired(true);
      } else {
        setInputRequired(false);
      }
      
      // Also update container status for input markers in output content
      if (hasInputMarker) {
        console.log('[WEBSOCKET-DEBUG] Setting containerStatus to input_needed due to marker');
        setContainerStatus('input_needed');
      } else {
        setContainerStatus(data.status);
      }

      // Error?
      if (data.status === 'error') {
        setContainerError(data.output || 'Unknown error');
      }

      // Append output
      if (data.output) {
        const msgType =
          data.status === 'error'
            ? 'error'
            : data.status === 'input_needed'
              ? 'input'
              : 'output';

        setContainerOutput((prev) => [
          ...prev,
          {
            type: msgType,
            content: data.output,
            timestamp: data.serverTimestamp || Date.now()
          }
        ]);
      }
    });

    return () => removeListener();
  }, [addMessageListener]);

  // ---------------------------
  //  startArcanaContainer
  // ---------------------------
  const startArcanaContainer = useCallback(async (scriptOptions?: string): Promise<void> => {
    // Reset container state
    setContainerStatus('starting');
    setContainerOutput([]);
    setContainerError(null);
    setInputRequired(false);

    console.log('[WEBSOCKET-DEBUG] Starting Arcana container with options:', scriptOptions);

    // Generate unique message ID
    const messageId = uuidv4();

    // Create message
    const message = {
      type: 'arcana_start',
      messageId,
      script: scriptOptions,
      openaiApiKey: apiKey,
      clientTimestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      // We only care about the immediate "starting" or "error".
      const handleResponse = (data: any) => {
        // Only handle messages with our matching messageId
        if (data.messageId !== messageId) return;

        if (data.status === 'starting') {
          console.log('[WEBSOCKET-DEBUG] Container starting successfully');
          removeListener();
          resolve(); // Container is accepted/started
        } else if (data.status === 'error') {
          console.error('[WEBSOCKET-DEBUG] Container start error:', data.output);
          removeListener();
          reject(new Error(data.output || 'Failed to start container'));
        }
      };

      const removeListener = addMessageListener('container_response', handleResponse);

      // Send the request
      const success = sendMessage(JSON.stringify(message));

      if (!success) {
        removeListener();
        setContainerStatus('error');
        setContainerError('Failed to send container start request - not connected');
        reject(new Error('Not connected'));
      }
    });
  }, [addMessageListener, sendMessage, apiKey]);

  // ---------------------------
  //  sendContainerInput
  // ---------------------------
  const sendContainerInput = useCallback(async (input: string): Promise<void> => {
    if (containerStatus !== 'input_needed') {
      console.warn('[WEBSOCKET-DEBUG] Cannot send input - container not waiting for input');
      return Promise.reject(new Error('Container not waiting for input'));
    }

    console.log('[WEBSOCKET-DEBUG] Sending input to container:', input);

    // Reset input required flag
    setInputRequired(false);

    // Generate unique message ID
    const messageId = uuidv4();

    // Create message
    const message = {
      type: 'container_input',
      messageId,
      input,
      clientTimestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      // Add input message to output
      setContainerOutput(prev => [
        ...prev,
        {
          type: 'input',
          content: input,
          timestamp: Date.now()
        }
      ]);

      // Function to handle response
      const handleResponse = (data: any) => {
        // Only process messages for our request
        if (data.messageId !== messageId) return;

        if (data.status === 'running' || data.status === 'input_needed') {
          console.log('[WEBSOCKET-DEBUG] Input sent successfully');
          removeListener();
          resolve();
        } else if (data.status === 'error') {
          console.error('[WEBSOCKET-DEBUG] Input error:', data.output);
          removeListener();
          reject(new Error(data.output || 'Failed to send input'));
        }
      };

      // Set timeout for input request
      const timeout = setTimeout(() => {
        console.warn('[WEBSOCKET-DEBUG] Input request timed out');
        removeListener();
        reject(new Error('Input request timed out'));
      }, 10000); // 10 second timeout

      // Add listener for responses
      const removeListener = addMessageListener('container_response', handleResponse);

      // Send the request
      const success = sendMessage(JSON.stringify(message));

      if (!success) {
        clearTimeout(timeout);
        removeListener();
        reject(new Error('Not connected'));
      }
    });
  }, [containerStatus, addMessageListener, sendMessage]);

  // Stop container
  const stopContainer = useCallback(async (): Promise<void> => {
    if (containerStatus === 'idle' || containerStatus === 'exited') {
      console.log('[WEBSOCKET-DEBUG] Container already stopped');
      return Promise.resolve();
    }

    console.log('[WEBSOCKET-DEBUG] Stopping container');

    // Generate unique message ID
    const messageId = uuidv4();

    // Create message
    const message = {
      type: 'container_stop',
      messageId,
      clientTimestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      // Function to handle response
      const handleResponse = (data: any) => {
        // Only process messages for our request
        if (data.messageId !== messageId) return;

        if (data.status === 'exited') {
          console.log('[WEBSOCKET-DEBUG] Container stopped successfully');
          setContainerStatus('exited');
          removeListener();
          resolve();
        } else if (data.status === 'error') {
          console.error('[WEBSOCKET-DEBUG] Stop error:', data.output);
          removeListener();
          reject(new Error(data.output || 'Failed to stop container'));
        }
      };

      // Set timeout for stop request
      const timeout = setTimeout(() => {
        console.warn('[WEBSOCKET-DEBUG] Stop request timed out');
        removeListener();
        reject(new Error('Stop request timed out'));
      }, 10000); // 10 second timeout

      // Add listener for responses
      const removeListener = addMessageListener('container_response', handleResponse);

      // Send the request
      const success = sendMessage(JSON.stringify(message));

      if (!success) {
        clearTimeout(timeout);
        removeListener();
        reject(new Error('Not connected'));
      }
    });
  }, [containerStatus, addMessageListener, sendMessage]);

  // ---------------------------
  //  resetContainerState
  // ---------------------------
  const resetContainerState = useCallback(() => {
    setContainerStatus('idle');
    setContainerOutput([]);
    setContainerError(null);
    setInputRequired(false);
  }, []);

  // ---------------------------
  //  Context Value
  // ---------------------------
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
    resetSyncStatus,
    // Container functionality
    containerStatus,
    containerOutput,
    containerError,
    inputRequired,
    startArcanaContainer,
    sendContainerInput,
    stopContainer,
    resetContainerState
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}