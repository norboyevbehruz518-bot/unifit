import type { AidNeedLevel, GpaScale } from "@/types/domain";

export const GPA_SCALE_LABELS: Record<GpaScale, string> = {
  "4.0": "4.0 scale",
  "5.0-uz": "5.0 (Uzbekistan)",
  percentage: "Percentage",
};

export const AID_LEVEL_LABELS: Record<AidNeedLevel, string> = {
  none: "I can cover the full cost myself",
  partial: "I'll need some financial aid",
  full: "I need close to a full ride to attend",
};

export function formatBudget(value: number): string {
  return value === 0 ? "$0 (full scholarship)" : `$${value.toLocaleString("en-US")} / year`;
}
