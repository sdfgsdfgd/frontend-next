import { DefaultSession } from "next-auth";

// Define GitHub repository type
interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  private: boolean;
  watchers: number;
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: DefaultSession["user"];
    /** Access token for GitHub API calls */
    accessToken?: string;
    /** User ID from GitHub */
    userId?: string;
    /** Username from GitHub */
    username?: string;
    /** Always "github" since we only use GitHub auth */
    provider?: string;
    /** GitHub repositories when authenticated */
    githubRepos?: GitHubRepo[];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** Access token for GitHub API calls */
    accessToken?: string;
    /** User ID from GitHub */
    userId?: string;
    /** Username from GitHub */
    username?: string;
    /** Always "github" since we only use GitHub auth */
    provider?: string;
    /** GitHub repositories when authenticated */
    githubRepos?: GitHubRepo[];
  }
} 