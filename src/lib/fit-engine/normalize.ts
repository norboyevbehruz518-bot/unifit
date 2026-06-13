/**
 * Shared scoring primitives — FIT_ALGORITHM.md §0.
 * Pure functions; no I/O, no imports outside the engine and domain types.
 */

import type { GpaScale, SelectivityTier, University } from "@/types/domain";
import type { RateResolution } from "./types";
import {
  BAND,
  GPA_ANCHORS_PERCENTAGE,
  GPA_ANCHORS_UZ_5,
  INTL_RATE_FACTOR,
  TIER_BOUNDS,
} from "./weights";

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

/**
 * Piecewise-linear interpolation between sorted [x, y] anchors; input is
 * clamped to the anchor range (FIT_ALGORITHM.md §0.3).
 */
export function piecewiseLinear(
  x: number,
  anchors: ReadonlyArray<readonly [number, number]>,
): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last) throw new Error("piecewiseLinear requires anchors");
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const lo = anchors[i - 1];
    const hi = anchors[i];
    if (lo && hi && x <= hi[0]) {
      const t = (x - lo[0]) / (hi[0] - lo[0]);
      return lo[1] + t * (hi[1] - lo[1]);
    }
  }
  // Unreachable: the guards above ensure first[0] < x < last[0], so the
  // loop's final iteration (hi === last) always satisfies x <= hi[0] and
  // returns above. Kept as a type-safety fallback only.
  return last[1];
}

/**
 * The band interpolation primitive — FIT_ALGORITHM.md §0.1.
 * Inside [p25, p75] → 40–75; above → diminishing to 95; below → gentle to 5.
 * Never 0, never 100 (honest uncertainty).
 */
export function bandScore(x: number, p25: number, p75: number): number {
  // Guard only against a truly degenerate band (p75 <= p25); a small but
  // positive width (e.g. GPA bands ~0.2-0.7) is real and must not be
  // widened to 1 (ADR-0003).
  const w = p75 > p25 ? p75 - p25 : BAND.minWidth;
  if (x >= p25 && x <= p75) {
    return BAND.insideMin + (BAND.insideSpan * (x - p25)) / w;
  }
  if (x > p75) {
    return Math.min(BAND.cap, BAND.insideMin + BAND.insideSpan + (BAND.aboveSlope * (x - p75)) / w);
  }
  return Math.max(BAND.floor, BAND.insideMin - (BAND.belowSlope * (p25 - x)) / w);
}

/**
 * GPA normalization to the 4.0 scale — FIT_ALGORITHM.md §0.3.
 * Conventions, not measurements: callers must keep the original alongside.
 */
export function normalizeGpa(value: number, scale: GpaScale): number {
  switch (scale) {
    case "4.0":
      return clamp(value, 0, 4);
    case "5.0-uz":
      return piecewiseLinear(value, GPA_ANCHORS_UZ_5);
    case "percentage":
      return piecewiseLinear(value, GPA_ANCHORS_PERCENTAGE);
  }
}

/** Selectivity tier from an acceptance rate (%) — FIT_ALGORITHM.md §0.2. */
export function selectivityTier(acceptanceRate: number): SelectivityTier {
  if (acceptanceRate < TIER_BOUNDS.tier1Below) return 1;
  if (acceptanceRate <= TIER_BOUNDS.tier2Below) return 2;
  if (acceptanceRate <= TIER_BOUNDS.tier3Below) return 3;
  return 4;
}

/**
 * Resolves the best-available international acceptance rate `R` and its tier —
 * FIT_ALGORITHM.md §0.2 + §1.4(a). When no intl rate is published, the
 * adjustment factor is chosen by the tier of the OVERALL rate.
 *
 * Returns two tiers (ADR-0004):
 * - `tier`: tier of `R` (published intl rate, or the §1.4-adjusted rate) —
 *   for category mapping (§4.2-4.3) and the §1.4(b) academic-fit penalty only.
 * - `overallTier`: tier of the UNADJUSTED `acceptanceRateOverall` — for the
 *   GPA expectation bands (§1.2) and profile expectation curve (§3), which
 *   describe who enrolls and must not be re-adjusted for the intl correction.
 */
export function resolveAcceptance(university: University): RateResolution {
  const overallTier = selectivityTier(university.acceptanceRateOverall);
  if (university.acceptanceRateIntl !== null) {
    return {
      r: university.acceptanceRateIntl,
      tier: selectivityTier(university.acceptanceRateIntl),
      overallTier,
      intlPublished: true,
    };
  }
  const r = university.acceptanceRateOverall * INTL_RATE_FACTOR[overallTier];
  return { r, tier: selectivityTier(r), overallTier, intlPublished: false };
}

/** Round to one decimal — keeps scores stable without faking precision. */
export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
