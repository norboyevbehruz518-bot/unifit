/**
 * Profile Fit — FIT_ALGORITHM.md §3.
 * Maps the DOMAIN.md §2 rubric (0–100) against tier-specific expectations:
 * the same profile reads differently at a sub-10% school vs. an accessible one.
 */

import type { ProfileRubric, SelectivityTier } from "@/types/domain";
import type { ProfileResult } from "./types";
import { PROFILE_CLAMP, PROFILE_CURVE, RUBRIC_POINTS } from "./weights";
import { clamp } from "./normalize";

/**
 * Sums the rubric's stored answer LEVELS into points (DOMAIN.md §2).
 * Levels are stored, never points, so recalibrating RUBRIC_POINTS never
 * requires re-asking students.
 */
export function calculateRubricTotal(rubric: ProfileRubric): number {
  return (
    (RUBRIC_POINTS.leadership[rubric.leadership] ?? 0) +
    (RUBRIC_POINTS.awards[rubric.awards] ?? 0) +
    (RUBRIC_POINTS.commitment[rubric.commitment] ?? 0) +
    (RUBRIC_POINTS.focus[rubric.focus] ?? 0)
  );
}

/**
 * profileFit = clamp(50 + k_tier · (rubricTotal − E_tier), 5, 95) — §3.
 * 50 = "typical for who enrolls here"; k falls with tier because holistic
 * factors matter more where admissions is itself holistic (Tier 1) and
 * matter least where it's stats-driven (Tier 4).
 */
export function calculateProfileFit(rubric: ProfileRubric, tier: SelectivityTier): ProfileResult {
  const rubricTotal = calculateRubricTotal(rubric);
  const { expected, k } = PROFILE_CURVE[tier];
  const score = clamp(50 + k * (rubricTotal - expected), PROFILE_CLAMP.min, PROFILE_CLAMP.max);
  return { score, rubricTotal, tier, expectation: expected };
}
