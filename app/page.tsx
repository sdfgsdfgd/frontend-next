"use client";

import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";
import { useEffect, useState } from "react";
import useOpenAI from "./hooks/useOpenAI";
import AIChatComponent from './components/AIChatComponent';
import Header from './components/Header';
import GlassOverlay from "./components/ui/GlassOverlay";
import AuthCard from "./components/auth/AuthCard";
import WorkspaceCard from "./components/workspace/WorkspaceCard";
import ApiKeyCard from "./components/openai/ApiKeyCard";
import { ModalControlContext } from "./context/ModalContext";
import ContentSyncEffect from "./components/ui/ContentSyncEffect";
import SessionDebug from "./components/auth/SessionDebug";
import { OpenAIProvider } from "./context/OpenAIContext";

export default function Home() {
  const {isAuthenticated, isLoading, token} = useAuth();
  const {workspace, isWorkspaceSelected, clearWorkspace, setWorkspace} = useWorkspace();

  // State for controlling modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Debug log on mount
  useEffect(() => {
    console.log('[HOME] Initial render', {
      isAuthenticated,
      isLoading,
      hasToken: !!token,
      isWorkspaceSelected,
      localStorage: {
        token: !!localStorage.getItem('github-access-token'),
        user: !!localStorage.getItem('github-user')
      }
    });
  }, []);

  // Debug log auth state on changes
  useEffect(() => {
    console.log('[HOME] Auth state changed:', {
      isAuthenticated,
      isLoading,
      hasToken: !!token,
      hasWorkspace: isWorkspaceSelected,
      shouldRenderChat: isAuthenticated && isWorkspaceSelected,
      overlays: {
        auth: isAuthModalOpen,
        workspace: isWorkspaceSelectorOpen,
        apiKey: isApiKeyModalOpen
      }
    });
  }, [isAuthenticated, isLoading, token, isWorkspaceSelected, isAuthModalOpen, isWorkspaceSelectorOpen, isApiKeyModalOpen]);

  // Try to restore workspace from localStorage if necessary
  useEffect(() => {
    if (isAuthenticated && !isWorkspaceSelected) {
      // Check if we have completed GitHub auth recently
      const authCompleted = localStorage.getItem('github-auth-completed');

      if (authCompleted === 'true' || (isAuthenticated && token)) {
        console.log('[HOME] Authentication confirmed, checking for workspace');

        if (authCompleted === 'true') {
          localStorage.removeItem('github-auth-completed');
        }

        // Try to get GitHub repos using the token from auth context
        const fetchWorkspaces = async () => {
          try {
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
  }, [isAuthenticated, isWorkspaceSelected, token, setWorkspace]);

  return (
    <OpenAIProvider>
      <OpenAIWrapper 
        isAuthModalOpen={isAuthModalOpen}
        isWorkspaceSelectorOpen={isWorkspaceSelectorOpen}
        isApiKeyModalOpen={isApiKeyModalOpen}
        setAuthModalOpen={setIsAuthModalOpen}
        setWorkspaceSelectorOpen={setIsWorkspaceSelectorOpen}
        setApiKeyModalOpen={setIsApiKeyModalOpen}
        isAuthenticated={isAuthenticated}
        isWorkspaceSelected={isWorkspaceSelected}
        isLoading={isLoading}
        clearWorkspace={clearWorkspace}
      />
    </OpenAIProvider>
  );
}

// Separate component to use the OpenAI context
interface OpenAIWrapperProps {
  isAuthModalOpen: boolean;
  isWorkspaceSelectorOpen: boolean;
  isApiKeyModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  setWorkspaceSelectorOpen: (isOpen: boolean) => void;
  setApiKeyModalOpen: (isOpen: boolean) => void;
  isAuthenticated: boolean;
  isWorkspaceSelected: boolean;
  isLoading: boolean;
  clearWorkspace: () => void;
}

function OpenAIWrapper({
  isAuthModalOpen,
  isWorkspaceSelectorOpen,
  isApiKeyModalOpen,
  setAuthModalOpen,
  setWorkspaceSelectorOpen,
  setApiKeyModalOpen,
  isAuthenticated,
  isWorkspaceSelected,
  isLoading,
  clearWorkspace
}: OpenAIWrapperProps) {
  const { hasApiKey } = useOpenAI();

  // Determine what overlay to show based on auth state, workspace selection, and API key
  useEffect(() => {
    // Skip updates if still loading authentication state
    if (isLoading) {
      console.log('[HOME] Still loading auth state, skipping overlay updates');
      return;
    }

    if (!isAuthenticated) {
      // Show auth overlay if not authenticated
      console.log('[HOME] Not authenticated, showing auth modal');
      setAuthModalOpen(true);
      setWorkspaceSelectorOpen(false);
      setApiKeyModalOpen(false);

      // Clear workspace if user is not authenticated (logged out)
      clearWorkspace();
    } else if (!isWorkspaceSelected) {
      // Show workspace overlay if authenticated but no workspace
      console.log('[HOME] Authenticated but no workspace, showing workspace selector');
      setAuthModalOpen(false);
      setWorkspaceSelectorOpen(true);
      setApiKeyModalOpen(false);
    } else if (!hasApiKey) {
      // Show API key overlay if authenticated and has workspace but no API key
      console.log('[HOME] Authenticated with workspace but no API key, showing API key modal');
      setAuthModalOpen(false);
      setWorkspaceSelectorOpen(false);
      setApiKeyModalOpen(true);
    } else {
      // Hide all overlays when user is authenticated, has selected a workspace, and has API key
      console.log('[HOME] Authenticated with workspace and API key, showing main content');
      setAuthModalOpen(false);
      setWorkspaceSelectorOpen(false);
      setApiKeyModalOpen(false);
    }
  }, [isAuthenticated, isWorkspaceSelected, hasApiKey, isLoading, clearWorkspace]);

  // We use this single page approach with overlays to avoid page transitions
  return (
    <ModalControlContext.Provider
      value={{
        isAuthModalOpen,
        isWorkspaceSelectorOpen,
        isApiKeyModalOpen,
        setAuthModalOpen,
        setWorkspaceSelectorOpen,
        setApiKeyModalOpen
      }}
    >
      <ContentSyncEffect>
        <div className="flex-1 flex flex-col max-w-full h-full">
          {/* Header is always visible */}
          <Header/>

          {/* Chat area with overlays */}
          <div className="flex-1 relative overflow-hidden h-full">
            {/* The chat component - only shown when user is authenticated, has workspace, and has API key */}
            <div className="flex-1 relative overflow-hidden h-full">
              {isAuthenticated && isWorkspaceSelected && hasApiKey && (
                <AIChatComponent/>
              )}
            </div>

            {/* Authentication Overlay */}
            <GlassOverlay
              isVisible={isAuthModalOpen}
              blurIntensity={3}
              overlayOpacity={0.2}
            >
              <AuthCard onClose={() => setAuthModalOpen(false)}/>
            </GlassOverlay>

            {/* Workspace Selection Overlay */}
            <GlassOverlay
              isVisible={isWorkspaceSelectorOpen}
              blurIntensity={3}
              overlayOpacity={0.2}
            >
              <WorkspaceCard onClose={() => setWorkspaceSelectorOpen(false)}/>
            </GlassOverlay>

            {/* API Key Overlay */}
            <GlassOverlay
              isVisible={isApiKeyModalOpen}
              blurIntensity={3}
              overlayOpacity={0.2}
            >
              <ApiKeyCard onClose={() => setApiKeyModalOpen(false)}/>
            </GlassOverlay>
          </div>

          {/* Session debug panel */}
          <SessionDebug/>
        </div>
      </ContentSyncEffect>
    </ModalControlContext.Provider>
  );
}
