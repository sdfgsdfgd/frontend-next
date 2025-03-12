"use client";

import { useWorkspace } from "@/app/context/WorkspaceContext";
import { FaGithub, FaFolder, FaExternalLinkAlt, FaCaretDown } from "react-icons/fa";
import { useContext } from "react";
import { motion } from "framer-motion";
import { ModalControlContext } from "@/app/context/ModalContext";

export default function WorkspaceDisplay() {
  const { workspace, isWorkspaceSelected } = useWorkspace();
  const { setWorkspaceSelectorOpen } = useContext(ModalControlContext);
  
  // Function to open the workspace selector
  const handleOpenWorkspaceSelector = () => {
    setWorkspaceSelectorOpen(true);
  };
  
  if (!isWorkspaceSelected || !workspace) {
    return (
      <motion.div 
        className="glass-panel backdrop-blur-md bg-gray-800/30 border border-gray-700/50 rounded-lg p-2.5 
                   text-gray-400 text-sm flex items-center cursor-pointer transition-all duration-300
                   hover:border-gray-500/60 hover:bg-gray-700/40 hover:shadow-lg hover:shadow-gray-900/30
                   radial-shimmer"
        onClick={handleOpenWorkspaceSelector}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>No workspace selected</span>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="relative overflow-hidden rounded-lg cursor-pointer group my-2.5"
      onClick={handleOpenWorkspaceSelector}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title="Click to change workspace"
    >
      {/* Background gradient blur effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/60 to-gray-900/50 
                      backdrop-blur-md border border-gray-700/40 rounded-lg
                      group-hover:border-gray-600/60 group-hover:from-gray-900/50 group-hover:via-gray-800/70 
                      group-hover:to-gray-900/60 group-hover:shadow-lg group-hover:shadow-gray-900/30
                      transition-all duration-300">
      </div>
      
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 
                      ease-in-out opacity-0 group-hover:opacity-100">
      </div>
      
      {/* Subtle edge highlight */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-pink-500/10 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Content */}
      <div className="relative z-10 p-2.5 flex items-center">
        {workspace.type === "github" ? (
          <div className="p-1.5 rounded-full bg-gray-900/60 backdrop-blur-sm mr-3 flex-shrink-0 
                         border border-gray-700/30 group-hover:border-blue-500/50 
                         transition-all duration-300 group-hover:bg-blue-900/20 
                         group-hover:shadow shadow-blue-500/20">
            <FaGithub className="text-blue-300 group-hover:text-blue-200" size={16} />
          </div>
        ) : (
          <div className="p-1.5 rounded-full bg-gray-900/60 backdrop-blur-sm mr-3 flex-shrink-0 
                        border border-gray-700/30 group-hover:border-blue-500/50
                        transition-all duration-300 group-hover:bg-blue-900/20  
                        group-hover:shadow shadow-blue-500/20">
            <FaFolder className="text-blue-400 group-hover:text-blue-300" size={16} />
          </div>
        )}
        
        <div className="truncate">
          <div className="font-medium truncate flex items-center text-gray-200 group-hover:text-white transition-colors">
            {workspace.name}
            <FaCaretDown className="ml-1 text-gray-400 group-hover:text-blue-300 transition-colors opacity-70" size={12} />
          </div>
          {workspace.description && (
            <div className="text-gray-400 text-xs truncate group-hover:text-gray-300 transition-colors">{workspace.description}</div>
          )}
        </div>
        
        {workspace.url && (
          <a 
            href={workspace.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white flex-shrink-0
                      border border-gray-700/50 hover:border-blue-500/50 hover:bg-blue-900/20
                      transition-all duration-300 backdrop-blur-sm"
            title="Open in GitHub"
            onClick={(e) => e.stopPropagation()} // Prevent the workspace selector from opening
          >
            <FaExternalLinkAlt size={12} />
          </a>
        )}
      </div>
      
      {/* Subtle decorative element */}
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-500/30 to-purple-500/30 
                     rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
    </motion.div>
  );
} 