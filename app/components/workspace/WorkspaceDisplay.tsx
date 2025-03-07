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
      <div 
        className="bg-gray-700 rounded-md p-2 text-gray-400 text-sm flex items-center cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={handleOpenWorkspaceSelector}
      >
        <span>No workspace selected</span>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="bg-gray-700 rounded-md p-2 text-white flex items-center overflow-hidden cursor-pointer hover:bg-gray-600 transition-colors group"
      onClick={handleOpenWorkspaceSelector}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title="Click to change workspace"
    >
      {workspace.type === "github" ? (
        <FaGithub className="text-white mr-2 flex-shrink-0" />
      ) : (
        <FaFolder className="text-blue-400 mr-2 flex-shrink-0" />
      )}
      
      <div className="truncate">
        <div className="font-medium truncate flex items-center">
          {workspace.name}
          <FaCaretDown className="ml-1 text-gray-400 group-hover:text-white transition-colors opacity-70" size={12} />
        </div>
        {workspace.description && (
          <div className="text-gray-300 text-xs truncate">{workspace.description}</div>
        )}
      </div>
      
      {workspace.url && (
        <a 
          href={workspace.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-gray-400 hover:text-white flex-shrink-0"
          title="Open in GitHub"
          onClick={(e) => e.stopPropagation()} // Prevent the workspace selector from opening
        >
          <FaExternalLinkAlt size={14} />
        </a>
      )}
    </motion.div>
  );
} 