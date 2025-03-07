"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  
  const login = async (provider: string, credentials?: Record<string, string>) => {
    try {
      return await signIn(provider, {
        ...credentials,
        callbackUrl: window.location.origin,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await signOut({ callbackUrl: window.location.origin });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };
  
  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    logout,
  };
} 