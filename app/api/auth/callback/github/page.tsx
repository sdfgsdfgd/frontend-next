"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<string>('initializing');
  
  // Skip rendering on server
  if (typeof window === 'undefined') {
    return <div>Redirecting...</div>;
  }
  
  useEffect(() => {
    // Process the GitHub callback
    const processCallback = async () => {
      try {
        setProcessingState('processing');
        
        // Parse parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        
        // Clear in-progress flag
        localStorage.removeItem('github-auth-in-progress');
        
        // Get stored state from localStorage
        const storedState = localStorage.getItem('github-auth-state');
        
        console.log('[GITHUB-CALLBACK] Processing callback:', { 
          hasCode: !!code,
          hasState: !!state,
          hasError: !!errorParam,
          stateMatches: state === storedState
        });
        
        // Handle errors
        if (errorParam) {
          console.error(`[GITHUB-CALLBACK] GitHub OAuth error: ${errorParam}`);
          setError(`Authentication error: ${errorParam}`);
          setProcessingState('error');
          router.replace('/?auth_error=github_error');
          return;
        }
        
        // Ensure code exists
        if (!code) {
          console.error('[GITHUB-CALLBACK] No code parameter in GitHub callback');
          setError('No authorization code received');
          setProcessingState('error');
          router.replace('/?auth_error=no_code');
          return;
        }
        
        // Exchange code for token
        setProcessingState('exchanging_token');
        
        // Construct URL with query parameters
        let exchangeUrl = `/api/auth/exchange-github-code?code=${encodeURIComponent(code)}`;
        if (state) {
          exchangeUrl += `&state=${encodeURIComponent(state)}`;
        }
        
        console.log('[GITHUB-CALLBACK] Exchanging code via URL:', exchangeUrl);
        
        const tokenResponse = await fetch(exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Handle token exchange errors
        if (!tokenResponse.ok) {
          let errorData = 'Unknown error';
          try {
            errorData = await tokenResponse.text();
          } catch (e) {}
          
          console.error('[GITHUB-CALLBACK] Error exchanging code for token:', errorData);
          setError('Failed to exchange code for token');
          setProcessingState('error');
          router.replace(`/?auth_error=token_exchange_failed`);
          return;
        }
        
        // Parse token data
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          console.error('[GITHUB-CALLBACK] No access token in response:', tokenData);
          setError('No access token received');
          setProcessingState('error');
          router.replace('/?auth_error=no_token');
          return;
        }
        
        // Store the token and user data in localStorage
        console.log('[GITHUB-CALLBACK] Successfully obtained access token');
        localStorage.setItem('github-access-token', tokenData.access_token);
        
        // Store user data if available
        if (tokenData.user) {
          localStorage.setItem('github-user', JSON.stringify(tokenData.user));
        }
        
        // Mark authentication as completed
        localStorage.setItem('github-auth-completed', 'true');
        
        // Trigger events to notify other parts of the app
        try {
          // Dispatch both standard storage event (for other tabs) and custom event (for current tab)
          window.dispatchEvent(new Event('storage-update'));
          
          // Also try to trigger a standard storage event for other tabs
          // Note: manually dispatched storage events might not work in all browsers
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.error('[GITHUB-CALLBACK] Error dispatching storage event:', e);
        }
        
        setProcessingState('completed');
        
        // Redirect to home page
        console.log('[GITHUB-CALLBACK] Authentication completed, redirecting to home page');
        router.replace('/');
      } catch (error) {
        console.error('[GITHUB-CALLBACK] Unexpected error:', error);
        setError('Unexpected error during authentication');
        setProcessingState('error');
        setTimeout(() => router.replace('/?auth_error=unexpected'), 2000);
      }
    };
    
    processCallback();
  }, [searchParams, router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#0d1117'
    }}>
      <div>
        <h1 style={{ color: '#ffffff', marginBottom: '1rem' }}>
          {error ? 'Authentication Failed' : 'GitHub Authentication'}
        </h1>
        
        {error ? (
          <p style={{ color: '#f85149', marginBottom: '1rem' }}>
            {error}
          </p>
        ) : (
          <p style={{ color: '#c9d1d9' }}>
            {processingState === 'initializing' && 'Preparing authentication...'}
            {processingState === 'processing' && 'Processing GitHub authorization...'}
            {processingState === 'exchanging_token' && 'Exchanging code for token...'}
            {processingState === 'completed' && 'Authentication complete! Redirecting...'}
          </p>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'inline-block',
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: `3px solid ${error ? '#f85149' : '#58a6ff'}`,
            borderRadius: '50%',
            animation: error ? 'none' : 'spin 1s linear infinite',
          }}></div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 