"use client";

import { useSession } from "next-auth/react";
import { useWorkspace } from "./context/WorkspaceContext";
import { useEffect, useState } from "react";
import AIChatComponent from './components/AIChatComponent';
import Header from './components/Header';
import GlassOverlay from "./components/ui/GlassOverlay";
import AuthCard from "./components/auth/AuthCard";
import WorkspaceCard from "./components/workspace/WorkspaceCard";
import { ModalControlContext } from "./context/ModalContext";
import ContentSyncEffect from "./components/ui/ContentSyncEffect";

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const { isWorkspaceSelected, clearWorkspace } = useWorkspace();
  
  // State for controlling modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  
  const isAuthenticated = authStatus === "authenticated";
  const isLoading = authStatus === "loading";
  
  // Determine what overlay to show based on auth state and workspace selection
  useEffect(() => {
    if (isLoading) {
      // Wait for auth to load
      return;
    }
    
    if (!isAuthenticated) {
      // Show auth overlay if not authenticated
      setIsAuthModalOpen(true);
      setIsWorkspaceSelectorOpen(false);
      
      // Clear workspace if user is not authenticated (logged out)
      clearWorkspace();
    } else if (!isWorkspaceSelected) {
      // Show workspace overlay if authenticated but no workspace
      setIsAuthModalOpen(false);
      setIsWorkspaceSelectorOpen(true);
    } else {
      // Hide all overlays when user is authenticated and has selected a workspace
      setIsAuthModalOpen(false);
      setIsWorkspaceSelectorOpen(false);
    }
  }, [isAuthenticated, isWorkspaceSelected, isLoading, clearWorkspace]);
  
  // We use this single page approach with overlays to avoid page transitions
  return (
    <ModalControlContext.Provider 
      value={{
        isAuthModalOpen,
        isWorkspaceSelectorOpen,
        setAuthModalOpen: setIsAuthModalOpen,
        setWorkspaceSelectorOpen: setIsWorkspaceSelectorOpen
      }}
    >
      <ContentSyncEffect>
        <div className="flex-1 flex flex-col min-h-0 max-w-full">
          {/* Header is always visible */}
          <Header />
          
          {/* Chat area with overlays */}
          <div className="flex-1 relative overflow-hidden">
            {/* The chat component with conditional opacity */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${(!isAuthenticated || !isWorkspaceSelected) ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <AIChatComponent />
            </div>
            
            {/* Authentication Overlay */}
            <GlassOverlay 
              isVisible={isAuthModalOpen} 
              blurIntensity={3}
              overlayOpacity={0.2}
            >
              <AuthCard onClose={() => setIsAuthModalOpen(false)} />
            </GlassOverlay>
            
            {/* Workspace Selection Overlay */}
            <GlassOverlay 
              isVisible={isWorkspaceSelectorOpen}
              blurIntensity={3}
              overlayOpacity={0.2}
            >
              <WorkspaceCard onClose={() => setIsWorkspaceSelectorOpen(false)} />
            </GlassOverlay>
          </div>
        </div>
      </ContentSyncEffect>
    </ModalControlContext.Provider>
  );
}
