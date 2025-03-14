// API route to exchange GitHub code for token
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    console.log('[TOKEN-EXCHANGE] Received request for token exchange');
    
    // Check if we have a request body
    let code, state;
    
    try {
      // Get the request body
      const body = await request.json();
      console.log('[TOKEN-EXCHANGE] Parsed request body:', body);
      
      code = body.code;
      state = body.state;
    } catch (error) {
      console.error('[TOKEN-EXCHANGE] Error parsing request body:', error);
      
      // Try to extract code and state from URL if present
      const url = new URL(request.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      
      console.log('[TOKEN-EXCHANGE] Fallback to URL params:', { code: !!code, state: !!state });
    }
    
    if (!code) {
      console.error('[TOKEN-EXCHANGE] No code provided');
      return new Response(
        JSON.stringify({ error: 'No code provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[TOKEN-EXCHANGE] Exchanging code for token with GitHub');
    
    // Prepare the request to GitHub's token endpoint
    const params = new URLSearchParams();
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    params.append('code', code);
    
    // Add redirect_uri (very important)
    const redirectUri = `${process.env.AUTH_PROXY_URL}/api/auth/callback/github`;
    params.append('redirect_uri', redirectUri);
    
    if (state) {
      params.append('state', state);
    }
    
    console.log('[TOKEN-EXCHANGE] GitHub token request params:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      clientId: process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.substring(0, 5) + '...' : 'MISSING',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ? 'present' : 'missing',
      redirectUri,
      AUTH_PROXY_URL: process.env.AUTH_PROXY_URL,
      NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL
    });
    
    // Make the token exchange request to GitHub
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    // Log response status
    console.log('[TOKEN-EXCHANGE] GitHub response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('[TOKEN-EXCHANGE] GitHub token exchange failed:', response.status, response.statusText);
      
      // Try to get more details
      let errorText;
      try {
        errorText = await response.text();
        console.error('[TOKEN-EXCHANGE] GitHub error response:', errorText);
      } catch (e) {
        console.error('[TOKEN-EXCHANGE] Could not read error response:', e);
        errorText = 'Could not read error details';
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token', details: errorText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the response from GitHub
    const responseText = await response.text();
    console.log('[TOKEN-EXCHANGE] GitHub response:', responseText.substring(0, 50) + '...');
    
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (error) {
      console.error('[TOKEN-EXCHANGE] Error parsing GitHub response:', error);
      // Try to parse as form-encoded
      const formData = {};
      responseText.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        formData[key] = decodeURIComponent(value);
      });
      tokenData = formData;
      console.log('[TOKEN-EXCHANGE] Parsed form data:', tokenData);
    }
    
    if (!tokenData.access_token) {
      console.error('[TOKEN-EXCHANGE] No access token in GitHub response:', tokenData);
      return new Response(
        JSON.stringify({ error: 'No access token in response' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[TOKEN-EXCHANGE] Successfully exchanged code for token');
    
    // Fetch user information to validate the token
    console.log('[TOKEN-EXCHANGE] Validating token by fetching user data');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'User-Agent': 'GitHub-OAuth-App'
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('[TOKEN-EXCHANGE] Verified token works for user:', userData.login);
      
      // Return the token data
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || 'bearer',
          scope: tokenData.scope,
          user: {
            id: userData.id,
            login: userData.login,
            name: userData.name,
            avatar_url: userData.avatar_url
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('[TOKEN-EXCHANGE] Failed to validate token:', userResponse.status, userResponse.statusText);
      try {
        const errorText = await userResponse.text();
        console.error('[TOKEN-EXCHANGE] User API error:', errorText);
      } catch (e) {}
      
      // Still return the token even if validation failed
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || 'bearer',
          scope: tokenData.scope
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[TOKEN-EXCHANGE] Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 