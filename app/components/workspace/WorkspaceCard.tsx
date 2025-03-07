"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useWorkspace, Workspace } from "@/app/context/WorkspaceContext";
import { 
  FaGithub, FaFolder, FaArrowRight, FaSearch, FaCheck, 
  FaStar, FaCodeBranch, FaLock, FaEye, FaCode, FaTimes,
  FaSpinner, FaFolderOpen
} from "react-icons/fa";

// Helper to format dates
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Animation variants for different elements
const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const listItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * custom, duration: 0.3 }
  }),
  hover: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.2)",
    transition: { duration: 0.2 }
  }
};

const tabVariants: Variants = {
  inactive: { 
    opacity: 0.6,
    transition: { duration: 0.2 }
  },
  active: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

interface WorkspaceCardProps {
  onClose: () => void;
}

export default function WorkspaceCard({ onClose }: WorkspaceCardProps) {
  const { data: session } = useSession();
  const { setWorkspace } = useWorkspace();
  const [selectedTab, setSelectedTab] = useState<"github" | "local">(
    session?.provider === "github" ? "github" : "local"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [localFolderPath, setLocalFolderPath] = useState("");
  const [localFolderName, setLocalFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter repos based on search term
  const filteredRepos = session?.githubRepos?.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Handle repository selection
  const handleSelectRepo = (repoId: number) => {
    setSelectedRepoId(repoId);
  };
  
  // Handle form submission for GitHub repo
  const handleGithubSubmit = () => {
    if (!selectedRepoId || !session?.githubRepos) return;
    
    setIsLoading(true);
    const selectedRepo = session.githubRepos.find(repo => repo.id === selectedRepoId);
    
    if (selectedRepo) {
      setWorkspace({
        type: "github",
        id: selectedRepo.id,
        name: selectedRepo.name,
        url: selectedRepo.url,
        description: selectedRepo.description || undefined
      });
      
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 500);
    } else {
      setIsLoading(false);
    }
  };
  
  // Handle local folder selection (in a real app would use file system API)
  const handleLocalFolderSelect = () => {
    // Mock folder selection - would use file system API in real implementation
    const mockPath = "/Users/developer/projects/my-app";
    const mockName = "my-app";
    
    setLocalFolderPath(mockPath);
    setLocalFolderName(mockName);
  };
  
  // Handle form submission for local folder
  const handleLocalSubmit = () => {
    if (!localFolderPath || !localFolderName) return;
    
    setIsLoading(true);
    
    setWorkspace({
      type: "local",
      name: localFolderName,
      path: localFolderPath
    });
    
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 500);
  };
  
  return (
    <div className="w-[450px] p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center"
        >
          <span className="mr-3 bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-lg">
            <FaFolderOpen className="text-white text-xl" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-white">Select Workspace</h3>
            <p className="text-gray-400 text-sm">Choose a repository or local folder</p>
          </div>
        </motion.div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <motion.button
          variants={tabVariants}
          animate={selectedTab === "github" ? "active" : "inactive"}
          className={`px-4 py-2 flex items-center ${
            selectedTab === "github" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"
          }`}
          onClick={() => setSelectedTab("github")}
          disabled={!session?.githubRepos?.length}
        >
          <FaGithub className="mr-2" />
          GitHub Repositories
        </motion.button>
        
        <motion.button
          variants={tabVariants}
          animate={selectedTab === "local" ? "active" : "inactive"}
          className={`px-4 py-2 flex items-center ${
            selectedTab === "local" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"
          }`}
          onClick={() => setSelectedTab("local")}
        >
          <FaFolder className="mr-2" />
          Local Folder
        </motion.button>
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedTab === "github" && (
          <motion.div
            key="github"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {session?.githubRepos?.length ? (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-2 bg-gray-800 bg-opacity-70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>
                
                {/* Repository list */}
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
                  {filteredRepos.length > 0 ? (
                    filteredRepos.map((repo, index) => (
                      <motion.div
                        key={repo.id}
                        variants={listItemVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        custom={index}
                        onClick={() => handleSelectRepo(repo.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedRepoId === repo.id 
                            ? 'bg-blue-600 bg-opacity-10 border border-blue-500' 
                            : 'border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              {selectedRepoId === repo.id && (
                                <FaCheck className="text-blue-400 mr-2" />
                              )}
                              <span className="font-medium flex items-center text-white">
                                {repo.isPrivate ? <FaLock className="mr-2 text-xs text-gray-400" /> : <FaEye className="mr-2 text-xs text-gray-400" />}
                                {repo.name}
                              </span>
                            </div>
                            
                            {repo.description && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-1">{repo.description}</p>
                            )}
                            
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              {repo.language && (
                                <div className="flex items-center mr-3">
                                  <FaCode className="mr-1" size={10} />
                                  {repo.language}
                                </div>
                              )}
                              
                              <div className="flex items-center mr-3">
                                <FaStar className="mr-1" size={10} />
                                {repo.stars}
                              </div>
                              
                              <div className="flex items-center">
                                <FaCodeBranch className="mr-1" size={10} />
                                {repo.forks}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            {formatDate(repo.updatedAt)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      No repositories match your search.
                    </div>
                  )}
                </div>
                
                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGithubSubmit}
                  disabled={!selectedRepoId || isLoading}
                  className={`w-full p-3 rounded-lg flex items-center justify-center font-medium ${
                    selectedRepoId && !isLoading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>Select Repository <FaArrowRight className="ml-2" /></>
                  )}
                </motion.button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {session?.provider === 'github' 
                  ? "No GitHub repositories found. You may need to grant additional permissions."
                  : "Please sign in with GitHub to select a repository."}
              </div>
            )}
          </motion.div>
        )}
        
        {selectedTab === "local" && (
          <motion.div
            key="local"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-300 text-sm mb-1">Folder Name</label>
              <input
                type="text"
                value={localFolderName}
                onChange={(e) => setLocalFolderName(e.target.value)}
                placeholder="my-project"
                className="w-full p-2 bg-gray-800 bg-opacity-70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">Folder Path</label>
              <div className="flex">
                <input
                  type="text"
                  value={localFolderPath}
                  readOnly
                  placeholder="/path/to/your/project"
                  className="flex-1 p-2 bg-gray-800 bg-opacity-70 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={handleLocalFolderSelect}
                  className="bg-gray-700 hover:bg-gray-600 px-3 rounded-r-lg flex items-center justify-center border-t border-r border-b border-gray-700"
                >
                  Browse
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Note: In a real app, this would use a folder picker dialog.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLocalSubmit}
              disabled={!localFolderPath || !localFolderName || isLoading}
              className={`w-full p-3 rounded-lg flex items-center justify-center font-medium mt-4 ${
                localFolderPath && localFolderName && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>Select Folder <FaArrowRight className="ml-2" /></>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Close button */}
      <motion.button 
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FaTimes />
      </motion.button>
    </div>
  );
} 