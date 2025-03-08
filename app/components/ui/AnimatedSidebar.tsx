"use client";

import React from 'react';
import CanvasSidebarEffect from './CanvasSidebarEffect';
import dynamic from 'next/dynamic';
import { useSidebar } from '@/app/context/SidebarContext';

// Dynamic import for GlassSidebar to avoid SSR issues with Three.js
const GlassSidebar = dynamic(() => import('./GlassSidebar'), { ssr: false });

interface AnimatedSidebarProps {
  children: React.ReactNode;
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
        {children}
      </GlassSidebar>
    </>
  );
} 