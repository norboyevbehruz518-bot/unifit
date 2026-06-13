"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
}

export interface SearchableMultiSelectGroup {
  label: string;
  options: SearchableMultiSelectOption[];
}

export interface SearchableMultiSelectProps {
  label: string;
  groups: SearchableMultiSelectGroup[];
  /** Ordered — index 0 is the top preference. */
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  hint?: string;
  error?: string;
  searchPlaceholder?: string;
  className?: string;
}

/** Grouped, searchable picker with ordered chips — used for the major picker. */
export function SearchableMultiSelect({
  label,
  groups,
  value,
  onChange,
  max,
  hint,
  error,
  searchPlaceholder = "Search…",
  className,
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState("");
  const autoId = useId();
  const hintId = `${autoId}-hint`;
  const errorId = `${autoId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  const allOptions = groups.flatMap((g) => g.options);
  const labelFor = (v: string) => allOptions.find((o) => o.value === v)?.label ?? v;
  const atMax = value.length >= max;
  const normalizedQuery = query.trim().toLowerCase();

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else if (!atMax) {
      onChange([...value, optionValue]);
    }
  }

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: group.options.filter((o) =>
        o.label.toLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={autoId} className="text-small font-medium text-stone-700">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => toggle(v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-small font-medium text-ink-700 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
              >
                <span className="tnum">{i + 1}.</span> {labelFor(v)}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove {labelFor(v)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={autoId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-describedby={describedBy}
        className={cn(
          "h-10 rounded-md border bg-white px-3 text-body text-stone-900 placeholder:text-stone-400",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          error ? "border-reach-600" : "border-stone-300",
        )}
      />

      <div className="max-h-72 overflow-y-auto rounded-md border border-stone-200">
        {visibleGroups.length === 0 && (
          <p className="px-3 py-4 text-center text-small text-stone-500">
            No majors match &ldquo;{query}&rdquo;.
          </p>
        )}
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="sticky top-0 bg-stone-50 px-3 py-1.5 text-caption font-semibold tracking-wide text-stone-500 uppercase">
              {group.label}
            </p>
            <ul>
              {group.options.map((o) => {
                const selected = value.includes(o.value);
                const disabled = !selected && atMax;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => toggle(o.value)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-body",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
                        disabled
                          ? "cursor-not-allowed text-stone-400"
                          : "text-stone-900 hover:bg-ink-50",
                        selected && "bg-ink-50 font-medium text-ink-700",
                      )}
                    >
                      {o.label}
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {atMax && (
        <p className="text-small text-stone-500">
          You&apos;ve picked {max} — remove one to swap.
        </p>
      )}
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
