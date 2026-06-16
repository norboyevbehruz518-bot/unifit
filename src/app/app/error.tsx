"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError boundary]", error);
  }, [error]);

  const isNetworkLike =
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("timeout");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-semibold text-stone-900">Something went wrong</h1>
          <p className="text-body text-stone-500">
            {isNetworkLike
              ? "We couldn't reach the server. Check your connection and try again."
              : "An unexpected error occurred. If this keeps happening, try signing out and back in."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-md bg-ink-700 px-6 text-body font-medium text-white hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            Try again
          </button>
          <Link
            href="/app/profile"
            className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-6 text-body font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            Go to profile
          </Link>
        </div>

        {error.digest && (
          <p className="text-caption text-stone-400">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
