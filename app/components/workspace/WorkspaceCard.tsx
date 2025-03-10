"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useWorkspace, Workspace } from "@/app/context/WorkspaceContext";
import { useAuth } from "../../context/AuthContext";
import { 
  FaGithub, FaFolder, FaArrowRight, FaSearch, FaCheck, 
  FaStar, FaCodeBranch, FaLock, FaEye, FaCode, FaTimes,
  FaSpinner, FaFolderOpen, FaUpload, FaInfoCircle
} from "react-icons/fa";
import { useDropzone, FileWithPath } from "react-dropzone";

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
  const { isAuthenticated } = useAuth();
  const { setWorkspace } = useWorkspace();
  const [selectedTab, setSelectedTab] = useState<"github" | "local">("github");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [localFolderName, setLocalFolderName] = useState("");
  const [localFolderPath, setLocalFolderPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  
  // Fetch GitHub repositories when component mounts
  useEffect(() => {
    if (isAuthenticated && selectedTab === "github") {
      fetchGitHubRepos();
    }
  }, [isAuthenticated, selectedTab]);
  
  // Function to fetch GitHub repositories
  const fetchGitHubRepos = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('github-access-token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const repos = await response.json();
        setGithubRepos(repos);
        
        // Auto-select first repo if there's only one
        if (repos.length === 1) {
          setSelectedRepoId(repos[0].id);
        }
      } else {
        console.error('[WORKSPACE] Failed to fetch GitHub repos');
      }
    } catch (error) {
      console.error('[WORKSPACE] Error fetching GitHub repos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter repos based on search term
  const filteredRepos = githubRepos?.filter((repo: any) => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Handle repository selection
  const handleSelectRepo = (repoId: number) => {
    setSelectedRepoId(repoId);
  };
  
  // Handle form submission for GitHub repo
  const handleGithubSubmit = () => {
    if (!selectedRepoId || !githubRepos?.length) return;
    
    setIsLoading(true);
    const selectedRepo = githubRepos.find((repo: any) => repo.id === selectedRepoId);
    
    if (selectedRepo) {
      setWorkspace({
        type: "github",
        id: selectedRepo.id,
        name: selectedRepo.name,
        url: selectedRepo.html_url,
        description: selectedRepo.description || undefined
      });
      
      onClose();
    } else {
      setIsLoading(false);
    }
  };
  
  // Handle local folder selection using File System Access API where supported
  const handleLocalFolderSelect = async () => {
    try {
      // Check if the File System Access API is available
      if ('showDirectoryPicker' in window) {
        setIsLoading(true);
        // @ts-ignore - TypeScript might not recognize this API yet
        const dirHandle = await window.showDirectoryPicker();
        const path = dirHandle.name; // Only get the folder name, not the full path due to security
        setLocalFolderPath(path);
        // Store the directory handle for potential future use
        // In a real app, you would persist this with permissions
        setDirectoryHandle(dirHandle);
      } else {
        // Fallback for browsers without File System Access API
        alert("Your browser doesn't support directory selection. Try using Chrome or Edge.");
      }
    } catch (error) {
      // User canceled or error occurred
      console.log("Directory selection canceled or error occurred:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle drag and drop (note: browsers limit what info is available due to security)
  const onDrop = (acceptedFiles: FileWithPath[]) => {
    // For security reasons, browsers don't provide the real file path
    // We can only access file objects, not the containing folder path
    
    // If files were dropped, use the first folder name as an identifier
    if (acceptedFiles.length > 0) {
      // Extract a folder name from the first file's path or use its name
      // This is NOT the real full path for security reasons
      const file = acceptedFiles[0];
      const pathParts = file.path ? file.path.split('/') : [];
      
      // Try to find a folder name from the path, or use the first file's parent folder name
      const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Selected Folder';
      
      setLocalFolderPath(folderName);
      // We'll store the actual file objects for later use
      setSelectedFiles(acceptedFiles);
    }
  };
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Prevent click from opening file dialog (we'll use the Browse button for that)
    noKeyboard: true
  });

  // Function to check if File System Access API is supported
  const [fsApiSupported, setFsApiSupported] = useState(false);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);

  // Check for File System Access API support
  useEffect(() => {
    setFsApiSupported('showDirectoryPicker' in window);
  }, []);

  // Handle form submission for local folder
  const handleLocalSubmit = () => {
    if (!localFolderPath) return;
    
    setIsLoading(true);
    
    // In a real application, you would save the directory handle
    // and integrate with backend/native system APIs
    setWorkspace({
      type: "local",
      name: localFolderPath, // Using the folder name directly
      path: localFolderPath  // This won't be a full path for security reasons
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
          disabled={!githubRepos?.length}
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
            {githubRepos?.length ? (
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
                                {repo.private ? <FaLock className="mr-2 text-xs text-gray-400" /> : <FaEye className="mr-2 text-xs text-gray-400" />}
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
                            <div className="flex items-center">
                              <FaEye className="mr-1" />
                              {repo.watchers} watchers
                            </div>
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
                {isAuthenticated 
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
              <label className="block text-gray-300 text-sm mb-1">Project Folder</label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                
                {localFolderPath ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 overflow-hidden">
                      <FaFolderOpen className="text-blue-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-200 truncate">{localFolderPath}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalFolderPath("");
                        setDirectoryHandle(null);
                        setSelectedFiles([]);
                      }}
                      className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FaUpload className="mx-auto text-gray-400 mb-2 text-2xl" />
                    <p className="text-gray-300 font-medium">Drag & drop your project folder here</p>
                    <p className="text-gray-400 text-sm mt-1">or</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocalFolderSelect();
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        'Browse'
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-400 flex items-start">
                <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" />
                <span>
                  {fsApiSupported 
                    ? "Using the File System Access API. You'll need to grant permission to access the selected folder."
                    : "Your browser has limited folder access capabilities. For best results, use Chrome or Edge."}
                </span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLocalSubmit}
              disabled={!localFolderPath || isLoading}
              className={`w-full p-3 rounded-lg flex items-center justify-center font-medium mt-4 ${
                localFolderPath && !isLoading
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