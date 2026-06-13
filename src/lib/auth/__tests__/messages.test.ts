import { describe, expect, it } from "vitest";
import type { AuthError } from "@supabase/supabase-js";
import { getAuthErrorMessage } from "../messages";

function makeError(code: string): AuthError {
  return { name: "AuthApiError", message: code, code, status: 400 } as AuthError;
}

describe("getAuthErrorMessage", () => {
  it("returns a generic message when there is no error", () => {
    expect(getAuthErrorMessage(null)).toMatch(/something went wrong/i);
    expect(getAuthErrorMessage(undefined)).toMatch(/something went wrong/i);
  });

  it("maps invalid_credentials to a human message", () => {
    expect(getAuthErrorMessage(makeError("invalid_credentials"))).toMatch(
      /don't match/i,
    );
  });

  it("maps email_not_confirmed to a human message", () => {
    expect(getAuthErrorMessage(makeError("email_not_confirmed"))).toMatch(
      /confirm your email/i,
    );
  });

  it("maps user_already_exists to a human message", () => {
    expect(getAuthErrorMessage(makeError("user_already_exists"))).toMatch(
      /already exists/i,
    );
  });

  it("maps weak_password to a human message", () => {
    expect(getAuthErrorMessage(makeError("weak_password"))).toMatch(/weak/i);
  });

  it("maps over_email_send_rate_limit to a human message", () => {
    expect(getAuthErrorMessage(makeError("over_email_send_rate_limit"))).toMatch(
      /wait a minute/i,
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(getAuthErrorMessage(makeError("some_unexpected_code"))).toMatch(
      /something went wrong/i,
    );
  });

  // None of our copy should ever contain a raw error code or "AuthApiError".
  it("never leaks raw error identifiers", () => {
    const codes = [
      "invalid_credentials",
      "email_not_confirmed",
      "user_already_exists",
      "weak_password",
      "over_email_send_rate_limit",
      "same_password",
      "validation_failed",
      "totally_unknown",
    ];
    for (const code of codes) {
      const text = getAuthErrorMessage(makeError(code));
      expect(text).not.toContain("Error");
      expect(text).not.toContain(code);
    }
  });
});
