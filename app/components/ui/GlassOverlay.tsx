"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface GlassOverlayProps {
  isVisible: boolean;
  children: ReactNode;
  blurIntensity?: number;
  overlayOpacity?: number;
}

// Animation variants for container
const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

// Animation variants for the modal content
const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 400,
      delay: 0.1,
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: {
      duration: 0.2,
    }
  }
};

export default function GlassOverlay({ 
  isVisible, 
  children, 
  blurIntensity = 3, 
  overlayOpacity = 0.3
}: GlassOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          {/* Subtle backdrop - minimal blur to still see UI clearly */}
          <div 
            className="absolute inset-0" 
            style={{ 
              backdropFilter: `blur(${blurIntensity}px)`,
              backgroundColor: `rgba(10, 12, 20, ${overlayOpacity})` 
            }}
          />
          
          {/* Content with glass effect and subtle border highlight */}
          <motion.div 
            className="relative z-10"
            variants={contentVariants}
          >
            <div className="relative">
              {/* Subtle glow effect behind modal */}
              <div 
                className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-20 blur-lg"
                style={{ 
                  transform: "translate(0px, 4px) scale(0.98)", 
                  zIndex: -1 
                }}
              />
              
              {/* Glass card content */}
              <div 
                className="relative bg-gray-900 bg-opacity-85 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-800"
                style={{ 
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  maxWidth: "95vw",
                }}
              >
                {/* Inner content */}
                <div className="relative z-10 p-0.5">
                  {/* Inner glass effect with border highlight */}
                  <div className="rounded-lg p-0.5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/10">
                    <div className="rounded-lg bg-gray-900 bg-opacity-90">
                      {children}
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-10"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-3xl opacity-10"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 