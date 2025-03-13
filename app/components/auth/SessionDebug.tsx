"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function SessionDebug() {
  const { isAuthenticated, user, token, error } = useAuth();
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-4 w-80 max-h-96 overflow-auto text-xs font-mono z-50 border-t border-l border-gray-700 rounded-tl-lg shadow-lg">
      <h3 className="text-lg mb-2 font-bold">Auth Debug</h3>
      
      <div className="grid gap-1">
        <div><span className="text-gray-400">Status:</span> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
        <div><span className="text-gray-400">Has user:</span> {user ? 'Yes' : 'No'}</div>
        <div><span className="text-gray-400">Username:</span> {user?.login || 'N/A'}</div>
        <div><span className="text-gray-400">Name:</span> {user?.name || 'N/A'}</div>
        <div><span className="text-gray-400">Has token:</span> {token ? 'Yes' : 'No'}</div>
        {error && (
          <div><span className="text-red-400">Error:</span> {error}</div>
        )}
      </div>
      
      <h4 className="text-md mt-4 mb-1 font-bold">Cookies</h4>
      <div className="mb-4">
        {typeof document !== 'undefined' && document.cookie ? (
          document.cookie.split(';').map((cookie, index) => (
            <div key={index} className="truncate">
              {cookie.trim()}
            </div>
          ))
        ) : (
          <div>No cookies found</div>
        )}
      </div>
      
      <h4 className="text-md mt-4 mb-1 font-bold">localStorage</h4>
      <div>
        {typeof window !== 'undefined' && (
          <div>
            <div><span className="text-gray-400">github-access-token:</span> {localStorage.getItem('github-access-token') ? 'Present' : 'Missing'} {token ? '(matches context)' : '(not in context)'}</div>
            <div><span className="text-gray-400">github-auth-completed:</span> {localStorage.getItem('github-auth-completed')}</div>
            <div><span className="text-gray-400">github-auth-timestamp:</span> {localStorage.getItem('github-auth-timestamp')}</div>
          </div>
        )}
      </div>
    </div>
  );
} 