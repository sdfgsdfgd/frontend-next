"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import ParticleSystem
const ParticleSystem = dynamic(() => import('./ParticleSystem'), { ssr: false });

// Three.js imports are moved to a separate component that's dynamically imported below
// to avoid SSR issues with Three.js

interface GlassSidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
  width: number;
}

// Separate component for WebGL effects to be dynamically imported
// Using proper import without extension
const GlassEffect = dynamic(
  () => 
    import('./GlassEffect').then((mod) => mod.default),
  { ssr: false }
);

export default function GlassSidebar({ isOpen, children, width }: GlassSidebarProps) {
  // Sidebar animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    closed: {
      x: `-100%`,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  // Trigger for particle burst effect on toggle
  const [triggerParticleBurst, setTriggerParticleBurst] = useState(false);
  
  useEffect(() => {
    // Trigger particle burst on sidebar toggle
    setTriggerParticleBurst(true);
    const timer = setTimeout(() => setTriggerParticleBurst(false), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <AnimatePresence>
      <motion.aside
        className="fixed top-0 left-0 h-screen overflow-y-auto z-40"
        style={{ width: `${width}px` }}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
      >
        {/* WebGL glass effect - dynamically imported */}
        <GlassEffect />
        
        {/* Particle effects */}
        <ParticleSystem 
          anchor="left" 
          intensity={isOpen ? 2 : 0.5} 
          width={width / 3}
        />
        
        {/* Content container with backdrop blur and actual sidebar content */}
        <div className="relative h-full bg-opacity-20 bg-gray-900 backdrop-blur-lg border-r border-gray-800 border-opacity-30 overflow-hidden">
          
          {/* Decorative gradient orbs in the background */}
          <div className="absolute top-1/4 left-1/3 w-48 h-48 rounded-full bg-blue-500 opacity-10 filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-36 h-36 rounded-full bg-purple-500 opacity-10 filter blur-3xl"></div>
          
          {/* Horizontal light line that moves subtly */}
          <motion.div 
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-30"
            initial={{ top: "30%" }}
            animate={{ 
              top: ["30%", "70%", "30%"],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 15,
              ease: "easeInOut"
            }}
          />
          
          {/* Inner border highlight */}
          <div className="absolute inset-0 border-r border-white border-opacity-5"></div>
          
          {/* Content with inner padding */}
          <div className="relative z-10 p-6 h-full">
            {children}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
} 