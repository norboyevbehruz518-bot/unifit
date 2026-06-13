/**
 * Google OAuth is implemented (see /auth/callback and signInWithGoogle) but
 * hidden until we've configured the Google OAuth provider in Supabase.
 * Flip NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true once that's done.
 */
export const GOOGLE_OAUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
