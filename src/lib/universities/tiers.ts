import { TIER_BOUNDS } from "@/lib/fit-engine";
import type { SelectivityTier } from "@/types/domain";

/** Selectivity tier from the overall acceptance rate (FIT_ALGORITHM.md §0.2). */
export function getSelectivityTier(acceptanceRateOverall: number): SelectivityTier {
  if (acceptanceRateOverall < TIER_BOUNDS.tier1Below) return 1;
  if (acceptanceRateOverall < TIER_BOUNDS.tier2Below) return 2;
  if (acceptanceRateOverall < TIER_BOUNDS.tier3Below) return 3;
  return 4;
}

export const TIER_LABELS: Record<SelectivityTier, string> = {
  1: "Tier 1 — under 10%",
  2: "Tier 2 — 10–25%",
  3: "Tier 3 — 25–50%",
  4: "Tier 4 — over 50%",
};

export const TIER_SHORT_LABELS: Record<SelectivityTier, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
};
