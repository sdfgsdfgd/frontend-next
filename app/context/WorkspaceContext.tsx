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
  
  // Load saved workspace on initial mount - client-side only
  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (savedWorkspace) {
        setWorkspaceState(JSON.parse(savedWorkspace));
      }
    } catch (err) {
      console.error("Error loading workspace from localStorage:", err);
    }
    // Mark as initialized after checking localStorage
    setIsInitialized(true);
  }, []);
  
  // Enhanced setWorkspace function that also persists to localStorage
  const setWorkspace = (newWorkspace: Workspace | null) => {
    setWorkspaceState(newWorkspace);
    
    // Skip localStorage during SSR
    if (typeof window === 'undefined') return;
    
    try {
      if (newWorkspace) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(newWorkspace));
      } else {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Error saving workspace to localStorage:", err);
    }
  };
  
  // Helper to clear the workspace
  const clearWorkspace = () => setWorkspace(null);
  
  const isWorkspaceSelected = workspace !== null;
  
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