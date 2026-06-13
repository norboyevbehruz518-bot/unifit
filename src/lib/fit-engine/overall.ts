/**
 * Overall score, category mapping, and list-balance analysis —
 * FIT_ALGORITHM.md §4.
 */

import type { AcademicResult, PracticalResult, ProfileResult, RateResolution } from "./types";
import type { FitCategory, ListBalance } from "@/types/domain";
import { CATEGORY_RULES, LIST_BALANCE, OVERALL_WEIGHTS } from "./weights";
import { round1 } from "./normalize";

/** §4.1 — weighted blend. Academic dominates (best data, primary admit signal). */
export function calculateOverall(academic: AcademicResult, practical: PracticalResult, profile: ProfileResult): number {
  return round1(
    OVERALL_WEIGHTS.academic * academic.score +
      OVERALL_WEIGHTS.practical * practical.score +
      OVERALL_WEIGHTS.profile * profile.score,
  );
}

/**
 * §4.2–4.3 — category from academicFit and R, not overall (affordability
 * shouldn't make a school look easier to get into). Returns null when any
 * gate fired — gated schools route to "Action needed" (§4.4) instead.
 * The targetMinRate = 10 bound encodes the §4.3 sub-10% absolute override:
 * below it, a school can never be better than Reach.
 */
export function categorize(academic: AcademicResult, practical: PracticalResult, rate: RateResolution): FitCategory | null {
  if (academic.gates.length > 0 || practical.gates.length > 0) return null;

  if (academic.score >= CATEGORY_RULES.safetyMinAcademic && rate.r >= CATEGORY_RULES.safetyMinRate) {
    return "safety";
  }
  if (academic.score >= CATEGORY_RULES.targetMinAcademic && rate.r >= CATEGORY_RULES.targetMinRate) {
    return "target";
  }
  return "reach";
}

/**
 * §4.5 — list-balance analysis. Rules are checked in order; the first
 * match wins. `categories` should include every school on the list,
 * including gated (null-category) ones, which count toward N but not
 * toward any category bucket.
 */
export function analyzeListBalance(categories: (FitCategory | null)[]): ListBalance {
  const n = categories.length;
  const reachCount = categories.filter((c) => c === "reach").length;
  const targetCount = categories.filter((c) => c === "target").length;
  const safetyCount = categories.filter((c) => c === "safety").length;

  if (n < LIST_BALANCE.minListSize) {
    return {
      classification: "too-small",
      reachCount,
      targetCount,
      safetyCount,
      advisory: `With only ${n} school${n === 1 ? "" : "s"}, one decision decides everything — most successful applicants apply to 6–10. Add more Targets and Safeties.`,
    };
  }

  if (safetyCount === 0) {
    return {
      classification: "no-safety",
      reachCount,
      targetCount,
      safetyCount,
      advisory: `${reachCount} Reach, ${targetCount} Target, 0 Safety — every school on this list could say no. Add 1–2 Safeties you'd be happy to attend.`,
    };
  }

  if (targetCount === 0) {
    return {
      classification: "no-target",
      reachCount,
      targetCount,
      safetyCount,
      advisory: "Your list jumps from Reach to Safety with nothing in between. Targets are where most students actually land — add 2–3.",
    };
  }

  if (reachCount / n > LIST_BALANCE.reachShareMax) {
    return {
      classification: "top-heavy",
      reachCount,
      targetCount,
      safetyCount,
      advisory: `${reachCount} of your ${n} schools are Reaches. Dreams belong on the list — but balance them: aim for roughly 2 Reach : 3 Target : 2 Safety.`,
    };
  }

  return {
    classification: "balanced",
    reachCount,
    targetCount,
    safetyCount,
    advisory: `${reachCount} Reach, ${targetCount} Target, ${safetyCount} Safety — this is a balanced list. Strong strategy.`,
  };
}
