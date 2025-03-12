"use client";

import { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSidebar } from "../context/SidebarContext";
import { ModalControlContext } from "../context/ModalContext";
import { FaGithub } from "react-icons/fa";
import WorkspaceDisplay from "@/app/components/workspace/WorkspaceDisplay";
import { Cinzel, Playfair_Display } from 'next/font/google';

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
  const [hasSidebarChanged, setHasSidebarChanged] = useState(false);

  // Track sidebar changes for animation
  useEffect(() => {
    setHasSidebarChanged(true);
    const timer = setTimeout(() => setHasSidebarChanged(false), 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-50">
      <div className="grid grid-cols-12 h-16 items-center">
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
          {/* Auth button */}
          <div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isAuthenticated
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-blue-600 hover:bg-blue-500"
              } transition-all duration-300 ease-in-out`}
            >
              {isAuthenticated ? (
                <div className="flex items-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.login || "User"}
                      className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-600"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                      {user?.login?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="text-sm truncate max-w-[100px]">
                    {user?.name || user?.login || "User"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FaGithub className="mr-2"/>
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 