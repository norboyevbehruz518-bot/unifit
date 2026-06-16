/**
 * Academic Fit — FIT_ALGORITHM.md §1.
 * Combines test-score and GPA band scores (Path A or B depending on
 * available test data and policy), then applies the §1.3 hard-cap gates
 * and the §1.4 international/need-aware corrections.
 */

import type { ApScore, StudentProfile, University } from "@/types/domain";
import type { AcademicResult, RateResolution } from "./types";
import {
  ACADEMIC_CLAMP,
  ACADEMIC_GATES,
  ACADEMIC_WEIGHTS,
  AP_PASSING_BONUS,
  AP_PASSING_CAP,
  AP_STRONG_BONUS,
  AP_STRONG_CAP,
  AP_STRONG_SCORE,
  ENGLISH_DEFAULTS,
  GPA_TIER_BANDS,
  INTL_ACADEMIC_PENALTY,
  NEED_AWARE_PENALTY,
  TEST_HELPS_THRESHOLD,
} from "./weights";
import { bandScore, clamp, normalizeGpa, round1 } from "./normalize";

/**
 * §1.5 — optional AP bonus. Applied after the base blend, before §1.4
 * international penalties. Scores 1–2 have no effect (hard course ≠ weak
 * student; penalising them would violate "never discourage").
 */
function calculateApBonus(apScores: ApScore[] | undefined): number {
  if (!apScores || apScores.length === 0) return 0;
  const strongBonus = Math.min(
    apScores.filter((a) => a.score >= AP_STRONG_SCORE).length * AP_STRONG_BONUS,
    AP_STRONG_CAP,
  );
  const passingBonus = Math.min(
    apScores.filter((a) => a.score === 3).length * AP_PASSING_BONUS,
    AP_PASSING_CAP,
  );
  return strongBonus + passingBonus;
}

/**
 * §1.1 — picks the better of SAT/ACT band scores (mirrors real
 * submit-the-better-one strategy). Returns null if neither test has both
 * a student score and university percentiles.
 */
function bestTestScore(
  profile: StudentProfile,
  university: University,
): { name: "SAT" | "ACT"; value: number; p25: number; p75: number; score: number } | null {
  const candidates: { name: "SAT" | "ACT"; value: number; p25: number; p75: number; score: number }[] = [];

  if (profile.satTotal != null && university.sat25 != null && university.sat75 != null) {
    candidates.push({
      name: "SAT",
      value: profile.satTotal,
      p25: university.sat25,
      p75: university.sat75,
      score: bandScore(profile.satTotal, university.sat25, university.sat75),
    });
  }
  if (profile.actComposite != null && university.act25 != null && university.act75 != null) {
    candidates.push({
      name: "ACT",
      value: profile.actComposite,
      p25: university.act25,
      p75: university.act75,
      score: bandScore(profile.actComposite, university.act25, university.act75),
    });
  }
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.score > best.score ? c : best));
}

/** §1.3 — English proficiency gate, applies to both paths. */
function checkEnglishGate(profile: StudentProfile, university: University): boolean {
  const ieltsMin = university.ieltsMin ?? ENGLISH_DEFAULTS.ielts;
  const toeflMin = university.toeflMin ?? ENGLISH_DEFAULTS.toefl;
  if (profile.englishTest === "none" || profile.englishScore == null) return true;
  if (profile.englishTest === "ielts") return profile.englishScore < ieltsMin;
  return profile.englishScore < toeflMin;
}

export function calculateAcademicFit(
  profile: StudentProfile,
  university: University,
  rate: RateResolution,
  rubricTotal: number,
): AcademicResult {
  const gpaNorm = normalizeGpa(profile.gpaValue, profile.gpaScale);
  // §1.2 — GPA bands are keyed by the OVERALL-rate tier (ADR-0004), not the
  // §1.4-adjusted intl tier: published percentiles already describe who
  // enrolls.
  const gpaBand = GPA_TIER_BANDS[rate.overallTier];
  const gpaScore = bandScore(gpaNorm, gpaBand.p25, gpaBand.p75);

  const best = bestTestScore(profile, university);
  const studentHasAnyTest = profile.satTotal != null || profile.actComposite != null;

  let path: AcademicResult["path"] = "B";
  let testUsed: AcademicResult["testUsed"] = null;
  let testWithheld = false;

  if (university.testPolicy === "blind") {
    // Path B unconditionally; no test is ever scored at a test-blind school.
  } else if (best !== null) {
    if (university.testPolicy === "required") {
      path = "A";
      testUsed = { name: best.name, value: best.value, p25: best.p25, p75: best.p75 };
    } else {
      // optional: submit-only-if-it-helps (§1.1)
      if (best.score >= TEST_HELPS_THRESHOLD) {
        path = "A";
        testUsed = { name: best.name, value: best.value, p25: best.p25, p75: best.p75 };
      } else {
        testWithheld = true;
      }
    }
  }

  // §0.2/§6 — student has a score the university can't compare against
  // (no published percentiles for any test the student took), and that
  // forced a fallback to Path B.
  const percentilesMissingWithTest =
    path === "B" && !testWithheld && studentHasAnyTest && university.testPolicy !== "blind";

  let academicRaw: number;
  if (path === "A" && testUsed !== null) {
    academicRaw = ACADEMIC_WEIGHTS.pathA.test * best!.score + ACADEMIC_WEIGHTS.pathA.gpa * gpaScore;
  } else {
    academicRaw = ACADEMIC_WEIGHTS.pathB.gpa * gpaScore + ACADEMIC_WEIGHTS.pathB.rubric * rubricTotal;
  }

  const gates: AcademicResult["gates"] = [];
  let capped = academicRaw;

  // §1.3 — test-required gate: required test, none taken at all.
  if (university.testPolicy === "required" && !studentHasAnyTest) {
    capped = Math.min(capped, ACADEMIC_GATES.testRequiredCap);
    gates.push({
      gate: "test-required",
      explanation: "This school requires the SAT or ACT — taking one unlocks this school.",
    });
  }

  // §1.3 — English proficiency gate.
  if (checkEnglishGate(profile, university)) {
    capped = Math.min(capped, ACADEMIC_GATES.englishBelowMinCap);
    const ieltsMin = university.ieltsMin ?? ENGLISH_DEFAULTS.ielts;
    const toeflMin = university.toeflMin ?? ENGLISH_DEFAULTS.toefl;
    let engExplanation: string;
    if (profile.englishTest === "none" || profile.englishScore == null) {
      engExplanation = `${university.name} requires an English test (IELTS ${ieltsMin}+ or TOEFL ${toeflMin}+) — submitting one unlocks this school.`;
    } else if (profile.englishTest === "ielts") {
      const diff = round1(ieltsMin - profile.englishScore);
      engExplanation = `Your IELTS ${profile.englishScore} is ${diff} below ${university.name}'s minimum of ${ieltsMin} — reaching ${ieltsMin}+ unlocks this school.`;
    } else {
      const diff = Math.round(toeflMin - profile.englishScore);
      engExplanation = `Your TOEFL ${profile.englishScore} is ${diff} below ${university.name}'s minimum of ${toeflMin} — reaching ${toeflMin}+ unlocks this school.`;
    }
    gates.push({
      gate: "english-below-minimum",
      explanation: engExplanation,
    });
  }

  // §1.5 — AP bonus (optional signal; applied before §1.4 penalties).
  const apBonus = calculateApBonus(profile.apScores);

  // §1.4(b) — penalty when no intl-specific acceptance rate is published.
  const intlPenalty = rate.intlPublished ? 0 : INTL_ACADEMIC_PENALTY[rate.tier];

  // §1.4(c) — need-aware school + student needs aid.
  const needAwarePenalty =
    university.intlAidPolicy === "need-aware" && profile.aidNeedLevel !== "none" ? NEED_AWARE_PENALTY : 0;

  const score = clamp(
    capped + apBonus - intlPenalty - needAwarePenalty,
    ACADEMIC_CLAMP.min,
    ACADEMIC_CLAMP.max,
  );

  return {
    score,
    gates,
    path,
    testUsed,
    testWithheld,
    percentilesMissingWithTest,
    gpa: { original: profile.gpaValue, scale: profile.gpaScale, normalized: gpaNorm },
    intlPenalty,
    needAwarePenalty,
    apBonus,
  };
}
