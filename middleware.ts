export { default } from "next-auth/middleware";

export const config = {
  // Protect specific routes that require authentication
  //  -   -   modify this pattern to match protected routes - - -
  matcher: [
    // Uncomment when there are protected routes
    // "/protected/:path*"
  ],
}; 