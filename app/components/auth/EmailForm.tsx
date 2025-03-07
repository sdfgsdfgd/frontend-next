"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";

interface EmailFormProps {
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EmailForm({ onBack, isLoading, setIsLoading }: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("An error occurred during authentication");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-400 hover:text-blue-300 transition mb-2"
        disabled={isLoading}
      >
        <FaArrowLeft className="mr-2" />
        Back to all options
      </button>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-100"
          >
            {error}
          </motion.div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-gray-300 mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={isLogin ? "Your password" : "Create a password"}
            disabled={isLoading}
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : null}
          {isLogin ? "Sign In" : "Create Account"}
        </motion.button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 transition text-sm"
            disabled={isLoading}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
} 