import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import React from "react";
import dynamic from 'next/dynamic';
import AuthContext from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SidebarProvider } from './context/SidebarContext';

// Import ConnectionStatus component with dynamic import to avoid hydration errors
const ConnectionStatus = dynamic(
  () => import('./components/ConnectionStatus'),
  { ssr: false }
);

// Import AnimatedSidebar with dynamic import to avoid SSR issues
const AnimatedSidebar = dynamic(
  () => import('./components/ui/AnimatedSidebar'),
  { ssr: false }
);

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Arcana, an Agentic App',
  description: 'Agentic multi-round codebase comprehension & refactoring',
}

export default function RootLayout({children,}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} bg-gray-900 text-gray-100`}
      >
        <AuthContext>
          <WorkspaceProvider>
            <SidebarProvider>
              <div className="flex min-h-screen">
                {/* Replace the static sidebar with our animated one */}
                <AnimatedSidebar>
                  <nav>
                    <ul className="space-y-2">
                      <li className="text-gray-300 hover:text-white transition">Chat 1</li>
                      <li className="text-gray-300 hover:text-white transition">Chat 2</li>
                      <li className="text-gray-300 hover:text-white transition">Chat 3</li>
                    </ul>
                  </nav>

                  {/* Connection Status Indicator */}
                  <div className="absolute bottom-4 left-4 md:left-6 text-black p-2 z-50">
                    {/* use a dynamic import with next/dynamic to avoid hydration errors with the WebSocket */}
                    <ConnectionStatus url="ws://localhost/ws" />
                  </div>
                </AnimatedSidebar>

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col overflow-visible min-h-screen w-auto max-w-full">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </WorkspaceProvider>
        </AuthContext>
      </body>
    </html>
  )
}
