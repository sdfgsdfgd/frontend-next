"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaGithub, FaUser, FaSignOutAlt, FaSpinner } from 'react-icons/fa';

interface AuthCardProps {
  onClose: () => void;
}

export default function AuthCard({ onClose }: AuthCardProps) {
  const { isAuthenticated, user, login, logout, isLoading: authLoading, error: authError } = useAuth();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Debug user data
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[AUTH_CARD] Authenticated user data:', user);
      console.log('[AUTH_CARD] User avatar URL:', user?.avatar_url);
    }
  }, [isAuthenticated, user]);
  
  // Handle GitHub sign in
  const handleGitHubSignIn = async () => {
    try {
      setButtonLoading(true);
      setError("");
      login();
    } catch (error) {
      console.error('[AUTH] Error during sign in:', error);
      setError("Failed to start GitHub authentication");
      setButtonLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      setButtonLoading(true);
      setError("");
      logout();
    } catch (error) {
      console.error('[AUTH] Error during sign out:', error);
      setError("Failed to sign out");
      setButtonLoading(false);
    }
  };
  
  // Show loading if either auth context is loading or we're waiting for a button action
  const isLoading = authLoading || buttonLoading;
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md mx-auto relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Close"
      >
        <FaSignOutAlt className="transform rotate-180" />
      </button>
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isAuthenticated ? 'Welcome Back!' : 'Sign In to Continue'}
        </h2>
        <p className="text-gray-400">
          {isAuthenticated 
            ? `You are signed in as ${user?.name || user?.login || 'User'}`
            : 'Please sign in to access your AI assistant'}
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <FaSpinner className="text-blue-500 animate-spin text-2xl" />
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-4 flex items-center">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user?.login || "User"}
                className="w-10 h-10 rounded-full mr-4"
                onError={(e) => {
                  console.error('[AUTH_CARD] Failed to load avatar image:', user.avatar_url);
                  e.currentTarget.style.display = 'none';
                  // Show fallback instead
                  const fallbackElement = document.getElementById('auth-card-fallback-avatar');
                  if (fallbackElement) {
                    fallbackElement.style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div id="auth-card-fallback-avatar" className="bg-blue-500 rounded-full p-2 mr-4 flex items-center justify-center">
                <FaUser className="text-white" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-white">{user?.name || user?.login}</h3>
              <p className="text-sm text-gray-400">{user?.login}</p>
              {user?.avatar_url && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">Avatar: {user.avatar_url}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition flex items-center justify-center"
          >
            <FaSignOutAlt className="mr-2" />
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleGitHubSignIn}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition flex items-center justify-center"
          >
            <FaGithub className="mr-2" />
            Continue with GitHub
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      {authError && (
        <div className="mt-4 text-amber-400 text-sm text-center">
          {authError}
        </div>
      )}
    </div>
  );
} 