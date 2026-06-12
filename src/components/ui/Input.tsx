"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Helper text below the field. */
  hint?: string;
  /** Validation message. Styled amber (never red) and announced to AT. */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-stone-700">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-10 rounded-md border bg-white px-3 text-body text-stone-900 placeholder:text-stone-400",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400",
          error ? "border-reach-600" : "border-stone-300",
          className,
        )}
        {...props}
      />
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
});
