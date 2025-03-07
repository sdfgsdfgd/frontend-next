"use client";

import { useState, createContext, ReactNode } from "react";
import { useWorkspace, Workspace } from "@/app/context/WorkspaceContext";

// Create a context for app controller functions
interface AppControllerContextType {
  openAuthModal: () => void;
  openWorkspaceSelector: () => void;
  isAuthModalOpen: boolean;
  isWorkspaceSelectorOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  setIsWorkspaceSelectorOpen: (isOpen: boolean) => void;
}

export const AppControllerContext = createContext<AppControllerContextType>({
  openAuthModal: () => {},
  openWorkspaceSelector: () => {},
  isAuthModalOpen: false,
  isWorkspaceSelectorOpen: false,
  setIsAuthModalOpen: () => {},
  setIsWorkspaceSelectorOpen: () => {}
});

// Add a provider component for easier context consumption
interface AppControllerProviderProps {
  children: ReactNode;
}

export const AppControllerProvider = ({ children }: AppControllerProviderProps) => {
  const { setWorkspace } = useWorkspace();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  
  const handleSelectWorkspace = (selectedWorkspace: Workspace) => {
    setWorkspace(selectedWorkspace);
    setIsWorkspaceSelectorOpen(false);
  };
  
  const openAuthModal = () => setIsAuthModalOpen(true);
  const openWorkspaceSelector = () => setIsWorkspaceSelectorOpen(true);
  
  return (
    <AppControllerContext.Provider
      value={{
        openAuthModal,
        openWorkspaceSelector,
        isAuthModalOpen,
        isWorkspaceSelectorOpen,
        setIsAuthModalOpen,
        setIsWorkspaceSelectorOpen
      }}
    >
      {children}
    </AppControllerContext.Provider>
  );
}; 