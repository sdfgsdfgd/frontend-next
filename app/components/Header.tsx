"use client";

import { useState, useEffect, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSidebar } from "../context/SidebarContext";
import { ModalControlContext } from "../context/ModalContext";
import { FaGithub, FaUser } from "react-icons/fa";

// Helper to check if user likely has a session based on cookies
const hasLikelySession = () => {
  if (typeof window === 'undefined') return false;
  return document.cookie.includes('next-auth.session-token');
};

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { workspace, isWorkspaceSelected } = useWorkspace();
  const { toggleSidebar, isOpen } = useSidebar();
  const { setAuthModalOpen } = useContext(ModalControlContext);
  const [hasSidebarChanged, setHasSidebarChanged] = useState(false);
  
  // Track sidebar changes for animation
  useEffect(() => {
    setHasSidebarChanged(true);
    const timer = setTimeout(() => setHasSidebarChanged(false), 500);
    return () => clearTimeout(timer);
  }, [isOpen]);
  
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side with logo and workspace info */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-700 transition mr-2"
            aria-label="Toggle sidebar"
          >
            <FaUser className="text-gray-300" />
          </button>
          
          <div className={`
            flex items-center space-x-4 transition-transform duration-500
            ${hasSidebarChanged ? 'scale-105' : 'scale-100'}
            ${isOpen ? 'translate-x-2' : '-translate-x-1'}
          `}>
            <h1 className="text-xl font-bold text-white">Arcana</h1>
          </div>
        </div>
        
        {/* Right side with auth and workspace controls */}
        <div className="flex items-center space-x-3">
          {/* Workspace indicator */}
          {isWorkspaceSelected && workspace && (
            <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-700 rounded-full">
              <span className="text-sm text-gray-200 max-w-[150px] truncate">
                {workspace.name}
              </span>
            </div>
          )}
          
          {/* Auth button */}
          <div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isAuthenticated 
                  ? "bg-gray-700 hover:bg-gray-600" 
                  : "bg-blue-600 hover:bg-blue-500"
              } transition-all duration-300 ease-in-out`}
            >
              {isAuthenticated ? (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                    {user?.login?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm truncate max-w-[100px]">
                    {user?.name || user?.login || "User"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FaGithub className="mr-2" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 