import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono, Crimson_Pro, Inter } from 'next/font/google'
import React from "react";
import dynamic from 'next/dynamic';
import AuthProvider from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SidebarProvider } from './context/SidebarContext';
import { WebSocketProvider } from './context/WebSocketContext';
import UserSettingsProvider from './context/UserSettingsContext';

// Import our client-side responsive layout component
const ResponsiveLayout = dynamic(
  () => import('./components/ui/ResponsiveLayout'),
  { ssr: false }
);

// For code and main text - elegant monospace
const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// For headings and special text - elegant serif
const crimsonPro = Crimson_Pro({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arcana, an Agentic App',
  description: 'Agentic multi-round codebase comprehension & refactoring',
}

export default function RootLayout({children,}: {
  children: React.ReactNode
}) {
  return (
    // <html lang="en" className={`${jetbrainsMono.variable} ${crimsonPro.variable} bg-gray-900 text-gray-100 font-mono`}>
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable} bg-gray-900 text-gray-100 font-mono`}>
      <body>
        <AuthProvider>
          <WebSocketProvider>
            <WorkspaceProvider>
              <SidebarProvider>
                <UserSettingsProvider>
                  <ResponsiveLayout>
                    {children}
                  </ResponsiveLayout>
                </UserSettingsProvider>
              </SidebarProvider>
            </WorkspaceProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
