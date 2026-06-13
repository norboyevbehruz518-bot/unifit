/**
 * EVERY tunable constant in the fit engine, in one file (FIT_ALGORITHM.md
 * preamble: "every constant is a named, reviewable decision"). These are
 * priors pending calibration (ADR-0002, Decision 4) — recalibration must be
 * a one-file diff and never touch scoring logic.
 */

import type { SelectivityTier } from "@/types/domain";

/** §0.1 — band interpolation primitive. */
export const BAND = {
  insideMin: 40,
  insideSpan: 35, // inside band maps to [40, 75]
  aboveSlope: 20, // per band-width above p75
  cap: 95, // never 100 — honest uncertainty
  belowSlope: 25, // gentler than inside: below the band is not a cliff
  floor: 5, // never 0
  minWidth: 1, // guard against degenerate bands
} as const;

/** §0.3 — GPA anchor tables, piecewise-linear, input clamped to range. */
export const GPA_ANCHORS_UZ_5: ReadonlyArray<readonly [number, number]> = [
  [3.0, 2.3],
  [3.5, 2.8],
  [4.0, 3.3],
  [4.5, 3.7],
  [5.0, 4.0],
];
export const GPA_ANCHORS_PERCENTAGE: ReadonlyArray<readonly [number, number]> = [
  [60, 2.3],
  [70, 2.8],
  [80, 3.3],
  [88, 3.7],
  [95, 4.0],
  [100, 4.0],
];

/** §0.2 — selectivity tier upper bounds (acceptance rate %, inclusive). */
export const TIER_BOUNDS = { tier1Below: 10, tier2Below: 25, tier3Below: 50 } as const;

/** §1.2 — tier-anchored GPA expectation bands (normalized 4.0 scale). */
export const GPA_TIER_BANDS: Record<SelectivityTier, { p25: number; p75: number }> = {
  1: { p25: 3.75, p75: 3.95 },
  2: { p25: 3.55, p75: 3.85 },
  3: { p25: 3.2, p75: 3.7 },
  4: { p25: 2.8, p75: 3.5 },
};

/** §1.3 — sub-component weights per path. */
export const ACADEMIC_WEIGHTS = {
  pathA: { test: 0.6, gpa: 0.4 },
  pathB: { gpa: 0.7, rubric: 0.3 },
} as const;

/** §1.1 — at optional schools, submit the test only if it helps (≥ 25th pct). */
export const TEST_HELPS_THRESHOLD = 40;

/** §1.3 — gates on academic fit (caps) and English defaults when unpublished. */
export const ACADEMIC_GATES = {
  englishBelowMinCap: 30,
  testRequiredCap: 25,
} as const;
export const ENGLISH_DEFAULTS = { ielts: 6.5, toefl: 79 } as const;

/** §1.4(a) — adjusted intl acceptance rate factor, keyed by tier of OVERALL rate. */
export const INTL_RATE_FACTOR: Record<SelectivityTier, number> = {
  1: 0.5,
  2: 0.6,
  3: 0.7,
  4: 0.85,
};

/** §1.4(b) — academic-fit penalty when no intl-specific rate is published. */
export const INTL_ACADEMIC_PENALTY: Record<SelectivityTier, number> = {
  1: 10,
  2: 8,
  3: 5,
  4: 2,
};

/** §1.4(c) — need-aware school + student needs aid. */
export const NEED_AWARE_PENALTY = 5;

/** Final academic clamp (§1.4): never certain in either direction. */
export const ACADEMIC_CLAMP = { min: 5, max: 95 } as const;

/** §2.1 — practical-fit gate caps. 15/20, not 0: "blocked as planned", not "worthless". */
export const PRACTICAL_GATES = { financialCap: 15, majorCap: 20 } as const;

/** §2.2 — affordability ratio anchors (r = budget / netCost), linear between. */
export const AFFORDABILITY_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0.4, 20],
  [0.6, 45],
  [0.8, 75],
  [1.0, 100],
];
export const AFFORDABILITY_FLOOR = 10; // r < 0.4

/** §2.2 — merit-only caveat threshold: below this % receiving aid, say the odds. */
export const MERIT_LOTTERY_THRESHOLD = 30;

/** §2.3 — major availability scores. */
export const MAJOR_SCORES = {
  all: 100,
  firstChoice: 90,
  partial: 60,
  none: 0,
} as const;

/** §2 — practical blend. */
export const PRACTICAL_WEIGHTS = { affordability: 0.7, major: 0.3 } as const;

/**
 * DOMAIN.md §2 — rubric points keyed by stored ANSWER LEVEL (never stored as
 * points: levels survive recalibration, points don't).
 */
export const RUBRIC_POINTS = {
  leadership: [0, 8, 17, 25],
  awards: [0, 6, 12, 19, 25],
  commitment: [0, 8, 17, 25],
  focus: [5, 12, 18, 25],
} as const;

/** §3 — profile expectation curve per tier: expected rubric E, sensitivity k. */
export const PROFILE_CURVE: Record<SelectivityTier, { expected: number; k: number }> = {
  1: { expected: 75, k: 1.2 },
  2: { expected: 60, k: 1.0 },
  3: { expected: 45, k: 0.8 },
  4: { expected: 30, k: 0.6 },
};
export const PROFILE_CLAMP = { min: 5, max: 95 } as const;

/** §4.1 — overall blend. Academic dominates (best data, primary admit signal). */
export const OVERALL_WEIGHTS = { academic: 0.5, practical: 0.3, profile: 0.2 } as const;

/** §4.2–4.3 — category thresholds, incl. the absolute sub-10% Reach override. */
export const CATEGORY_RULES = {
  safetyMinAcademic: 75,
  safetyMinRate: 30, // under 30%, no one's safety
  targetMinAcademic: 55,
  targetMinRate: 10, // under 10%, ALWAYS at best a Reach
} as const;

/** §5 — explanation band cutoffs: low < 40, mid ≤ 70, high > 70. */
export const EXPLANATION_BANDS = { lowBelow: 40, midUpTo: 70 } as const;

/** §4.5 — list-balance rules. */
export const LIST_BALANCE = {
  minListSize: 3,
  reachShareMax: 0.6,
} as const;

/** §6 — data years older than this many admission cycles cap confidence at medium. */
export const STALE_AFTER_CYCLES = 2;
