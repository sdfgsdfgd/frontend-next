"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Constants for localStorage keys
const AUTO_VOICE_ENABLED_KEY = 'auto-voice-enabled';

// Define the UserSettings type and context
export interface UserSettingsType {
  autoVoiceEnabled: boolean;
  toggleAutoVoice: () => void;
}

// Create the context with default values
const UserSettingsContext = createContext<UserSettingsType>({
  autoVoiceEnabled: true,
  toggleAutoVoice: () => {},
});

// Hook to use this context
export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
}

interface UserSettingsProviderProps {
  children: ReactNode;
}

// The provider component
export default function UserSettingsProvider({ children }: UserSettingsProviderProps) {
  // Initialize with default value (enabled), but will be overridden by localStorage if available
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState<boolean>(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedAutoVoice = localStorage.getItem(AUTO_VOICE_ENABLED_KEY);
      if (savedAutoVoice !== null) {
        setAutoVoiceEnabled(savedAutoVoice === 'true');
      }
    } catch (e) {
      console.error('[SETTINGS] Could not load settings from localStorage', e);
    }
  }, []);

  // Toggle auto-voice function
  const toggleAutoVoice = () => {
    const newValue = !autoVoiceEnabled;
    setAutoVoiceEnabled(newValue);
    
    // Save to localStorage
    try {
      localStorage.setItem(AUTO_VOICE_ENABLED_KEY, String(newValue));
      console.log(`[SETTINGS] Auto-voice ${newValue ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.error('[SETTINGS] Could not save auto-voice setting to localStorage', e);
    }
  };

  // Context value
  const value: UserSettingsType = {
    autoVoiceEnabled,
    toggleAutoVoice,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
} 