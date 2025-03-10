"use client";

import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";
import { useEffect, useState } from "react";
import AIChatComponent from './components/AIChatComponent';
import Header from './components/Header';
import GlassOverlay from "./components/ui/GlassOverlay";
import AuthCard from "./components/auth/AuthCard";
import WorkspaceCard from "./components/workspace/WorkspaceCard";
import { ModalControlContext } from "./context/ModalContext";
import ContentSyncEffect from "./components/ui/ContentSyncEffect";
import SessionDebug from "./components/auth/SessionDebug";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { workspace, isWorkspaceSelected, clearWorkspace, setWorkspace } = useWorkspace();
  
  // State for controlling modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  
  // Debug log auth state on mount and changes
  useEffect(() => {
    console.log('[HOME] Auth state:', {
      isAuthenticated,
      isLoading,
      hasWorkspace: isWorkspaceSelected
    });
  }, [isAuthenticated, isLoading, isWorkspaceSelected]);
  
  // Try to restore workspace from localStorage if necessary
  useEffect(() => {
    if (isAuthenticated && !isWorkspaceSelected) {
      // Check if we have completed GitHub auth recently
      const authCompleted = localStorage.getItem('github-auth-completed');
      
      if (authCompleted === 'true') {
        console.log('[HOME] Authentication completed, checking for workspace');
        localStorage.removeItem('github-auth-completed');
        
        // Try to get GitHub repos from localStorage or fetch them
        const fetchWorkspaces = async () => {
          try {
            const token = localStorage.getItem('github-access-token');
            if (!token) return;
            
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            if (response.ok) {
              const repos = await response.json();
              
              if (Array.isArray(repos) && repos.length > 0) {
                console.log('[HOME] GitHub repos found, auto-selecting first repo as workspace');
                
                // Select the first GitHub repo as workspace
                const firstRepo = repos[0];
                setWorkspace({
                  type: "github",
                  id: firstRepo.id,
                  name: firstRepo.name,
                  url: firstRepo.html_url,
                  description: firstRepo.description
                });
                
                // Ensure workspace selector is closed
                setIsWorkspaceSelectorOpen(false);
              }
            }
          } catch (error) {
            console.error('[HOME] Error fetching repos:', error);
          }
        };
        
        fetchWorkspaces();
      }
    }
  }, [isAuthenticated, isWorkspaceSelected, setWorkspace]);
  
  // Determine what overlay to show based on auth state and workspace selection
  useEffect(() => {
    if (isLoading) {
      // Wait for auth status to stabilize
      return;
    }
    
    if (!isAuthenticated) {
      // Show auth overlay if not authenticated
      console.log('[HOME] Not authenticated, showing auth modal');
      setIsAuthModalOpen(true);
      setIsWorkspaceSelectorOpen(false);
      
      // Clear workspace if user is not authenticated (logged out)
      clearWorkspace();
    } else if (!isWorkspaceSelected) {
      // Show workspace overlay if authenticated but no workspace
      console.log('[HOME] Authenticated but no workspace, showing workspace selector');
      setIsAuthModalOpen(false);
      setIsWorkspaceSelectorOpen(true);
    } else {
      // Hide all overlays when user is authenticated and has selected a workspace
      console.log('[HOME] Authenticated with workspace, showing main content');
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
          
          {/* Session debug panel */}
          <SessionDebug />
        </div>
      </ContentSyncEffect>
    </ModalControlContext.Provider>
  );
}
