"use client";

import { useWebSocketContext, ContainerStatus, ContainerOutputMessage } from '../context/WebSocketContext';
import { useCallback, useEffect, useState } from 'react';

export interface UseContainerReturn {
  // State
  status: ContainerStatus;
  output: ContainerOutputMessage[];
  error: string | null;
  isWaitingForInput: boolean;
  isRunning: boolean;
  
  // Methods
  startContainer: (scriptOptions?: string) => Promise<void>;
  sendInput: (input: string) => Promise<void>;
  stopContainer: () => Promise<void>;
  resetContainer: () => void;
  
  // Utility
  detectInputPrompt: (content: string) => boolean;
}

export function useContainer(): UseContainerReturn {
  const { 
    containerStatus, 
    containerOutput, 
    containerError, 
    inputRequired,
    startArcanaContainer,
    sendContainerInput,
    stopContainer: stopWSContainer,
    resetContainerState
  } = useWebSocketContext();
  
  // Derived state
  const isRunning = containerStatus === 'running' || containerStatus === 'starting' || containerStatus === 'input_needed';
  
  // Detect if output contains the special input marker
  const detectInputPrompt = useCallback((content: string): boolean => {
    return content.includes('`````INPUT`````') || content.includes('`````INPUT');
  }, []);
  
  // Start container with optional script options
  const startContainer = useCallback(async (scriptOptions?: string): Promise<void> => {
    try {
      await startArcanaContainer(scriptOptions);
      return Promise.resolve();
    } catch (error) {
      console.error('[CONTAINER-HOOK] Failed to start container:', error);
      return Promise.reject(error);
    }
  }, [startArcanaContainer]);
  
  // Send input to container
  const sendInput = useCallback(async (input: string): Promise<void> => {
    try {
      await sendContainerInput(input);
      return Promise.resolve();
    } catch (error) {
      console.error('[CONTAINER-HOOK] Failed to send input:', error);
      return Promise.reject(error);
    }
  }, [sendContainerInput]);
  
  // Stop container
  const stopContainer = useCallback(async (): Promise<void> => {
    try {
      await stopWSContainer();
      return Promise.resolve();
    } catch (error) {
      console.error('[CONTAINER-HOOK] Failed to stop container:', error);
      return Promise.reject(error);
    }
  }, [stopWSContainer]);
  
  return {
    status: containerStatus,
    output: containerOutput,
    error: containerError,
    isWaitingForInput: inputRequired,
    isRunning,
    startContainer,
    sendInput,
    stopContainer,
    resetContainer: resetContainerState,
    detectInputPrompt
  };
}

export default useContainer; 