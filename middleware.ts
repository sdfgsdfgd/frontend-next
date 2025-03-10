// Next.js 13 App Router specific middleware for auth
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
        hasState: request.cookies.has('next-auth.state'),
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
      
      // If we have a code but no state cookie (common issue in Next.js 13), 
      // handle with our workaround
      if (searchParams.has('code')) {
        console.log('Processing GitHub OAuth callback');
        
        // Get the state parameter from the URL
        const stateParam = searchParams.get('state');
        
        // Create a modified redirect that our callback page can handle
        const fixedUrl = new URL(`${url.origin}/api/auth/callback/github`);
        
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
        
        // If we have a state parameter, manually set the state cookie
        if (stateParam) {
          response.cookies.set('next-auth.state', stateParam, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 900 // 15 minutes
          });
          console.log('Added state cookie for NextAuth:', stateParam);
        }
        
        return response;
      }
      
      // For any other callback requests, just pass them through
      return NextResponse.next();
    }
    
    // Special handling for auth signin endpoints
    if (path.startsWith('/api/auth/signin')) {
      console.log('Middleware handling auth signin request', {
        url: request.url,
        method: request.method
      });
      
      // For POST requests to signin endpoints, we need to ensure correct handling
      if (request.method === 'POST') {
        console.log('Auth signin POST request detected');
        
        // Let the request through, but log it for debugging
        return NextResponse.next();
      }
    }
    
    // For all other paths, proceed normally
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Only run middleware on auth-related routes
export const config = {
  matcher: [
    '/api/auth/callback/:path*',
    '/api/auth/signin/:path*',
  ],
}; 