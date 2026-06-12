import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "reach" | "target" | "safety" | "neutral" | "ink";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  reach: "bg-reach-100 text-reach-700 border-reach-200",
  target: "bg-target-100 text-target-700 border-target-200",
  safety: "bg-safety-100 text-safety-700 border-safety-200",
  neutral: "bg-stone-100 text-stone-700 border-stone-200",
  ink: "bg-ink-50 text-ink-700 border-ink-100",
};

/** Color never carries meaning alone — a badge always contains text. */
export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
