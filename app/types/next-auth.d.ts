import { DefaultSession } from "next-auth";

// Define GitHub repository type
interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string;
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string;
    } & DefaultSession["user"];
    /** Access token for provider API calls */
    accessToken?: string;
    /** Provider name (github, google, etc) */
    provider?: string;
    /** GitHub repositories when authenticated with GitHub */
    githubRepos?: GitHubRepo[];
  }

  interface User {
    /** The user's id */
    id: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's id */
    id?: string;
    /** Access token for provider API calls */
    accessToken?: string;
    /** Provider name (github, google, etc) */
    provider?: string;
    /** GitHub repositories when authenticated with GitHub */
    githubRepos?: GitHubRepo[];
  }
} 