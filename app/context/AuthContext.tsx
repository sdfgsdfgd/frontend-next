"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// Constants for localStorage keys
const AUTH_TOKEN_KEY = 'github-access-token';
const AUTH_USER_KEY = 'github-user';
const AUTH_COMPLETED_KEY = 'github-auth-completed';

// Define user and auth state types
export interface GitHubUser {
  id: string | number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isValidating?: boolean;
  user: GitHubUser | null;
  token: string | null;
  error: string | null;
  login: () => void;
  logout: () => void;
}

export type AuthTokenData = {
  access_token: string;
  token_type: string;
  scope: string;
  user?: GitHubUser;
};

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
  const [isValidating, setIsValidating] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Function to handle authentication errors gracefully
  const handleAuthError = (errorMessage: string, clearData: boolean = true) => {
    console.error(`[AUTH] ${errorMessage}`);
    setError(errorMessage);
    
    if (clearData) {
      // Clear localStorage data
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
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
          
          // Set token and authentication state immediately
          setToken(storedToken);
          setIsAuthenticated(true);
          
          // Get user from localStorage for immediate display
          const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
          if (storedUserJson) {
            try {
              const storedUser = JSON.parse(storedUserJson);
              setUser(storedUser);
            } catch (e) {
              console.error('[AUTH] Error parsing stored user:', e);
            }
          }
          
          // Then validate token asynchronously
          setIsValidating(true);
          const validToken = await validateGithubToken(storedToken);
          setIsValidating(false);
          
          if (validToken) {
            console.log('[AUTH] Token validated successfully');
            
            // Update user data in the background if needed
            if (!user) {
              try {
                const userData = await fetchUserData(storedToken);
                if (userData) {
                  setUser(userData);
                  // Update stored user data
                  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
                }
              } catch (e) {
                console.warn('[AUTH] Could not fetch fresh user data, using stored data', e);
                // Continue with stored data, don't clear auth
              }
            }
          } else {
            // Token is invalid, clear it
            handleAuthError("Authentication token expired, please log in again");
          }
        }
      } catch (e) {
        handleAuthError("Error initializing authentication", false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Check for token updates in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (event?: StorageEvent) => {
      console.log('[AUTH] Storage change detected', event?.key);
      
      // Check for auth completed flag
      const authCompleted = localStorage.getItem(AUTH_COMPLETED_KEY);
      
      if (authCompleted === 'true') {
        console.log('[AUTH] Detected auth completion in localStorage');
        localStorage.removeItem(AUTH_COMPLETED_KEY);
        
        // Re-initialize auth state
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
        } else {
          // No token found, ensure we're logged out
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };
    
    // Check immediately
    handleStorageChange();
    
    // Set up storage event listener (works between tabs)
    const storageListener = (event: StorageEvent) => handleStorageChange(event);
    window.addEventListener('storage', storageListener);
    
    // Listen for custom storage events (within same tab)
    const customStorageListener = () => handleStorageChange();
    window.addEventListener('storage-update', customStorageListener);
    
    // Also check periodically in case event isn't fired
    const interval = setInterval(() => handleStorageChange(), 2000);
    
    return () => {
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('storage-update', customStorageListener);
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
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23li0D2JHTeDDBOQ1i';
    
    // Log which client ID is being used
    console.log('[AUTH] Using GitHub client ID:', {
      clientId: clientId.substring(0, 8) + '...',
      fromEnv: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      envPrefix: process.env.NEXT_PUBLIC_AUTH_URL // Log another env var to check if env vars are loading
    });
    
    // Use the environment variable for the redirect URI to maintain consistency with token exchange
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || window.location.origin;
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback/github`);
    
    const scope = encodeURIComponent('read:user user:email repo');
    
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    console.log('[AUTH] Redirecting to GitHub for authentication', {
      redirectUri: decodeURIComponent(redirectUri),
      baseUrl
    });
    
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
    
    // Trigger custom event to notify other parts of the app
    window.dispatchEvent(new Event('storage-update'));
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
        isValidating,
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