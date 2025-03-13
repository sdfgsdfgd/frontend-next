"use client";

import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FaGithub, FaStar, FaCodeBranch, FaLock, FaEye, FaCode, FaCaretDown, FaCaretUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Define GitHub repo type
interface GitHubRepo {
  id: number;
  name: string;
  description?: string;
  url?: string;
  html_url?: string;
  private?: boolean;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
}

export default function GitHubRepos() {
  const { isAuthenticated, user, token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  
  // Fetch GitHub repos when component mounts
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchGitHubRepos();
    }
  }, [isAuthenticated, token]);
  
  // Function to fetch GitHub repositories
  const fetchGitHubRepos = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      } else {
        console.error('Failed to fetch GitHub repos');
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    }
  };
  
  // Filter repos based on search term
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Display only first 5 repos unless expanded
  const displayRepos = isExpanded ? filteredRepos : filteredRepos.slice(0, 5);
  
  return (
    <div className="mt-8 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FaGithub className="mr-2" /> 
          Your GitHub Repositories ({repos.length})
        </h2>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-400 hover:text-blue-300 flex items-center"
        >
          {isExpanded ? (
            <>Show Less <FaCaretUp className="ml-1" /></>
          ) : (
            <>Show All <FaCaretDown className="ml-1" /></>
          )}
        </button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <AnimatePresence>
        <div className="space-y-3">
          {displayRepos.length > 0 ? (
            displayRepos.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <a 
                      href={repo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-lg font-medium flex items-center"
                    >
                      {repo.private ? <FaLock className="mr-2" /> : <FaEye className="mr-2" />}
                      {repo.name}
                    </a>
                    
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
                        {repo.stargazers_count}
                      </div>
                      
                      <div className="flex items-center mr-4">
                        <FaCodeBranch className="mr-1" />
                        {repo.forks_count}
                      </div>
                      
                      <div className="flex items-center">
                        <FaEye className="mr-1" />
                        {repo.watchers_count}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No repositories match your search.
            </div>
          )}
        </div>
      </AnimatePresence>
      
      {filteredRepos.length > 5 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-4 w-full py-2 text-center text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
        >
          Show all {filteredRepos.length} repositories
        </button>
      )}
    </div>
  );
} 