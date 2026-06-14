"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { recalculateResults } from "@/lib/results/actions";

/** Shown only when the profile or algorithm has moved on since the last snapshot. */
export function RecalculateButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-4 py-3">
      <p className="text-small text-stone-700">
        Your profile has changed since these results were calculated.
      </p>
      <Button
        variant="secondary"
        onClick={() => startTransition(() => recalculateResults())}
        disabled={isPending}
      >
        {isPending ? "Recalculating…" : "Recalculate"}
      </Button>
    </div>
  );
}
