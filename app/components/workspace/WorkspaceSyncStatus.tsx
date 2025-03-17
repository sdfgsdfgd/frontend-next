"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaCheck, FaTimes, FaRedo } from 'react-icons/fa';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { useWorkspace } from '@/app/context/WorkspaceContext';
import { useAuth } from '@/app/context/AuthContext';

// Enable this to show debug controls
const DEBUG_MODE = true;

export default function WorkspaceSyncStatus() {
  // Use the needed contexts
  const { syncStatus, syncProgress, syncError, syncMessage, selectGitHubRepo } = useWebSocketContext();
  const { workspace } = useWorkspace();
  const { token } = useAuth();
  const [isTestingSync, setIsTestingSync] = useState(false);
  
  // Calculate derived states
  const isSyncing = syncStatus === 'initializing' || syncStatus === 'syncing';
  const isSynchronized = syncStatus === 'synchronized';
  const isError = syncStatus === 'error';
  
  // Log sync status changes
  useEffect(() => {
    console.log(`[WORKSPACE-UI-DEBUG] Sync status: ${syncStatus}, progress: ${syncProgress}%, error: ${syncError || 'none'}`);
    // Also log any WebSocket context changes for debugging
    if (syncStatus === 'error') {
      console.error('[WORKSPACE-UI-DEBUG] Sync error:', syncError);
    }
    
    // Reset testing flag when sync completes or errors
    if (isTestingSync && (syncStatus === 'synchronized' || syncStatus === 'error')) {
      setIsTestingSync(false);
    }
  }, [syncStatus, syncProgress, syncError, isTestingSync]);
  
  // Handle retry sync for real workspace
  const handleRetrySyncClick = async () => {
    if (!workspace || !token || workspace.type !== 'github') {
      console.error('[WORKSPACE-UI-DEBUG] Cannot retry sync: No GitHub workspace or token');
      return;
    }
    
    try {
      setIsTestingSync(true);
      
      // Prepare repo data
      const repoData = {
        repoId: workspace.id as number,
        name: workspace.name,
        owner: workspace.url ? workspace.url.split('/')[3] : '',  // Extract owner from URL
        url: workspace.url || '',
        branch: 'main'  // Default to main, adjust as needed
      };
      
      console.log('[WORKSPACE-UI-DEBUG] Retrying real workspace sync for:', workspace.name);
      const result = await selectGitHubRepo(repoData, token);
      console.log('[WORKSPACE-UI-DEBUG] Real sync retry initiated:', result);
    } catch (error) {
      console.error('[WORKSPACE-UI-DEBUG] Error retrying real sync:', error);
      setIsTestingSync(false);
    }
  };
  
  // Render debug UI above the sync status
  const renderDebugControls = () => {
    if (!DEBUG_MODE) return null;
    
    return (
      <div className="mb-2 flex items-center space-x-2 flex-wrap justify-between">
        {/* Only show Retry button when in error state */}
        {isError && (
          <button
            onClick={handleRetrySyncClick}
            disabled={isSyncing || isTestingSync}
            className={`px-2 py-1 rounded text-xs flex items-center ${
              isSyncing || isTestingSync 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-red-700 hover:bg-red-600 text-white'
            }`}
          >
            <FaRedo className="mr-1" size={10} />
            {isTestingSync ? 'Syncing...' : 'Retry Sync'}
          </button>
        )}
        
        <span className="text-xs text-gray-400">
          Status: {syncStatus}
        </span>
      </div>
    );
  };
  
  // Skip rendering if idle
  if (syncStatus === 'idle') {
    // DEBUGGING: Still render a placeholder when idle
    return (
      <div>
        {renderDebugControls()}
        <div className="rounded-lg h-10 flex items-center px-4 py-2 border border-gray-700 bg-gray-800/50">
          <span className="text-xs text-gray-400 flex items-center">
            <FaSync className="mr-2 opacity-50" size={10} />
            Waiting for repo synchronization...
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {renderDebugControls()}
      <AnimatePresence mode="wait">
        <motion.div
          className="relative overflow-hidden rounded-lg h-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        >
          {/* Background with blur effect */}
          <div className="absolute inset-0 backdrop-blur-sm border border-gray-800/40 rounded-lg
                        transition-all duration-300">
            {/* Progress bar */}
            <motion.div 
              className={`absolute inset-y-0 left-0 ${
                syncStatus === 'error' 
                  ? 'bg-red-900/30' 
                  : isSynchronized 
                    ? 'bg-green-900/20' 
                    : 'bg-blue-900/20'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${syncProgress}%` }}
              transition={{ 
                type: 'spring', 
                damping: 15, 
                stiffness: 200 
              }}
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10 px-4 py-2 flex items-center h-full">
            {isSyncing && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="mr-2 text-blue-400"
              >
                <FaSync size={12} />
              </motion.div>
            )}
            
            {isSynchronized && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mr-2 text-green-400"
              >
                <FaCheck size={12} />
              </motion.div>
            )}
            
            {syncStatus === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mr-2 text-red-400"
              >
                <FaTimes size={12} />
              </motion.div>
            )}
            
            <span className="text-xs whitespace-nowrap">
              {syncStatus === 'initializing' && (syncMessage || `Initializing ${syncProgress > 0 ? syncProgress + '%' : '...'}`)}
              {syncStatus === 'syncing' && (syncMessage || `Syncing Repository ${syncProgress}%`)}
              {syncStatus === 'synchronized' && (syncMessage || 'Synchronized ✨')}
              {syncStatus === 'error' && (syncError || syncMessage || 'Sync Error')}
            </span>
          </div>
          
          {/* Shimmering effect */}
          {isSyncing && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear',
                repeatDelay: 0.5
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 