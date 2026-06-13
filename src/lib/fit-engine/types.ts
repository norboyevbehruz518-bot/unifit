/**
 * Fit-engine types. Domain types come from `@/types/domain` (single source);
 * this file adds engine-internal result shapes — each sub-score returns its
 * score PLUS the context needed to render its explanation, so explanations
 * are generated from the same inputs as the numbers (DOMAIN.md §1.3).
 */

import type {
  DataConfidence,
  FitCategory,
  FitResult,
  GateFired,
  ProfileRubric,
  SelectivityTier,
  StudentProfile,
  University,
} from "@/types/domain";

export type {
  AidNeedLevel,
  DataConfidence,
  FitCategory,
  FitGate,
  FitResult,
  GateFired,
  GpaScale,
  IntlAidPolicy,
  ListBalance,
  ListBalanceClass,
  ProfileRubric,
  SelectivityTier,
  StudentProfile,
  TestPolicy,
  University,
} from "@/types/domain";

/** Bump on any scoring change; stored in every fit_snapshot. */
export const ALGORITHM_VERSION = "1.0.0";

/** How the university's acceptance rate was resolved (FIT_ALGORITHM.md §0.2, §1.4a). */
export interface RateResolution {
  /** Best-available international acceptance rate (published or adjusted). */
  r: number;
  /** Tier of `r` — used everywhere downstream (GPA anchors, profile curve). */
  tier: SelectivityTier;
  /** True when the university publishes an international-specific rate. */
  intlPublished: boolean;
}

export type AcademicPath = "A" | "B";

export interface AcademicResult {
  score: number;
  gates: GateFired[];
  path: AcademicPath;
  /** Present when Path A: which test was compared and against what band. */
  testUsed: { name: "SAT" | "ACT"; value: number; p25: number; p75: number } | null;
  /** True when a score exists but was withheld (below 25th pct at optional school). */
  testWithheld: boolean;
  /** True when the student has a score but the school publishes no percentiles. */
  percentilesMissingWithTest: boolean;
  gpa: { original: number; scale: string; normalized: number };
  /** §1.4(b) penalty applied (0 when intl rate is published). */
  intlPenalty: number;
  /** §1.4(c) −5 when need-aware and student needs aid. */
  needAwarePenalty: number;
}

export type MajorMatch = "all" | "first-choice" | "partial" | "none";

export interface PracticalResult {
  score: number;
  gates: GateFired[];
  netCost: number;
  /** budget / netCost, uncapped. */
  ratio: number;
  affordabilityScore: number;
  majorMatch: MajorMatch;
  majorScore: number;
  /** Merit aid exists but reaches <30% of internationals (§2.2 caveat). */
  meritLottery: { pctReceiving: number; avgAid: number | null } | null;
  /** merit-only school with avgIntlAidUsd unpublished while student needs aid. */
  meritAidUnknown: boolean;
}

export interface ProfileResult {
  score: number;
  /** Rubric total 0–100 (also feeds academic Path B). */
  rubricTotal: number;
  tier: SelectivityTier;
  expectation: number;
}

/** Everything confidence derivation needs (§6) — only fields that DROVE the score. */
export interface ConfidenceInputs {
  intlPublished: boolean;
  gpaConverted: boolean;
  pathB: boolean;
  percentilesMissingWithTest: boolean;
  meritAidUnknown: boolean;
  /** sat/act percentiles AND gpaDistribution all null → academic rests on tier anchors alone. */
  academicOnTierAnchorsOnly: boolean;
  costEstimated: boolean;
  /** Data year staleness is checked only when the caller supplies a current year. */
  dataStale: boolean;
}

export interface CalculatedSubScores {
  academic: AcademicResult;
  practical: PracticalResult;
  profile: ProfileResult;
  rate: RateResolution;
}

/** Re-exported convenience aliases used across modules. */
export type { FitCategory as Category, ProfileRubric as Rubric, DataConfidence as Confidence };
export type Profile = StudentProfile;
export type Uni = University;
export type Result = FitResult;
