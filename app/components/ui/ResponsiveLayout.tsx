"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useSidebar } from '@/app/context/SidebarContext';

// Import AnimatedSidebar with dynamic import to avoid SSR issues
const AnimatedSidebar = dynamic(
  () => import('./AnimatedSidebar'),
  { ssr: false }
);

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  // Use sidebar context to get the open state
  const { isOpen } = useSidebar();
  const [hasTransitioned, setHasTransitioned] = useState(false);
  
  // Track sidebar transitions to trigger highlight effect
  useEffect(() => {
    setHasTransitioned(true);
    const timer = setTimeout(() => setHasTransitioned(false), 1000);
    return () => clearTimeout(timer);
  }, [isOpen]);
  
  return (
    <div className={`flex min-h-screen ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* AnimatedSidebar component */}
      <AnimatedSidebar />
      
      {/* Main content area that shifts with the sidebar */}
      <div 
        className={`
          flex-1 flex flex-col min-h-screen transition-all duration-500 ease-out
          content-depth-effect sidebar-transition-highlight
          ${hasTransitioned ? 'sidebar-highlight-active' : ''}
        `}
        style={{ 
          width: 'calc(100% - 64px)',
          marginLeft: isOpen ? '256px' : '64px',
          transform: `translateX(${isOpen ? '0' : '-192px'})`,
          transformOrigin: 'left center',
        }}
      >
        {children}
      </div>
    </div>
  );
} 