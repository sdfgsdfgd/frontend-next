"use client";

import React from "react";
import AuthProvider from "../context/AuthContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { SidebarProvider } from "../context/SidebarContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import UserSettingsProvider from "../context/UserSettingsContext";
import { OpenAIProvider } from "../context/OpenAIContext";
import dynamic from "next/dynamic";

// Dynamically import ResponsiveLayout since it is a client side component
const ResponsiveLayout = dynamic(() => import('./ui/ResponsiveLayout'), { ssr: false });

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OpenAIProvider>
        <WebSocketProvider>
          <WorkspaceProvider>
            <SidebarProvider>
              <UserSettingsProvider>
                <ResponsiveLayout>{children}</ResponsiveLayout>
              </UserSettingsProvider>
            </SidebarProvider>
          </WorkspaceProvider>
        </WebSocketProvider>
      </OpenAIProvider>
    </AuthProvider>
  );
}
