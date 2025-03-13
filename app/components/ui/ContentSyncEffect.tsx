"use client";

import React, { useEffect, useState } from 'react';
import { useSidebar } from '@/app/context/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentSyncEffectProps {
  children: React.ReactNode;
}

export default function ContentSyncEffect({ children }: ContentSyncEffectProps) {
  const { isOpen } = useSidebar();
  const [hasToggled, setHasToggled] = useState(false);
  
  // Track sidebar toggle to sync animations
  useEffect(() => {
    setHasToggled(true);
    const timer = setTimeout(() => setHasToggled(false), 600);
    return () => clearTimeout(timer);
  }, [isOpen]);
  
  return (
    <div className="h-full">
      {/* Ambient light effect that shifts with sidebar */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${isOpen ? '20%' : '5%'} 50%, rgba(99, 102, 241, 0.03), transparent 70%)`,
          opacity: hasToggled ? 0.8 : 0.3,
        }}
      />
      
      {/* Light flash effect on toggle */}
      <AnimatePresence>
        {hasToggled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none bg-gradient-to-r from-indigo-500/10 to-transparent"
          />
        )}
      </AnimatePresence>
      
      {/* Subtle content scale animation */}
      <motion.div
        animate={{
          scale: hasToggled ? 0.995 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="relative w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
} 