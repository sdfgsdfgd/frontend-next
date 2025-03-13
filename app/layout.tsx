import './globals.css'
import type { Metadata } from 'next'
import { JetBrains_Mono, Crimson_Pro } from 'next/font/google'
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

// For code and main text - elegant monospace
const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
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
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} ${crimsonPro.variable} bg-gray-900 text-gray-100 font-mono`}
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
