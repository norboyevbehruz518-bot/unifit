import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase auth errors to human-language copy. Falls back to a generic
 * message for anything we don't recognize, so we never show a raw
 * "AuthApiError: ..." string to a student.
 */
export function getAuthErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";

  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check for typos, or use a magic link instead.";
    case "email_not_confirmed":
      return "Almost there — confirm your email first. Check your inbox for the link we sent. Email confirmed but still having trouble? Try using a magic link to sign in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too weak. Try at least 8 characters, mixing letters and numbers.";
    case "over_email_send_rate_limit":
      return "You've requested a few emails in a row — wait a minute before trying again.";
    case "same_password":
      return "That's your current password. Choose a different one.";
    case "validation_failed":
    case "email_address_invalid":
      return "That email address doesn't look right. Double-check it and try again.";
    default:
      return "Something went wrong. Please try again in a moment.";
  }
}
