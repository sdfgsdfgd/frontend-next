"use client";

import { useState, useEffect, useRef } from 'react';

/**
 * This hook provides a consistent visibility state across all components
 * and ensures animations fade out properly when the page loses focus.
 */
export default function useVisibilityState(fadeTime = 2600) {
  // Actual visibility from document.visibilityState
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  
  // Opacity value used for fading
  const [opacity, setOpacity] = useState(1);
  
  // Used to track fade animations
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFocusTimeRef = useRef<number>(Date.now());
  
  // Handle document visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      const isDocVisible = document.visibilityState === 'visible';
      console.log(`Visibility changed: ${isDocVisible ? 'visible' : 'hidden'}`);
      
      // Clear any pending fade timer
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      
      if (isDocVisible) {
        // Page became visible - fade in quickly
        setIsVisible(true);
        lastFocusTimeRef.current = Date.now();
        
        // Start a smooth fade-in
        const startTime = Date.now();
        const initialOpacity = opacity;
        
        const fadeIn = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / (fadeTime / 2)); // Fade in faster
          
          // Cubic ease-out for smoother fade-in
          const newOpacity = initialOpacity + (1 - initialOpacity) * (1 - Math.pow(1 - progress, 3));
          setOpacity(newOpacity);
          
          if (progress < 1) {
            fadeTimerRef.current = setTimeout(fadeIn, 16);
          } else {
            setOpacity(1);
            fadeTimerRef.current = null;
          }
        };
        
        fadeIn();
      } else {
        // Page hidden - fade out very slowly
        setIsVisible(false);
        
        // Start a slow fade-out
        const startTime = Date.now();
        const initialOpacity = opacity;
        
        const fadeOut = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / fadeTime);
          
          const newOpacity = initialOpacity * (1 - progress);
          setOpacity(newOpacity);
          
          if (progress < 1 && newOpacity > 0) {
            fadeTimerRef.current = setTimeout(fadeOut, 16);
          } else {
            setOpacity(0);
            fadeTimerRef.current = null;
          }
        };
        
        fadeOut();
      }
    };
    
    // Set up visibility event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      if (document.visibilityState === 'visible') {
        handleVisibilityChange();
      }
    });
    window.addEventListener('blur', () => {
      if (document.visibilityState !== 'visible') {
        handleVisibilityChange();
      }
    });
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [opacity, fadeTime]);
  
  return { isVisible, opacity };
} 