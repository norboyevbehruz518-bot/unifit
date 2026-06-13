"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioCardGroupProps {
  label: string;
  name: string;
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

/** A radio group where each option gets room for a description — aid level, rubric answers. */
export function RadioCardGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  className,
}: RadioCardGroupProps) {
  const autoId = useId();
  const errorId = `${autoId}-error`;

  return (
    <fieldset
      className={cn("flex flex-col gap-2", className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-1 text-small font-medium text-stone-700">{label}</legend>
      {options.map((o) => {
        const selected = o.value === value;
        const optionId = `${autoId}-${o.value}`;
        return (
          <label
            key={o.value}
            htmlFor={optionId}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink-600",
              selected
                ? "border-ink-600 bg-ink-50"
                : "border-stone-300 bg-white hover:border-ink-300",
            )}
          >
            <input
              type="radio"
              id={optionId}
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="mt-1 h-4 w-4 accent-[var(--color-ink-600)]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-body font-medium text-stone-900">{o.label}</span>
              {o.description && (
                <span className="text-small text-stone-500">{o.description}</span>
              )}
            </span>
          </label>
        );
      })}
      {error && (
        <p id={errorId} className="text-small font-medium text-reach-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
