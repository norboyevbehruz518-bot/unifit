/**
 * Shared test fixtures. Defaults describe a mid-selectivity (Tier 2,
 * acceptanceRateIntl = 15%) university and a student who is solidly inside
 * its academic bands — chosen so individual tests only need to override the
 * one or two fields relevant to what they're checking.
 */

import type { AcademicResult, PracticalResult, ProfileResult } from "../types";
import type { GateFired, SelectivityTier, StudentProfile, University } from "@/types/domain";

export function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    gpaValue: 3.7,
    gpaScale: "4.0",
    satTotal: 1400,
    englishTest: "ielts",
    englishScore: 7.0,
    intendedMajors: ["computer-science"],
    annualBudgetUsd: 70000,
    aidNeedLevel: "none",
    rubric: { leadership: 1, awards: 1, commitment: 1, focus: 1 },
    citizenship: "UZ",
    ...overrides,
  };
}

export function makeUniversity(overrides: Partial<University> = {}): University {
  return {
    id: "test-uni",
    name: "Test University",
    state: "CA",
    city: "Testville",
    setting: "urban",
    undergradEnrollment: 10000,
    type: "private",
    majorCategoriesOffered: ["computer-science", "engineering"],
    acceptanceRateOverall: 20,
    acceptanceRateIntl: 15,
    sat25: 1300,
    sat50: 1400,
    sat75: 1500,
    act25: 29,
    act50: 32,
    act75: 34,
    testPolicy: "required",
    ieltsMin: 6.5,
    toeflMin: 79,
    costOfAttendanceUsd: 70000,
    intlAidPolicy: "need-blind-full-need",
    avgIntlAidUsd: 40000,
    pctIntlReceivingAid: 80,
    cdsUrl: "https://example.com/cds",
    admissionSourceYear: "2024-2025",
    fieldConfidence: {},
    ...overrides,
  };
}

/** Minimal AcademicResult for tests that only care about `.score` and `.gates`. */
export function mockAcademic(score: number, gates: GateFired[] = []): AcademicResult {
  return {
    score,
    gates,
    path: "A",
    testUsed: null,
    testWithheld: false,
    percentilesMissingWithTest: false,
    gpa: { original: 3.7, scale: "4.0", normalized: 3.7 },
    intlPenalty: 0,
    needAwarePenalty: 0,
  };
}

/** Minimal PracticalResult for tests that only care about `.score` and `.gates`. */
export function mockPractical(score: number, gates: GateFired[] = []): PracticalResult {
  return {
    score,
    gates,
    netCost: 70000,
    ratio: 1,
    affordabilityScore: 100,
    majorMatch: "all",
    majorScore: 100,
    meritLottery: null,
    meritAidUnknown: false,
  };
}

/** Minimal ProfileResult for tests that only care about `.score`. */
export function mockProfile(score: number, tier: SelectivityTier = 2): ProfileResult {
  return { score, rubricTotal: 34, tier, expectation: 60 };
}
