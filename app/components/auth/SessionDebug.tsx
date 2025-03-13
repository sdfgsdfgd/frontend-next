"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";

export default function SessionDebug() {
  const { isAuthenticated, user, token, error, isLoading, isValidating } = useAuth();
  const { isWorkspaceSelected } = useWorkspace();
  const [timeSinceRender, setTimeSinceRender] = useState(0);
  const [isDev, setIsDev] = useState(true);
  
  // Update timer every second to help trace render timing
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceRender(prev => prev + 1);
    }, 1000);
    
    // Check environment
    setIsDev(process.env.NODE_ENV === 'development');
    
    return () => clearInterval(interval);
  }, []);
  
  // todo TEMPORARILY COMMENTING OUT, NO NEED FOR DEBUG FOR NOW, remove !isDev, just check for isDev to show for dev
  // Don't render anything in development mode
  if (isDev || !isDev) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-4 w-96 max-h-96 overflow-auto text-xs font-mono z-50 border-t border-l border-gray-700 rounded-tl-lg shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Auth Debug</h3>
        <div className="text-xs text-gray-400">{timeSinceRender}s since render</div>
      </div>
      
      <div className="grid gap-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Authenticated:</span> 
          <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Loading:</span> 
          <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Validating:</span> 
          <span className={isValidating ? 'text-yellow-400' : 'text-green-400'}>
            {isValidating ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Has token:</span> 
          <span className={token ? 'text-green-400' : 'text-red-400'}>
            {token ? 'Yes' : 'No'} 
            {token && <span className="text-xs text-gray-500">(First 5: {token.substring(0, 5)}...)</span>}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Has user:</span> 
          <span className={user ? 'text-green-400' : 'text-red-400'}>
            {user ? 'Yes' : 'No'}
          </span>
        </div>
        {user && (
          <div>
            <div className="text-gray-400">User info:</div>
            <div className="pl-2">
              <div>Username: {user?.login || 'N/A'}</div>
              <div>Name: {user?.name || 'N/A'}</div>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-1">
            <span className="text-red-400">Error:</span> {error}
          </div>
        )}
      </div>
      
      <h4 className="text-md mt-4 mb-1 font-bold">localStorage vs Context</h4>
      <div className="grid gap-1">
        {typeof window !== 'undefined' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">token in localStorage:</span>
              <span className={localStorage.getItem('github-access-token') ? 'text-green-400' : 'text-red-400'}>
                {localStorage.getItem('github-access-token') ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">token in context:</span>
              <span className={token ? 'text-green-400' : 'text-red-400'}>
                {token ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sync status:</span>
              <span 
                className={
                  (!!localStorage.getItem('github-access-token') === !!token) 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }
              >
                {(!!localStorage.getItem('github-access-token') === !!token) 
                  ? 'In sync' 
                  : 'Out of sync!'}
              </span>
            </div>
          </>
        )}
      </div>
      
      <h4 className="text-md mt-4 mb-1 font-bold">Component tree rendering</h4>
      <div>
        <div className="text-xs text-gray-400 mb-1">
          Current render flow path:
        </div>
        <div className="text-xs">
          <div className={isAuthenticated ? 'text-green-400' : 'text-gray-500'}>
            ✓ AuthContext initialized
          </div>
          <div className={isAuthenticated && !isLoading ? 'text-green-400' : 'text-gray-500'}>
            {isAuthenticated && !isLoading ? '✓' : '○'} Auth loading complete
          </div>
          <div className={isAuthenticated && isWorkspaceSelected ? 'text-green-400' : 'text-gray-500'}>
            {isAuthenticated && isWorkspaceSelected ? '✓' : '○'} Workspace selected
          </div>
          <div className={isAuthenticated && isWorkspaceSelected ? 'text-green-400' : 'text-gray-500'}>
            {isAuthenticated && isWorkspaceSelected ? '✓' : '○'} Chat component enabled
          </div>
        </div>
      </div>
    </div>
  );
} 