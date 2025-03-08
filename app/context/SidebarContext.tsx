"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true); // Start with sidebar open
  
  // Toggle sidebar function
  const toggleSidebar = () => setIsOpen(prev => !prev);
  
  // Direct setter for external control
  const setSidebarOpen = (open: boolean) => setIsOpen(open);
  
  // Add keyboard shortcut for toggling sidebar (Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Remember sidebar state in localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-open', isOpen ? 'true' : 'false');
    } catch (e) {
      console.error('Could not save sidebar state to localStorage', e);
    }
  }, [isOpen]);
  
  // Load sidebar state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('sidebar-open');
      if (savedState !== null) {
        setIsOpen(savedState === 'true');
      }
    } catch (e) {
      console.error('Could not load sidebar state from localStorage', e);
    }
  }, []);
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 