/**
 * Shared domain types, transcribed from docs/DOMAIN.md §1.
 * Single source of truth for both the fit engine and the UI.
 * Database row types (generated from Supabase) map to/from these at the
 * data-access boundary; these types stay hand-owned.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type GpaScale = "4.0" | "5.0-uz" | "percentage";

export type EnglishTest = "ielts" | "toefl" | "none";

export type AidNeedLevel = "none" | "partial" | "full";

export type CampusSetting = "urban" | "suburban" | "rural";

export type UniversityType = "public" | "private";

export type TestPolicy = "required" | "optional" | "blind";

export type IntlAidPolicy =
  | "need-blind-full-need"
  | "need-aware"
  | "merit-only"
  | "none";

/** Per-field provenance level (DOMAIN.md §3.2). */
export type FieldConfidence =
  | "verified-intl"
  | "verified-overall"
  | "estimated"
  | "missing";

/** Result-level confidence: worst of the fields that drove the score. */
export type DataConfidence = "high" | "medium" | "low";

export type FitCategory = "safety" | "target" | "reach";

/** Selectivity tier (FIT_ALGORITHM.md §0.2). 1 = ultra-selective (<10%). */
export type SelectivityTier = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Profile-strength rubric (DOMAIN.md §2)
// We store the chosen ANSWER LEVEL, never points — point mappings live in
// the fit engine's constants so they can be recalibrated without re-asking.
// ---------------------------------------------------------------------------

/** Q1: none / member / officer-organizer / founder-president */
export type RubricLeadershipLevel = 0 | 1 | 2 | 3;
/** Q2: none / school / regional / national / international */
export type RubricAwardsLevel = 0 | 1 | 2 | 3 | 4;
/** Q3: <1yr / 1–2yr / 2–3yr / 3+yr */
export type RubricCommitmentLevel = 0 | 1 | 2 | 3;
/** Q4: few-unrelated / scattered / several-with-connection / spike */
export type RubricFocusLevel = 0 | 1 | 2 | 3;

export interface ProfileRubric {
  leadership: RubricLeadershipLevel;
  awards: RubricAwardsLevel;
  commitment: RubricCommitmentLevel;
  focus: RubricFocusLevel;
}

// ---------------------------------------------------------------------------
// AP exam scores (FIT_ALGORITHM.md §1.5)
// ---------------------------------------------------------------------------

/** One AP exam result. Subject is a free slug from the 20-item canonical list. */
export interface ApScore {
  subject: string;
  /** College Board score: 1–5. */
  score: number;
}

// ---------------------------------------------------------------------------
// StudentProfile (DOMAIN.md §1.1)
// ---------------------------------------------------------------------------

export interface StudentProfile {
  /** Not used by the fit engine — display/personalisation only. */
  fullName?: string;
  age?: number;
  /** GPA exactly as the student entered it, in their own system. */
  gpaValue: number;
  gpaScale: GpaScale;
  /** 400–1600; absent for test-optional applicants. */
  satTotal?: number;
  /** 1–36. */
  actComposite?: number;
  englishTest: EnglishTest;
  /** IELTS 0–9 or TOEFL 0–120; present iff a test was taken. */
  englishScore?: number;
  /** 1–3 major-category codes, ordered by preference. */
  intendedMajors: string[];
  /** What the family can realistically pay per year, USD. */
  annualBudgetUsd: number;
  aidNeedLevel: AidNeedLevel;
  rubric: ProfileRubric;
  /** ISO 3166-1 alpha-2. */
  citizenship: string;
  /** AP exam results — optional, max 8 (FIT_ALGORITHM.md §1.5). */
  apScores?: ApScore[];
}

// ---------------------------------------------------------------------------
// University (DOMAIN.md §1.2)
// `null` always means "not published" — never invent values.
// ---------------------------------------------------------------------------

export interface University {
  /** Stable slug, e.g. "purdue-west-lafayette". */
  id: string;
  name: string;
  state: string;
  city: string;
  setting: CampusSetting;
  undergradEnrollment: number;
  type: UniversityType;
  majorCategoriesOffered: string[];

  // Admission stats
  acceptanceRateOverall: number;
  acceptanceRateIntl: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  act25: number | null;
  act50: number | null;
  act75: number | null;
  testPolicy: TestPolicy;
  ieltsMin: number | null;
  toeflMin: number | null;

  // Cost & aid — costOfAttendanceUsd is the full I-20 figure.
  costOfAttendanceUsd: number;
  intlAidPolicy: IntlAidPolicy;
  avgIntlAidUsd: number | null;
  pctIntlReceivingAid: number | null;

  // Provenance
  cdsUrl: string;
  admissionSourceYear: string;
  fieldConfidence: Partial<Record<keyof University, FieldConfidence>>;
}

// ---------------------------------------------------------------------------
// FitResult (DOMAIN.md §1.3, FIT_ALGORITHM.md)
// ---------------------------------------------------------------------------

export type FitGate =
  | "financial" // Gate F: no intl aid AND cost > budget
  | "major-unavailable" // Gate M
  | "test-required" // required test, none taken
  | "english-below-minimum";

export interface GateFired {
  gate: FitGate;
  /** Actionable, never a rejection: states what would unlock the school. */
  explanation: string;
}

export interface FitResult {
  universityId: string;
  algorithmVersion: string;

  /** Sub-scores are internal precision; the UI shows bands, never points. */
  academicFit: number;
  practicalFit: number;
  profileFit: number;
  overall: number;

  /**
   * Absent when any gate fired — gated schools skip category mapping and
   * route to the "Action needed" list (FIT_ALGORITHM.md §4.4).
   */
  category: FitCategory | null;
  gatesFired: GateFired[];

  explanations: {
    academic: string;
    practical: string;
    profile: string;
    overall: string;
  };

  dataConfidence: DataConfidence;
}

// ---------------------------------------------------------------------------
// List balance (FIT_ALGORITHM.md §4.5)
// ---------------------------------------------------------------------------

export type ListBalanceClass =
  | "too-small"
  | "no-safety"
  | "no-target"
  | "top-heavy"
  | "balanced";

export interface ListBalance {
  classification: ListBalanceClass;
  reachCount: number;
  targetCount: number;
  safetyCount: number;
  advisory: string;
}
