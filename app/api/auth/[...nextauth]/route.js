import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Mark route as dynamic to prevent static rendering
export const dynamic = 'force-dynamic';

// Function to fetch GitHub repositories
async function fetchGitHubRepositories(accessToken) {
  try {
    console.log('[NEXTAUTH] Fetching GitHub repositories');
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NextAuth.js'
      }
    });
    
    if (!response.ok) {
      console.error('[NEXTAUTH] Error fetching GitHub repos:', response.status, response.statusText);
      return [];
    }
    
    const repos = await response.json();
    
    if (!Array.isArray(repos)) {
      console.error('[NEXTAUTH] GitHub API did not return an array');
      return [];
    }
    
    console.log(`[NEXTAUTH] Fetched ${repos.length} repositories`);
    
    return repos.map((repo) => ({
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch
    }));
  } catch (error) {
    console.error('[NEXTAUTH] Error in fetchGitHubRepositories:', error);
    return [];
  }
}

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in: save the access token
      if (account && profile) {
        // Add account info to token
        token.accessToken = account.access_token;
        token.provider = account.provider;
        
        // Add GitHub-specific data
        if (account.provider === 'github' && profile) {
          // Add GitHub profile data
          token.userId = String(profile.id);
          token.username = profile.login;
          
          // Fetch GitHub repositories
          try {
            if (account.access_token) {
              const repositories = await fetchGitHubRepositories(account.access_token);
              token.githubRepos = repositories;
              console.log(`[NEXTAUTH] Added ${repositories.length} repos to token`);
            }
          } catch (error) {
            console.error('[NEXTAUTH] Error adding GitHub repos to token:', error);
          }
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Add token data to session
      if (token && session) {
        // Add basic token data
        session.accessToken = token.accessToken;
        session.provider = token.provider;
        session.userId = token.userId;
        session.username = token.username;
        
        // Add GitHub repositories
        if (token.githubRepos) {
          session.githubRepos = token.githubRepos;
          console.log(`[NEXTAUTH] Added ${token.githubRepos.length} repos to session`);
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/', 
    newUser: '/'
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
});

export { handler as GET, handler as POST }; 