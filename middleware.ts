// GitHub OAuth callback middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  try {
    // Handle GitHub OAuth callback
    if (path.startsWith('/api/auth/callback/github')) {
      console.log('Middleware handling GitHub callback:', request.url);
      
      const url = request.nextUrl;
      const searchParams = url.searchParams;
      
      // Check if this is already flagged as processed
      const isDone = searchParams.get('done') === 'true';
      
      // Log all cookies for debugging
      console.log('Callback cookies:', {
        allCookies: [...request.cookies.getAll()].map(c => c.name),
        authParams: {
          code: searchParams.has('code') ? 'present' : 'missing',
          state: searchParams.get('state'),
          error: searchParams.get('error'),
        },
        isDone
      });
      
      // If already processed, just let it through
      if (isDone) {
        console.log('Callback marked as processed, passing through');
        return NextResponse.next();
      }
      
      // If we have a code, handle the GitHub callback
      if (searchParams.has('code')) {
        console.log('Processing GitHub OAuth callback');
        
        // Get the state parameter from the URL
        const stateParam = searchParams.get('state');
        
        // Create a modified redirect that our callback page can handle
        const fixedUrl = new URL(`${url.origin}/api/auth/callback/github`);
        
        // Log the URL and origin for debugging
        console.log('Callback URL details:', {
          originalUrl: request.url,
          origin: url.origin,
          fixedUrl: fixedUrl.toString(),
          env: {
            AUTH_PROXY_URL: process.env.AUTH_PROXY_URL,
            NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL
          }
        });
        
        // Keep all original parameters
        searchParams.forEach((value, key) => {
          if (key !== 'done') {
            fixedUrl.searchParams.set(key, value);
          }
        });
        
        // Mark as done
        fixedUrl.searchParams.set('done', 'true');
        
        // Create a response with the state cookie
        const response = NextResponse.redirect(fixedUrl);
        
        // If we have a state parameter, manually set the GitHub state cookie
        if (stateParam) {
          response.cookies.set('github-auth-state', stateParam, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 900 // 15 minutes
          });
          console.log('Added state cookie for GitHub OAuth:', stateParam);
        }
        
        return response;
      }
    }
    
    // For all other paths, proceed normally
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Only run middleware on GitHub callback routes
export const config = {
  matcher: [
    '/api/auth/callback/:path*',
  ],
}; 