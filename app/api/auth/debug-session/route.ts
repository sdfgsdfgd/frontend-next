import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mark this route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

// Define response type
interface SessionDebugResponse {
  cookies: {
    count: number;
    names: string[];
    hasSessionToken: boolean;
    hasGithubToken: boolean;
  };
  code: string;
  requestUrl: string;
  tokenData?: any;
}

// Debug session endpoint - helps establish session directly
export async function GET(request: NextRequest) {
  try {
    // Log cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Check for next-auth.session-token
    const sessionToken = cookieStore.get('next-auth.session-token');
    
    // Check for GitHub auth cookies
    const githubToken = cookieStore.get('github-auth-state');
    
    // Check the query parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    // Create JSON response with session debug info
    const response: SessionDebugResponse = {
      cookies: {
        count: allCookies.length,
        names: allCookies.map(c => c.name),
        hasSessionToken: !!sessionToken,
        hasGithubToken: !!githubToken,
      },
      code: code ? 'present' : 'missing',
      requestUrl: request.url,
    };
    
    // If session token exists, try to log it
    if (sessionToken) {
      try {
        // Only log the token for debugging purposes
        response.tokenData = {
          exists: true,
          length: sessionToken.value.length,
          firstChars: sessionToken.value.substring(0, 10) + '...',
        };
      } catch (e) {
        console.error('Failed to process token:', e);
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Session debug failed' }, { status: 500 });
  }
} 