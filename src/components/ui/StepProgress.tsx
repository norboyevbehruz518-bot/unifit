import { cn } from "@/lib/utils";

export interface StepProgressProps {
  /** 1-indexed. */
  current: number;
  total: number;
  label: string;
  className?: string;
}

/** Segmented step indicator for multi-step flows — "Step 2 of 5 · Direction". */
export function StepProgress({ current, total, label, className }: StepProgressProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-small font-medium text-stone-700">
        Step {current} of {total} · {label}
      </p>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${current} of ${total}: ${label}`}
        className="flex gap-1.5"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < current ? "bg-ink-600" : "bg-stone-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
