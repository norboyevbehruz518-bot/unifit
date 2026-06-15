"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { GOOGLE_OAUTH_ENABLED } from "@/lib/auth/feature-flags";

type Mode = "password" | "magic-link";
type Status = "idle" | "loading" | "error" | "magic-link-sent";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function sendMagicLink(targetEmail: string) {
    setStatus("loading");
    setError(null);
    setErrorCode(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/app/profile`,
      },
    });

    if (otpError) {
      setStatus("error");
      setError(getAuthErrorMessage(otpError));
      setErrorCode(otpError.code ?? null);
      return;
    }

    setStatus("magic-link-sent");
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setErrorCode(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setStatus("error");
      setError(getAuthErrorMessage(signInError));
      setErrorCode(signInError.code ?? null);
      return;
    }

    router.push("/app/profile");
    router.refresh();
  }

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMagicLink(email);
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

  if (status === "magic-link-sent") {
    return (
      <Card title="Check your email">
        <p className="text-body text-stone-700">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this
          device to log in — the link expires after a little while, so come
          back here and try again if it doesn&apos;t work.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Log in">
      <form
        onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode === "password" && (
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={status === "error" ? error ?? undefined : undefined}
          />
        )}

        {mode === "magic-link" && status === "error" && (
          <p className="text-small font-medium text-reach-700">{error}</p>
        )}

        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading"
            ? "One moment…"
            : mode === "password"
              ? "Log in"
              : "Send magic link"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "password" ? "magic-link" : "password");
            setStatus("idle");
            setError(null);
          }}
          className="text-small font-medium text-ink-600 hover:underline"
        >
          {mode === "password"
            ? "Use a magic link instead"
            : "Use a password instead"}
        </button>

        {GOOGLE_OAUTH_ENABLED && (
          <Button type="button" variant="secondary" size="lg" onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>
        )}

        {mode === "password" && status === "error" && errorCode === "email_not_confirmed" && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={!email}
            onClick={() => sendMagicLink(email)}
          >
            Send me a magic link instead
          </Button>
        )}
      </form>

      <p className="mt-6 text-small text-stone-600">
        New to UniFit?{" "}
        <Link href="/signup" className="font-medium text-ink-600 hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
