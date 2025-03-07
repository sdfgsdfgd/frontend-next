"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaGithub, FaTimes, FaSpinner } from "react-icons/fa";
import { SiAuth0 } from "react-icons/si";

// Animation variants for different elements
const iconVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
};

const buttonVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  hover: { 
    scale: 1.03, 
    boxShadow: "0 0 15px 2px rgba(120, 120, 255, 0.3)",
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.97 }
};

interface AuthCardProps {
  onClose: () => void;
}

export default function AuthCard({ onClose }: AuthCardProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"login" | "profile">("login");
  
  // Handle auth change
  useEffect(() => {
    if (status === "authenticated") {
      setView("profile");
    } else {
      setView("login");
    }
  }, [status]);
  
  // Handle GitHub sign in
  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signIn("github", { callbackUrl: window.location.origin });
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: window.location.origin });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-80 p-6">
      {/* Header with icon and title */}
      <div className="flex items-center justify-center mb-6">
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className="flex items-center"
        >
          <span className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg">
            <SiAuth0 className="text-white text-xl" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-white">
              {view === "login" ? "Sign In" : "Your Profile"}
            </h3>
            <p className="text-gray-400 text-sm">
              {view === "login" ? "Authenticate with GitHub" : "You're signed in"}
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-2 rounded-lg bg-red-900 bg-opacity-20 border border-red-500 text-red-100 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <p className="text-gray-300 mb-6">
              Sign in with your GitHub account to access the application
            </p>
            
            <motion.button
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="flex items-center justify-center w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-750 text-white transition-colors border border-gray-700"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaGithub className="mr-3 text-white" />
                  Continue with GitHub
                </>
              )}
            </motion.button>
          </motion.div>
        )}
        
        {view === "profile" && session?.user && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="flex flex-col items-center mb-6">
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  className="w-20 h-20 rounded-full border-2 border-blue-500 p-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                </div>
              )}
              
              <h3 className="mt-4 font-medium text-white">{session.user.name}</h3>
              <p className="text-gray-400 text-sm">{session.user.email}</p>
              
              <div className="mt-2 flex items-center text-xs text-gray-400">
                <span>Signed in with</span>
                <FaGithub className="ml-1" />
              </div>
            </div>
            
            <motion.button
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Sign Out"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Close button */}
      <motion.button 
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FaTimes />
      </motion.button>
    </div>
  );
} 