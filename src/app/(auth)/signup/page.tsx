"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { GOOGLE_OAUTH_ENABLED } from "@/lib/auth/feature-flags";

type Status = "idle" | "loading" | "error" | "confirm-email-sent";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/app/profile`,
      },
    });

    if (signUpError) {
      setStatus("error");
      setError(getAuthErrorMessage(signUpError));
      return;
    }

    setStatus("confirm-email-sent");
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app/profile`,
      },
    });
  }

  if (status === "confirm-email-sent") {
    return (
      <Card title="Check your email">
        <p className="text-body text-stone-700">
          We sent a confirmation link to <strong>{email}</strong>. Open it to
          finish creating your account — then come back here and log in.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Create an account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={status === "error" ? error ?? undefined : undefined}
        />

        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading" ? "One moment…" : "Create account"}
        </Button>

        {GOOGLE_OAUTH_ENABLED && (
          <Button type="button" variant="secondary" size="lg" onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>
        )}
      </form>

      <p className="mt-6 text-small text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink-600 hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
