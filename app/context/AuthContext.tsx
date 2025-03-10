"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// Constants for localStorage keys
const AUTH_TOKEN_KEY = 'github-access-token';
const AUTH_USER_KEY = 'github-user';
const AUTH_COMPLETED_KEY = 'github-auth-completed';

// Define user and auth state types
interface GitHubUser {
  id: string | number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  token: string | null;
  error: string | null;
  login: () => void;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === 'undefined') {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get token from localStorage
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        
        if (storedToken) {
          console.log('[AUTH] Found token in localStorage');
          
          // Get user from localStorage first for quick display
          const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
          if (storedUserJson) {
            try {
              const storedUser = JSON.parse(storedUserJson);
              setUser(storedUser);
            } catch (e) {
              console.error('[AUTH] Error parsing stored user:', e);
            }
          }
          
          // Validate token with GitHub API
          const validToken = await validateGithubToken(storedToken);
          
          if (validToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            
            // We might already have set the user from localStorage,
            // but we'll make sure we have fresh data from the API
            if (!user) {
              const userData = await fetchUserData(storedToken);
              if (userData) {
                setUser(userData);
                // Update stored user data
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
              }
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            setError("Authentication token expired, please log in again");
          }
        }
      } catch (e) {
        console.error('[AUTH] Error initializing auth:', e);
        setError("Error initializing authentication");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Check for token updates in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      const authCompleted = localStorage.getItem(AUTH_COMPLETED_KEY);
      
      if (authCompleted === 'true') {
        console.log('[AUTH] Detected auth completion in localStorage');
        localStorage.removeItem(AUTH_COMPLETED_KEY);
        
        // Re-initialize auth
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
        
        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
          
          if (storedUserJson) {
            try {
              const storedUser = JSON.parse(storedUserJson);
              setUser(storedUser);
            } catch (e) {
              console.error('[AUTH] Error parsing stored user:', e);
            }
          }
        }
      }
    };
    
    // Check immediately
    handleStorageChange();
    
    // Set up event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case event isn't fired
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // Validate token with GitHub API
  const validateGithubToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch (e) {
      console.error('[AUTH] Error validating token:', e);
      return false;
    }
  };
  
  // Fetch user data from GitHub API
  const fetchUserData = async (token: string): Promise<GitHubUser | null> => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          login: data.login,
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url
        };
      }
      
      return null;
    } catch (e) {
      console.error('[AUTH] Error fetching user data:', e);
      return null;
    }
  };
  
  // Login function - redirect to GitHub auth
  const login = () => {
    if (typeof window === 'undefined') return;
    
    // Generate state parameter for CSRF protection
    const state = generateRandomString(32);
    localStorage.setItem('github-auth-state', state);
    
    // Construct the GitHub OAuth URL
    const clientId = 'Ov23li0D2JHTeDDBOQ1i'; // Hardcode client ID to ensure it's set
    const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/callback/github');
    const scope = encodeURIComponent('read:user user:email repo');
    
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    console.log('[AUTH] Redirecting to GitHub for authentication');
    
    // Set flag that we're in the process of auth
    localStorage.setItem('github-auth-in-progress', 'true');
    
    // Redirect to GitHub
    window.location.href = githubUrl;
  };
  
  // Logout function
  const logout = () => {
    if (typeof window === 'undefined') return;
    
    console.log('[AUTH] Logging out');
    
    // Clear tokens and user data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    
    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to home
    router.push('/');
  };
  
  // Helper function to generate random string for state parameter
  function generateRandomString(length: number) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
  
  // Provide auth state to children
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user, 
        token, 
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 