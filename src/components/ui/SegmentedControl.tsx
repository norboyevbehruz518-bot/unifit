"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  label: string;
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  className?: string;
}

/** Exclusive choice between a few short options — GPA scale, English test, etc. */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  className,
}: SegmentedControlProps) {
  const autoId = useId();
  const labelId = `${autoId}-label`;
  const hintId = `${autoId}-hint`;
  const errorId = `${autoId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className="text-small font-medium text-stone-700">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        className="inline-flex rounded-md border border-stone-300 bg-white p-1"
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex-1 rounded-sm px-3 py-1.5 text-small font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
                selected ? "bg-ink-600 text-white" : "text-stone-700 hover:bg-ink-50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-small text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small font-medium text-reach-700">
          {error}
        </p>
      )}
    </div>
  );
}
