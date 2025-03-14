"use client";

import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSidebar } from "../context/SidebarContext";
import { ModalControlContext } from "../context/ModalContext";
import { useUserSettings } from "../context/UserSettingsContext";
import { FaGithub, FaHeadphones, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import WorkspaceDisplay from "@/app/components/workspace/WorkspaceDisplay";
import { Cinzel, Playfair_Display } from 'next/font/google';
import { motion } from "framer-motion";

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export default function Header() {
  const {isAuthenticated, user} = useAuth();
  const {workspace, isWorkspaceSelected} = useWorkspace();
  const {toggleSidebar, isOpen} = useSidebar();
  const {setAuthModalOpen} = useContext(ModalControlContext);
  const {autoVoiceEnabled, toggleAutoVoice} = useUserSettings();
  const [hasSidebarChanged, setHasSidebarChanged] = useState(false);

  // Track sidebar changes for animation
  useEffect(() => {
    setHasSidebarChanged(true);
    const timer = setTimeout(() => setHasSidebarChanged(false), 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <header className="relative border-b border-gray-700/50 shadow-md sticky top-0 z-50 overflow-hidden">
      {/* Background with vertical transparency gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-[#050A15]/90 to-[#050A15]/60 backdrop-blur-sm"></div>

      {/* Subtle edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

      <div className="grid grid-cols-12 h-20 items-center relative z-10">
        {/* Left side with logo and workspace info */}
        <div className="col-span-3 flex items-center space-x-2 pl-4">
          <div className={`
            flex items-center space-x-4 transition-transform duration-500
            ${hasSidebarChanged ? 'scale-105' : 'scale-100'}
            ${isOpen ? 'translate-x-2' : '-translate-x-1'}
          `}>
            <h1 className="relative mx-3">
              <span className={`${cinzel.className} font-normal tracking-widest text-[0.6rem] absolute -top-2.5 left-0.5 text-blue-200/10 uppercase letter-spacing-[3.25em]`}>The</span>
              <span className={`${cinzel.className} relative text-xl font-medium tracking-wide bg-gradient-to-b from-blue-900/25 via-blue-50/50 to-blue-100/40 bg-clip-text text-transparent [text-shadow:0_0_15px_rgba(255,255,255,0.2)] px-0.5`}>
              {/*<span className={`${playfair.className} relative text-xl font-medium tracking-wide bg-gradient-to-b from-blue-900/25 via-blue-50/50 to-blue-100/40 bg-clip-text text-transparent [text-shadow:0_0_15px_rgba(255,255,255,0.2)] px-0.5`}>*/}
                Arcana
              </span>
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-[0.5px] bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></span>
            </h1>
          </div>
        </div>

        {/* Middle area - can be empty or contain other elements */}
        <div className="col-span-5">
          {isWorkspaceSelected && (
            <WorkspaceDisplay/>
          )}
        </div>

        {/* Right side with auth and workspace controls */}
        <div className="col-span-4 flex items-center justify-end space-x-3 pr-16">
          {/* Auto-voice toggle button - only show if user is authenticated */}
          {isAuthenticated && (
            <motion.button
              onClick={toggleAutoVoice}
              className="relative overflow-hidden rounded-lg cursor-pointer group mr-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label={autoVoiceEnabled ? "Disable auto voice" : "Enable auto voice"}
              title={autoVoiceEnabled ? "Disable auto voice" : "Enable auto voice"}
            >
              {/* Background gradient blur effect */}
              <div className="absolute inset-0 backdrop-blur-md border border-gray-800/40 rounded-lg
                      group-hover:border-gray-600/60 group-hover:shadow-lg group-hover:shadow-black/30
                      transition-all duration-300 bg-gradient-to-r from-black/40 via-gray-900/50 to-black/40 group-hover:from-black/50 group-hover:via-gray-900/60 group-hover:to-black/50">
              </div>

              {/* Ambient glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg bg-blue-500/5">
              </div>

              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                            ease-in-out opacity-0 group-hover:opacity-100">
              </div>

              {/* Content */}
              <div className="relative z-10 py-2 px-3 flex items-center justify-center">
                {autoVoiceEnabled ? (
                  <div className="flex items-center text-[rgba(138,101,52,0.9)]">
                    <FaVolumeUp size={18} className="text-[rgba(138,101,52,0.9)] group-hover:text-[rgba(170,125,65,0.95)] transition-colors" />
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <FaVolumeMute size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                )}
              </div>
            </motion.button>
          )}

          {/* Auth button */}
          <div>
            <motion.button
              onClick={() => setAuthModalOpen(true)}
              className={`relative overflow-hidden rounded-lg cursor-pointer group my-3.5`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient blur effect */}
              <div className={`absolute inset-0 backdrop-blur-md border border-gray-800/40 rounded-lg
                      group-hover:border-gray-600/60 group-hover:shadow-lg group-hover:shadow-black/30
                      transition-all duration-300 ${
                        isAuthenticated 
                          ? "bg-gradient-to-r from-black/40 via-gray-900/50 to-black/40 group-hover:from-black/50 group-hover:via-gray-900/60 group-hover:to-black/50" 
                          : "bg-gradient-to-r from-blue-900/40 via-blue-800/50 to-blue-900/40 group-hover:from-blue-900/50 group-hover:via-blue-800/60 group-hover:to-blue-900/50"
                      }`}>
              </div>

              {/* Ambient glow effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg ${
                isAuthenticated 
                  ? "bg-blue-500/5" 
                  : "bg-blue-500/10"
              }`}></div>

              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                            ease-in-out opacity-0 group-hover:opacity-100">
              </div>

              {/* Subtle edge highlight */}
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500
                              ${isAuthenticated
                                ? "bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-pink-500/10"
                                : "bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-300/15"
                              }`}>
              </div>

              {/* Content */}
              <div className="relative z-10 py-2.5 px-4 flex items-center">
                {isAuthenticated ? (
                  <div className="flex items-center">
                    {user?.avatar_url ? (
                      <div className="p-0.5 rounded-full bg-gray-900/60 backdrop-blur-sm flex-shrink-0
                                    border border-gray-700/30 group-hover:border-blue-500/50
                                    transition-all duration-300 mr-2">
                        <img
                          src={user.avatar_url}
                          alt={user?.login || "User"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-800/60 backdrop-blur-sm flex items-center justify-center mr-2
                                     border border-blue-700/50 group-hover:border-blue-500/80 transition-all duration-300
                                     group-hover:bg-blue-700/70">
                        {user?.login?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-sm truncate max-w-[100px] text-gray-200 group-hover:text-white transition-colors">
                      {user?.name || user?.login || "User"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-blue-900/60 backdrop-blur-sm mr-2 flex-shrink-0
                                  border border-blue-700/30 group-hover:border-blue-500/70
                                  transition-all duration-300 group-hover:bg-blue-800/80">
                      <FaGithub className="text-blue-300 group-hover:text-blue-200" size={14} />
                    </div>
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors">Sign In</span>
                  </div>
                )}
              </div>

              {/* Subtle decorative element - adjusted position */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-r from-blue-500/30 to-purple-500/30
                           rounded-full blur-xl opacity-0 group-hover:opacity-25 transition-opacity duration-700"></div>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
} 