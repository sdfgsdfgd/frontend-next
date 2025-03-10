import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import React from "react";
import dynamic from 'next/dynamic';
import AuthProvider from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SidebarProvider } from './context/SidebarContext';

// Import our client-side responsive layout component
const ResponsiveLayout = dynamic(
  () => import('./components/ui/ResponsiveLayout'),
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
        <AuthProvider>
          <WorkspaceProvider>
            <SidebarProvider>
              <ResponsiveLayout>
                {children}
              </ResponsiveLayout>
            </SidebarProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
