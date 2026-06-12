import { cn } from "@/lib/utils";
import { type BadgeTone } from "@/components/ui/Badge";

export interface ScoreBarProps {
  label: string;
  /** 0–100; drives bar width. Clamped. */
  value: number;
  /**
   * What the user reads, e.g. "62" or "55–70". Supporting ranges here is how
   * the UI honors honest-uncertainty — pass a range whenever one exists.
   */
  display?: string;
  tone?: Extract<BadgeTone, "reach" | "target" | "safety" | "ink">;
  className?: string;
}

const fillClasses = {
  ink: "bg-ink-600",
  reach: "bg-reach-600",
  target: "bg-target-600",
  safety: "bg-safety-600",
} as const;

/**
 * Horizontal sub-score bar: label left, number right, filled track below.
 * The bar itself is decorative; label + number carry the meaning for AT.
 */
export function ScoreBar({
  label,
  value,
  display,
  tone = "ink",
  className,
}: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small text-stone-700">{label}</span>
        <span className="tnum text-small font-semibold text-stone-900">
          {display ?? Math.round(clamped)}
        </span>
      </div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className={cn("h-full rounded-full", fillClasses[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
