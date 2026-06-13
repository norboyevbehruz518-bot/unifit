"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SliderAnchor {
  value: number;
  label: string;
}

export interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "min" | "max"
  > {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Tick labels under the track, e.g. budget anchors. */
  anchors?: SliderAnchor[];
  /** Formats the live value shown above the track, e.g. "$45,000 / year". */
  formatValue?: (value: number) => string;
  hint?: string;
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  anchors,
  formatValue,
  hint,
  className,
  id: idProp,
  ...props
}: SliderProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-small font-medium text-stone-700">
        {label}
      </label>
      <p className="tnum text-h2 font-semibold text-ink-900">{display}</p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200",
          "accent-[var(--color-ink-600)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
        )}
        {...props}
      />
      {anchors && (
        <div className="flex justify-between text-caption text-stone-500" aria-hidden="true">
          {anchors.map((a) => (
            <span key={a.value}>{a.label}</span>
          ))}
        </div>
      )}
      {hint && (
        <p id={hintId} className="text-small text-stone-500">
          {hint}
        </p>
      )}
    </div>
  );
}
