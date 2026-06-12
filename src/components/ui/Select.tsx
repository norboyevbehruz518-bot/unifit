"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  /** Shown as a disabled first option when no value is selected. */
  placeholder?: string;
  hint?: string;
  error?: string;
}

/** Native <select>: keyboard navigation and mobile pickers come for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, options, placeholder, hint, error, className, id: idProp, defaultValue, ...props },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? autoId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy =
      [hint ? hintId : null, error ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-small font-medium text-stone-700">
          {label}
        </label>
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          defaultValue={
            defaultValue ?? (placeholder && props.value === undefined ? "" : undefined)
          }
          className={cn(
            "h-10 rounded-md border bg-white px-3 text-body text-stone-900",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
            "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400",
            error ? "border-reach-600" : "border-stone-300",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
  },
);
