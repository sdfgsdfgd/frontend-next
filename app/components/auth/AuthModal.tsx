"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaGoogle, FaGithub, FaEnvelope, FaTimes } from "react-icons/fa";
import EmailForm from "./EmailForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { data: session } = useSession();
  const [authMethod, setAuthMethod] = useState<"email" | "providers" | "profile">("providers");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // If user is authenticated, show profile view
  useEffect(() => {
    if (session) {
      setAuthMethod("profile");
    }
  }, [session]);

  // Handle provider sign in
  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: window.location.origin });
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: window.location.origin });
      onClose();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modal size is now consistent since we don't display repos here
  const modalSize = "max-w-md w-full mx-auto";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`${modalSize} bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative`}
          >
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <FaTimes size={20} />
            </button>

            <div className="p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                  {authMethod === "email" 
                    ? "Sign in with Email" 
                    : authMethod === "profile" 
                      ? "Your Profile" 
                      : "Welcome"}
                </h2>

                {/* Display different content based on auth method */}
                {authMethod === "email" && (
                  <EmailForm 
                    onBack={() => setAuthMethod("providers")}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                  />
                )}

                {authMethod === "providers" && (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-center mb-6">
                      Sign in to continue to your account
                    </p>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAuthMethod("email")}
                      disabled={isLoading}
                      className="flex items-center justify-center w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <FaEnvelope className="mr-2" />
                      Continue with Email
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProviderSignIn("google")}
                      disabled={isLoading}
                      className="flex items-center justify-center w-full p-3 rounded-lg bg-white text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <FaGoogle className="mr-2 text-red-500" />
                      Continue with Google
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProviderSignIn("github")}
                      disabled={isLoading}
                      className="flex items-center justify-center w-full p-3 rounded-lg bg-gray-900 text-white hover:bg-gray-950 transition-colors"
                    >
                      <FaGithub className="mr-2" />
                      Continue with GitHub
                    </motion.button>
                  </div>
                )}

                {authMethod === "profile" && session?.user && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="flex flex-col items-center">
                      {session.user.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || "User"} 
                          className="w-24 h-24 rounded-full border-4 border-blue-500"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mt-4">{session.user.name}</h3>
                      <p className="text-gray-400">{session.user.email}</p>
                      
                      {session.provider && (
                        <div className="mt-2 flex items-center">
                          <span className="text-sm text-gray-400 mr-2">Signed in with</span>
                          {session.provider === "github" ? (
                            <FaGithub className="text-white" />
                          ) : session.provider === "google" ? (
                            <FaGoogle className="text-red-500" />
                          ) : (
                            <FaEnvelope className="text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className="flex items-center justify-center w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      Sign Out
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 