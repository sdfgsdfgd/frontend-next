"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// LocalStorage key
const WORKSPACE_STORAGE_KEY = "arcana_selected_workspace";

export interface Workspace {
  type: "github" | "local";
  id?: string | number;
  name: string;
  path?: string;
  url?: string;
  description?: string;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  setWorkspace: (workspace: Workspace | null) => void;
  isWorkspaceSelected: boolean;
  clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  // Initialize with null, will be populated from localStorage in useEffect
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  // This will always start as false for server and client to ensure matching hydration
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Log initial state
  useEffect(() => {
    console.log('[WORKSPACE] Initial state:', { workspace, isInitialized });
  }, []);
  
  // Load saved workspace on initial mount - client-side only
  useEffect(() => {
    try {
      console.log('[WORKSPACE] Checking localStorage for saved workspace');
      const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      
      if (savedWorkspace) {
        console.log('[WORKSPACE] Found saved workspace in localStorage');
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspaceState(parsedWorkspace);
        console.log('[WORKSPACE] Set workspace from localStorage:', parsedWorkspace);
      } else {
        console.log('[WORKSPACE] No saved workspace found in localStorage');
      }
    } catch (err) {
      console.error("[WORKSPACE] Error loading workspace from localStorage:", err);
    }
    // Mark as initialized after checking localStorage
    setIsInitialized(true);
    console.log('[WORKSPACE] Marked as initialized');
  }, []);
  
  // Enhanced setWorkspace function that also persists to localStorage
  const setWorkspace = (newWorkspace: Workspace | null) => {
    console.log('[WORKSPACE] setWorkspace called with:', newWorkspace);
    setWorkspaceState(newWorkspace);
    
    // Skip localStorage during SSR
    if (typeof window === 'undefined') return;
    
    try {
      if (newWorkspace) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(newWorkspace));
        console.log('[WORKSPACE] Saved workspace to localStorage');
      } else {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        console.log('[WORKSPACE] Removed workspace from localStorage');
      }
    } catch (err) {
      console.error("[WORKSPACE] Error saving workspace to localStorage:", err);
    }
  };
  
  // Helper to clear the workspace
  const clearWorkspace = () => {
    console.log('[WORKSPACE] clearWorkspace called');
    setWorkspace(null);
  };
  
  const isWorkspaceSelected = workspace !== null;
  
  // Log when workspace state changes
  useEffect(() => {
    console.log('[WORKSPACE] State changed:', {
      workspace,
      isWorkspaceSelected,
      isInitialized
    });
  }, [workspace, isWorkspaceSelected, isInitialized]);
  
  // Ensure consistent rendering between server and client to avoid hydration mismatch
  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspace, 
        setWorkspace,
        isWorkspaceSelected,
        clearWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
} 