"use client";

import React from 'react';
import CanvasSidebarEffect from './CanvasSidebarEffect';
import dynamic from 'next/dynamic';
import { useSidebar } from '@/app/context/SidebarContext';

// Dynamic import for GlassSidebar to avoid SSR issues with Three.js
const GlassSidebar = dynamic(() => import('./GlassSidebar'), { ssr: false });

// Import ConnectionStatus component with dynamic import to avoid hydration errors
const ConnectionStatus = dynamic(
  () => import('../ConnectionStatus'),
  { ssr: false }
);

interface AnimatedSidebarProps {
  children?: React.ReactNode;
  width?: number;
}

export default function AnimatedSidebar({ 
  children,
  width = 256
}: AnimatedSidebarProps) {
  // Use sidebar context instead of local state
  const { isOpen, toggleSidebar } = useSidebar();
  
  return (
    <>
      {/* Canvas effect layer */}
      <CanvasSidebarEffect 
        isOpen={isOpen} 
        toggleSidebar={toggleSidebar} 
        width={width} 
      />
      
      {/* Glass sidebar with content */}
      <GlassSidebar isOpen={isOpen} width={width}>
        {children || (
          <>
            <div className="h-full flex flex-col justify-between">
              <nav className="mt-4">
                <h3 className="text-lg font-semibold mb-3 text-indigo-400">Tasks</h3>
                <ul className="space-y-3">
                  <li className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition px-3 py-2 rounded">
                    Chat 1
                  </li>
                  <li className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition px-3 py-2 rounded">
                    Chat 2
                  </li>
                  <li className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition px-3 py-2 rounded">
                    Chat 3
                  </li>
                </ul>
              </nav>

              {/* Connection Status Indicator */}
              <div className="mt-auto mb-4 mx-4 p-2 z-50 rounded-md bg-gray-800/70">
                <ConnectionStatus url={process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:80/ws"} />
              </div>
            </div>
          </>
        )}
      </GlassSidebar>
    </>
  );
} 