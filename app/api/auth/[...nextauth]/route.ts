import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Function to fetch GitHub repositories
async function fetchGitHubRepositories(accessToken: string) {
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const repos = await response.json();
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      isPrivate: repo.private,
      updatedAt: repo.updated_at
    }));
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return [];
  }
}

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder-client-secret",
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        
        // Save the access token and provider info when using GitHub
        if (account.provider === "github" && account.access_token) {
          token.accessToken = account.access_token;
          token.provider = "github";
          
          // Fetch GitHub repositories
          const repos = await fetchGitHubRepositories(account.access_token);
          token.githubRepos = repos;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        
        // Add repositories and provider info to the session
        if (token.provider === "github") {
          session.accessToken = token.accessToken;
          session.provider = token.provider;
          session.githubRepos = token.githubRepos;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-for-development-only",
});

export { handler as GET, handler as POST }; 