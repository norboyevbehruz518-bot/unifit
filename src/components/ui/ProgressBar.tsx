import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0–100; values outside the range are clamped. */
  value: number;
  /** Accessible name; visible when `showLabel`. */
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabel && label && (
        <span className="text-small text-stone-700">{label}</span>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-ink-600 transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
