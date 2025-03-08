"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "../context/WorkspaceContext";
import WorkspaceDisplay from "./workspace/WorkspaceDisplay";
import AuthModal from "./auth/AuthModal";
import { useSidebar } from '@/app/context/SidebarContext';
import dynamic from 'next/dynamic';

// Dynamically import the existing GlassEffect to avoid SSR issues
const GlassEffect = dynamic(() => import('./ui/GlassEffect'), { ssr: false });

// Helper to check if user likely has a session based on cookies
const hasLikelySession = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for next-auth.session-token cookie
  return document.cookie.includes('next-auth.session-token') || 
         document.cookie.includes('__Secure-next-auth.session-token');
};

export default function Header() {
  const { data: session, status } = useSession();
  const { workspace, isWorkspaceSelected } = useWorkspace();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [likelyAuthenticated, setLikelyAuthenticated] = useState(false);
  const { isOpen } = useSidebar();
  const [hasSidebarChanged, setHasSidebarChanged] = useState(false);
  
  // Smart first render - check for likely session
  useEffect(() => {
    setLikelyAuthenticated(hasLikelySession());
  }, []);
  
  // Determine current auth state
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const showAsAuthenticated = isAuthenticated || (isLoading && likelyAuthenticated);
  
  // Animation variants
  const buttonVariants = {
    initial: { 
      opacity: 0.5, 
      scale: 0.95,
      y: -5,
      filter: "blur(2px)"
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring", 
        stiffness: 300, 
        damping: 15,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.92,
      y: 3,
      filter: "blur(4px)",
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      transition: { type: "spring", stiffness: 400 }
    },
    tap: { 
      scale: 0.95,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      transition: { type: "spring", stiffness: 500 }
    }
  };
  
  const contentVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { delay: 0.05, duration: 0.2 }
    },
    exit: { opacity: 0, x: 10 }
  };
  
  const spinnerVariants = {
    initial: { opacity: 0, rotate: 0 },
    animate: { 
      opacity: 1, 
      rotate: 360,
      transition: { 
        rotate: { repeat: Infinity, duration: 1, ease: "linear" },
        opacity: { duration: 0.2 }
      }
    },
    exit: { opacity: 0 }
  };
  
  // Add this effect to detect sidebar state changes and trigger animations
  useEffect(() => {
    setHasSidebarChanged(true);
    const timer = setTimeout(() => setHasSidebarChanged(false), 500);
    return () => clearTimeout(timer);
  }, [isOpen]);
  
  return (
    <header 
      className={`
        bg-gray-900/90 border-b border-gray-700 transition-all duration-500
        relative z-10 overflow-hidden
      `}
    >
      {/* Add the existing glass effect */}
      <div className="absolute inset-0 overflow-hidden" style={{ opacity: 0.7 }}>
        <GlassEffect />
      </div>
      
      {/* Existing header content */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center relative z-10">
        <div className={`
          flex items-center space-x-4 transition-transform duration-500
          ${hasSidebarChanged ? 'scale-105' : 'scale-100'}
          ${isOpen ? 'translate-x-2' : '-translate-x-1'}
        `}>
          <h1 className="text-xl font-bold text-white">Arcana</h1>
          
          {/* Show workspace display if selected */}
          {isWorkspaceSelected && (
            <WorkspaceDisplay />
          )}
        </div>

        <div>
          <motion.div 
            layout
            className="relative"
            initial={false}
          >
            <AnimatePresence mode="wait">
              <motion.button
                key={isLoading ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated"}
                layoutId="authButton"
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsAuthModalOpen(true)}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  showAsAuthenticated 
                    ? "bg-gray-700 hover:bg-gray-600" 
                    : "bg-blue-600 hover:bg-blue-500"
                } transition-all duration-300 ease-in-out`}
              >
                {isLoading ? (
                  <motion.div 
                    className="flex items-center"
                    variants={contentVariants}
                  >
                    <motion.div 
                      variants={spinnerVariants}
                      className="w-6 h-6 mr-2 rounded-full border-2 border-t-transparent border-gray-300" 
                    />
                    <span>{likelyAuthenticated ? "Profile" : "Sign In"}</span>
                  </motion.div>
                ) : isAuthenticated ? (
                  <motion.div 
                    className="flex items-center" 
                    variants={contentVariants}
                  >
                    {session?.user?.image ? (
                      <motion.img 
                        layoutId="profileImage"
                        src={session.user.image} 
                        alt={session.user.name || "User"} 
                        className="w-6 h-6 rounded-full mr-2"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    ) : (
                      <motion.div 
                        layoutId="profileInitial"
                        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold mr-2"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                      </motion.div>
                    )}
                    <span>Profile</span>
                  </motion.div>
                ) : (
                  <motion.span variants={contentVariants}>
                    Sign In
                  </motion.span>
                )}
              </motion.button>
            </AnimatePresence>
          </motion.div>
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    </header>
  );
} 