"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub, FaFolder, FaTimes, FaSearch, FaCheck, FaStar, FaCodeBranch, FaLock, FaEye, FaCode } from "react-icons/fa";

// Helper to format dates
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

interface WorkspaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (workspace: {
    type: "github" | "local";
    id?: string | number;
    name: string;
    path?: string;
    url?: string;
    description?: string;
  }) => void;
}

export default function WorkspaceSelector({ isOpen, onClose, onSelectWorkspace }: WorkspaceSelectorProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"github" | "local">(session?.provider === "github" ? "github" : "local");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [localFolderPath, setLocalFolderPath] = useState("");
  const [localFolderName, setLocalFolderName] = useState("");
  
  // Handle repository selection
  const handleSelectRepo = (repoId: number) => {
    setSelectedRepoId(repoId);
  };
  
  // Handle form submission for GitHub repo
  const handleGithubSubmit = () => {
    if (!selectedRepoId || !session?.githubRepos) return;
    
    const selectedRepo = session.githubRepos.find(repo => repo.id === selectedRepoId);
    if (!selectedRepo) return;
    
    onSelectWorkspace({
      type: "github",
      id: selectedRepo.id,
      name: selectedRepo.name,
      url: selectedRepo.url,
      description: selectedRepo.description || undefined
    });
    
    onClose();
  };
  
  // Handle form submission for local folder
  const handleLocalSubmit = () => {
    if (!localFolderPath || !localFolderName) return;
    
    onSelectWorkspace({
      type: "local",
      name: localFolderName,
      path: localFolderPath
    });
    
    onClose();
  };
  
  // Filter repos based on search term
  const filteredRepos = session?.githubRepos?.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Handle local folder selection (would typically use an file input, but simplified here)
  const handleLocalFolderSelect = () => {
    // This is a placeholder for actual folder selection
    // In a real app, you'd use a file input with webkitdirectory attribute or another method
    const mockPath = "/Users/username/projects/my-project";
    const mockName = "my-project";
    
    setLocalFolderPath(mockPath);
    setLocalFolderName(mockName);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="max-w-3xl w-full mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative"
          >
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <FaTimes size={20} />
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Select a Workspace
              </h2>
              
              <p className="text-gray-300 text-center mb-6">
                Choose a GitHub repository or a local folder to work with
              </p>
              
              {/* Tab selection */}
              <div className="flex border-b border-gray-700 mb-6">
                <button
                  className={`px-4 py-2 flex items-center ${tab === 'github' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setTab('github')}
                  disabled={!session?.githubRepos?.length}
                >
                  <FaGithub className="mr-2" /> GitHub Repositories
                </button>
                <button
                  className={`px-4 py-2 flex items-center ${tab === 'local' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setTab('local')}
                >
                  <FaFolder className="mr-2" /> Local Folder
                </button>
              </div>
              
              {/* GitHub Repositories Tab */}
              {tab === 'github' && (
                <div className="space-y-6">
                  {session?.githubRepos?.length ? (
                    <>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search repositories..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                        {filteredRepos.length > 0 ? (
                          filteredRepos.map((repo) => (
                            <div
                              key={repo.id}
                              onClick={() => handleSelectRepo(repo.id)}
                              className={`bg-gray-750 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedRepoId === repo.id 
                                  ? 'border-2 border-blue-500 bg-gray-700' 
                                  : 'border border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    {selectedRepoId === repo.id && (
                                      <FaCheck className="text-blue-500 mr-2" />
                                    )}
                                    <span className="text-lg font-medium flex items-center">
                                      {repo.isPrivate ? <FaLock className="mr-2 text-gray-400" /> : <FaEye className="mr-2 text-gray-400" />}
                                      {repo.name}
                                    </span>
                                  </div>
                                  
                                  {repo.description && (
                                    <p className="text-gray-300 mt-1">{repo.description}</p>
                                  )}
                                  
                                  <div className="flex items-center mt-3 text-sm text-gray-400">
                                    {repo.language && (
                                      <div className="flex items-center mr-4">
                                        <FaCode className="mr-1" />
                                        {repo.language}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center mr-4">
                                      <FaStar className="mr-1" />
                                      {repo.stars}
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <FaCodeBranch className="mr-1" />
                                      {repo.forks}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-gray-400">
                                  Updated {formatDate(repo.updatedAt)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            No repositories match your search.
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGithubSubmit}
                          disabled={!selectedRepoId}
                          className={`px-4 py-2 rounded-md ${
                            selectedRepoId 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Select Repository
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      {session?.provider === 'github' 
                        ? "No GitHub repositories found. You might need to grant additional permissions."
                        : "Please sign in with GitHub to select a repository."}
                    </div>
                  )}
                </div>
              )}
              
              {/* Local Folder Tab */}
              {tab === 'local' && (
                <div className="space-y-6">
                  <div className="bg-gray-750 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-medium mb-4">Select a folder from your computer</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 mb-1">Folder Name</label>
                        <input
                          type="text"
                          value={localFolderName}
                          onChange={(e) => setLocalFolderName(e.target.value)}
                          placeholder="My Project"
                          className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-1">Folder Path</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={localFolderPath}
                            readOnly
                            placeholder="/path/to/your/project"
                            className="flex-1 p-2 bg-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleLocalFolderSelect}
                            className="bg-gray-600 hover:bg-gray-500 px-4 rounded-r-md"
                          >
                            Browse...
                          </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Note: In a real application, this would open a folder picker dialog.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLocalSubmit}
                      disabled={!localFolderPath || !localFolderName}
                      className={`px-4 py-2 rounded-md ${
                        localFolderPath && localFolderName
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Select Folder
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 