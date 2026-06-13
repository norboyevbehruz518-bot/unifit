/**
 * Fit engine entry point — FIT_ALGORITHM.md (all sections).
 * Pure orchestration: resolve shared inputs once, run the three sub-scores,
 * then blend, categorize, derive confidence, and generate explanations.
 */

import type { FitResult, StudentProfile, University } from "@/types/domain";
import type { ConfidenceInputs } from "./types";
import { ALGORITHM_VERSION } from "./types";
import { STALE_AFTER_CYCLES } from "./weights";
import { resolveAcceptance, round1 } from "./normalize";
import { calculateAcademicFit } from "./academic";
import { calculatePracticalFit } from "./practical";
import { calculateProfileFit, calculateRubricTotal } from "./profile";
import { calculateOverall, categorize } from "./overall";
import { deriveConfidence } from "./confidence";
import { explainAcademic, explainOverall, explainPractical, explainProfile } from "./explanations";

export * from "./types";
export * from "./normalize";
export * from "./weights";
export { calculateAcademicFit } from "./academic";
export { calculatePracticalFit } from "./practical";
export { calculateProfileFit, calculateRubricTotal } from "./profile";
export { calculateOverall, categorize, analyzeListBalance } from "./overall";
export { deriveConfidence } from "./confidence";
export { explainAcademic, explainOverall, explainPractical, explainProfile } from "./explanations";

/**
 * §6 — data years older than STALE_AFTER_CYCLES admission cycles cap
 * confidence at medium. Only checked when the caller supplies the current
 * cycle's year (a pure function can't know "now" on its own).
 */
function isDataStale(admissionSourceYear: string, currentYear?: number): boolean {
  if (currentYear == null) return false;
  const match = /\d{4}/.exec(admissionSourceYear);
  if (!match) return false;
  return currentYear - Number(match[0]) > STALE_AFTER_CYCLES;
}

/**
 * Computes the full FitResult for one student/university pair.
 * `currentYear` is optional and only used for the §6 staleness check.
 */
export function calculateFitResult(
  profile: StudentProfile,
  university: University,
  currentYear?: number,
): FitResult {
  const rate = resolveAcceptance(university);
  const rubricTotal = calculateRubricTotal(profile.rubric);

  // §3 — profile expectation curve uses the OVERALL-rate tier (ADR-0004),
  // same reasoning as the §1.2 GPA bands: it describes who enrolls.
  const profileResult = calculateProfileFit(profile.rubric, rate.overallTier);
  const academic = calculateAcademicFit(profile, university, rate, rubricTotal);
  const practical = calculatePracticalFit(profile, university);

  const overall = calculateOverall(academic, practical, profileResult);
  const category = categorize(academic, practical, rate);

  // §6 — academic fit rests on tier anchors alone when the university
  // publishes no C9 test percentiles (DOMAIN.md has no gpaDistribution
  // field yet, so this checks the C9 half of the spec's condition).
  const academicOnTierAnchorsOnly =
    university.sat25 == null && university.sat75 == null && university.act25 == null && university.act75 == null;

  const confidenceInputs: ConfidenceInputs = {
    intlPublished: rate.intlPublished,
    gpaConverted: profile.gpaScale !== "4.0",
    pathB: academic.path === "B",
    percentilesMissingWithTest: academic.percentilesMissingWithTest,
    meritAidUnknown: practical.meritAidUnknown,
    academicOnTierAnchorsOnly,
    costEstimated: university.fieldConfidence.costOfAttendanceUsd === "estimated",
    dataStale: isDataStale(university.admissionSourceYear, currentYear),
  };

  return {
    universityId: university.id,
    algorithmVersion: ALGORITHM_VERSION,
    academicFit: round1(academic.score),
    practicalFit: round1(practical.score),
    profileFit: round1(profileResult.score),
    overall,
    category,
    gatesFired: [...academic.gates, ...practical.gates],
    explanations: {
      academic: explainAcademic(academic, rate),
      practical: explainPractical(profile, university, practical),
      profile: explainProfile(profile.rubric, profileResult),
      overall: explainOverall(category, rate),
    },
    dataConfidence: deriveConfidence(confidenceInputs),
  };
}
