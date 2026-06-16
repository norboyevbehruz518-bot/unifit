/**
 * Academic Fit tests against FIT_ALGORITHM.md §1.
 *
 * Shared baseline (see fixtures.ts): Tier 2 university (acceptanceRateIntl =
 * 15%, intl published), GPA tier band [3.55, 3.85] -> gpaNorm 3.7 gives
 * gpaScore = 40 + 35 * (0.15 / 0.3) = 57.5 (used throughout below).
 */

import { describe, expect, it } from "vitest";
import { calculateAcademicFit } from "../academic";
import { calculateRubricTotal } from "../profile";
import { resolveAcceptance } from "../normalize";
import { makeProfile, makeUniversity } from "./fixtures";

const GPA_SCORE = 57.5; // bandScore(3.7, 3.55, 3.85)
const DEFAULT_RUBRIC_TOTAL = 34; // leadership 8 + awards 6 + commitment 8 + focus 12

describe("Academic Fit — Path A (test used, §1.1/§1.3)", () => {
  // university.sat25 = 1300, sat75 = 1500, w = 200
  it.each([
    ["below the 25th percentile", 1200, 27.5],
    ["at the 25th percentile", 1300, 40],
    ["at the median", 1400, 57.5],
    ["at the 75th percentile", 1500, 75],
    ["above the 75th percentile (capped)", 1700, 95],
  ])("%s: SAT %i -> testScore %f, academicRaw = 0.6*test + 0.4*gpa", (_label, sat, testScore) => {
    const profile = makeProfile({ satTotal: sat });
    const university = makeUniversity(); // testPolicy: "required"
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("A");
    expect(result.testUsed).toEqual({ name: "SAT", value: sat, p25: 1300, p75: 1500 });
    expect(result.score).toBeCloseTo(0.6 * testScore + 0.4 * GPA_SCORE, 5);
    expect(result.gates).toEqual([]);
  });
});

describe("Academic Fit — test-optional submit-only-if-helps (§1.1)", () => {
  it("withholds a score below the 25th percentile and falls back to Path B", () => {
    const profile = makeProfile({ satTotal: 1200 }); // testScore = 27.5 < 40
    const university = makeUniversity({ testPolicy: "optional" });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("B");
    expect(result.testWithheld).toBe(true);
    expect(result.testUsed).toBeNull();
    // academicRaw = 0.7 * gpaScore + 0.3 * rubricTotal
    expect(result.score).toBeCloseTo(0.7 * GPA_SCORE + 0.3 * DEFAULT_RUBRIC_TOTAL, 5);
  });

  it("submits a score at/above the 25th percentile via Path A", () => {
    const profile = makeProfile({ satTotal: 1300 }); // testScore = 40, helps
    const university = makeUniversity({ testPolicy: "optional" });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("A");
    expect(result.testWithheld).toBe(false);
    expect(result.score).toBeCloseTo(0.6 * 40 + 0.4 * GPA_SCORE, 5);
  });
});

describe("Academic Fit — test-blind schools (§1.3)", () => {
  it("never scores a test even if the student has one", () => {
    const profile = makeProfile({ satTotal: 1500 }); // would be testScore = 75
    const university = makeUniversity({ testPolicy: "blind" });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("B");
    expect(result.testUsed).toBeNull();
    expect(result.score).toBeCloseTo(0.7 * GPA_SCORE + 0.3 * DEFAULT_RUBRIC_TOTAL, 5);
  });
});

describe("Academic Fit — Path B weighting (§1.3)", () => {
  it("weights gpa 0.7 and rubric 0.3, varying rubric strength", () => {
    const university = makeUniversity({ testPolicy: "blind" });
    const rate = resolveAcceptance(university);

    const weak = makeProfile({ rubric: { leadership: 0, awards: 0, commitment: 0, focus: 0 } });
    const weakRubricTotal = calculateRubricTotal(weak.rubric); // 0+0+0+5 = 5
    expect(weakRubricTotal).toBe(5);
    const weakResult = calculateAcademicFit(weak, university, rate, weakRubricTotal);
    expect(weakResult.score).toBeCloseTo(0.7 * GPA_SCORE + 0.3 * 5, 5);

    const strong = makeProfile({ rubric: { leadership: 3, awards: 4, commitment: 3, focus: 3 } });
    const strongRubricTotal = calculateRubricTotal(strong.rubric); // 25*4 = 100
    expect(strongRubricTotal).toBe(100);
    const strongResult = calculateAcademicFit(strong, university, rate, strongRubricTotal);
    expect(strongResult.score).toBeCloseTo(0.7 * GPA_SCORE + 0.3 * 100, 5);
  });
});

describe("Academic Fit — missing university percentiles (§1.1, §6)", () => {
  it("falls back to Path B and flags percentilesMissingWithTest when the student has a score but the school publishes none", () => {
    const profile = makeProfile({ satTotal: 1400 });
    const university = makeUniversity({
      testPolicy: "optional",
      sat25: null,
      sat50: null,
      sat75: null,
      act25: null,
      act50: null,
      act75: null,
    });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("B");
    expect(result.testUsed).toBeNull();
    expect(result.testWithheld).toBe(false);
    expect(result.percentilesMissingWithTest).toBe(true);
    expect(result.score).toBeCloseTo(0.7 * GPA_SCORE + 0.3 * DEFAULT_RUBRIC_TOTAL, 5);
  });

  it("does not flag percentilesMissingWithTest when the student took no test at all", () => {
    const profile = makeProfile({ satTotal: undefined, actComposite: undefined });
    const university = makeUniversity({
      testPolicy: "optional",
      sat25: null,
      sat50: null,
      sat75: null,
      act25: null,
      act50: null,
      act75: null,
    });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.percentilesMissingWithTest).toBe(false);
  });
});

describe("Academic Fit — English proficiency gate (§1.3)", () => {
  it("caps academicFit at 30 and fires the gate when the student has no English test", () => {
    const profile = makeProfile({ satTotal: 1400, englishTest: "none", englishScore: undefined });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.score).toBe(30);
    expect(result.gates.map((g) => g.gate)).toContain("english-below-minimum");
  });

  it("caps academicFit at 30 when an IELTS score is below the default minimum (6.5)", () => {
    const profile = makeProfile({ satTotal: 1400, englishTest: "ielts", englishScore: 6.0 });
    const university = makeUniversity({ ieltsMin: null });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.score).toBe(30);
    expect(result.gates.map((g) => g.gate)).toContain("english-below-minimum");
  });

  it("caps academicFit at 30 when a TOEFL score is below the default minimum (79)", () => {
    const profile = makeProfile({ satTotal: 1400, englishTest: "toefl", englishScore: 70 });
    const university = makeUniversity({ toeflMin: null });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.score).toBe(30);
    expect(result.gates.map((g) => g.gate)).toContain("english-below-minimum");
  });

  it("does not fire when the score meets a university-specific minimum", () => {
    const profile = makeProfile({ satTotal: 1400, englishTest: "ielts", englishScore: 6.2 });
    const university = makeUniversity({ ieltsMin: 6.0 });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.gates.map((g) => g.gate)).not.toContain("english-below-minimum");
    expect(result.score).toBeCloseTo(0.6 * 57.5 + 0.4 * GPA_SCORE, 5);
  });
});

describe("Academic Fit — test-required gate (§1.3)", () => {
  it("caps academicFit at 25 when required but the student has no SAT/ACT", () => {
    const profile = makeProfile({ satTotal: undefined, actComposite: undefined });
    const university = makeUniversity({ testPolicy: "required" });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    // academicRaw (Path B) = 0.7*57.5 + 0.3*34 = 50.45, capped at 25
    expect(result.score).toBe(25);
    expect(result.gates.map((g) => g.gate)).toContain("test-required");
  });

  it("does not fire when the student has a score, even at an optional school", () => {
    const profile = makeProfile({ satTotal: 1400 });
    const university = makeUniversity({ testPolicy: "required" });
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.gates.map((g) => g.gate)).not.toContain("test-required");
  });
});

describe("Academic Fit — international adjustment (§1.4)", () => {
  it("applies the academic-fit penalty when no intl-specific rate is published", () => {
    // overall 20% -> tier 2 -> factor 0.6 -> adjusted r = 12 -> resolved tier 2 (both tiers agree)
    const profile = makeProfile({ satTotal: 1400 });
    const university = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 20 });
    const rate = resolveAcceptance(university);
    expect(rate.tier).toBe(2);
    expect(rate.intlPublished).toBe(false);

    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    const academicRaw = 0.6 * 57.5 + 0.4 * GPA_SCORE; // = 57.5
    expect(result.intlPenalty).toBe(8); // tier-2 penalty
    expect(result.score).toBeCloseTo(academicRaw - 8, 5);
  });

  it("applies no penalty when an intl-specific rate is published", () => {
    const profile = makeProfile({ satTotal: 1400 });
    const university = makeUniversity({ acceptanceRateIntl: 15 });
    const rate = resolveAcceptance(university);

    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.intlPenalty).toBe(0);
    expect(result.score).toBeCloseTo(57.5, 5);
  });

  it("applies the need-aware penalty when the school is need-aware and the student needs aid", () => {
    const profile = makeProfile({ satTotal: 1400, aidNeedLevel: "partial" });
    const university = makeUniversity({ intlAidPolicy: "need-aware" });
    const rate = resolveAcceptance(university);

    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.needAwarePenalty).toBe(5);
    expect(result.score).toBeCloseTo(57.5 - 5, 5);
  });

  it("applies no need-aware penalty when the student needs no aid", () => {
    const profile = makeProfile({ satTotal: 1400, aidNeedLevel: "none" });
    const university = makeUniversity({ intlAidPolicy: "need-aware" });
    const rate = resolveAcceptance(university);

    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.needAwarePenalty).toBe(0);
    expect(result.score).toBeCloseTo(57.5, 5);
  });
});

describe("Academic Fit — overall tier vs. resolved tier (ADR-0004)", () => {
  it("a NYU-style tier-crossing school scores GPA against its OWN (overall) tier, not the adjusted tier", () => {
    // overall 12.8% -> overall tier 2 -> factor 0.6 -> adjusted r = 7.68 -> resolved tier 1
    const university = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 12.8 });
    const rate = resolveAcceptance(university);
    expect(rate.overallTier).toBe(2);
    expect(rate.tier).toBe(1); // resolved tier crosses down a tier — for category/penalty only

    // gpaNorm 3.7 sits INSIDE the tier-2 band [3.55, 3.85] (score 57.5) but
    // ABOVE the tier-1 band [3.75, 3.95] (would score higher, ~78.75).
    const profile = makeProfile({ gpaValue: 3.7, gpaScale: "4.0", satTotal: 1400 });
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.gpa.normalized).toBe(3.7);

    // testScore uses the university's own published SAT band (unaffected by tier).
    const testScore = 57.5; // bandScore(1400, 1300, 1500)
    const gpaScoreTier2 = 57.5; // bandScore(3.7, 3.55, 3.85)
    const academicRaw = 0.6 * testScore + 0.4 * gpaScoreTier2;
    // resolved tier 1 -> intl penalty 10 (unpublished intl rate)
    expect(result.intlPenalty).toBe(10);
    expect(result.score).toBeCloseTo(academicRaw - 10, 5);
  });

  it("an ASU-style ~90%-acceptance, test-blind school scores a solidly-above-average GPA as Target, not Reach", () => {
    // overall 90% -> tier 4 in both overall and resolved terms (factor 0.85 -> 76.5% -> still tier 4)
    const university = makeUniversity({
      acceptanceRateIntl: null,
      acceptanceRateOverall: 90,
      testPolicy: "blind",
    });
    const rate = resolveAcceptance(university);
    expect(rate.overallTier).toBe(4);
    expect(rate.tier).toBe(4);

    // GPA 4.2/5.0-uz -> normalizeGpa = 3.46 (4.0 scale), zero rubric.
    const profile = makeProfile({
      gpaValue: 4.2,
      gpaScale: "5.0-uz",
      satTotal: undefined,
      rubric: { leadership: 0, awards: 0, commitment: 0, focus: 0 },
    });
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.path).toBe("B");
    expect(result.gpa.normalized).toBeCloseTo(3.46, 5);
    // tier-4 band [2.3, 3.0]: 3.46 is above p75 -> 75 + 20*(3.46-3.0)/0.7 = 88.14...
    const gpaScoreTier4 = Math.min(95, 75 + (20 * (3.46 - 3.0)) / 0.7);
    const rubricTotal = 5; // focus level 0 = 5, everything else 0
    const academicRaw = 0.7 * gpaScoreTier4 + 0.3 * rubricTotal;
    expect(result.score).toBeCloseTo(academicRaw - 2, 5); // tier-4 intl penalty = 2

    // The headline fix: this used to land at ~49 (Reach, <55). It should now
    // clear the Target threshold (55) for a school where 90% of applicants
    // are admitted.
    expect(result.score).toBeGreaterThanOrEqual(55);
  });
});

describe("Academic Fit — final clamp (§1.4)", () => {
  it("never drops below 5", () => {
    const profile = makeProfile({ satTotal: 900, gpaValue: 2.0, gpaScale: "4.0" });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("never exceeds 95", () => {
    const profile = makeProfile({ satTotal: 1700, gpaValue: 4.0, gpaScale: "4.0" });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));

    expect(result.score).toBeLessThanOrEqual(95);
  });
});

describe("Academic Fit — AP bonus (§1.5)", () => {
  // Baseline: SAT 1400, Tier 2, intl published → no intl penalty.
  // academicRaw = 0.6 * 57.5 + 0.4 * 57.5 = 57.5 exactly.
  function baseScore() {
    const profile = makeProfile({ satTotal: 1400 });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    return calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
  }

  it("no AP scores → bonus is 0, score unchanged", () => {
    const result = baseScore();
    expect(result.apBonus).toBe(0);
  });

  it("undefined apScores → bonus is 0", () => {
    const profile = makeProfile({ satTotal: 1400, apScores: undefined });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(0);
  });

  it("3 strong APs (score 5) → bonus = +4.5", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: [
        { subject: "Calculus BC", score: 5 },
        { subject: "Chemistry", score: 5 },
        { subject: "Computer Science A", score: 5 },
      ],
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(4.5);
    expect(result.score).toBeCloseTo(57.5 + 4.5);
  });

  it("8 strong APs → bonus capped at +8 (not +12)", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: Array.from({ length: 8 }, (_, i) => ({ subject: `AP ${i}`, score: 5 })),
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(8);
  });

  it("1 passing AP (score 3) → bonus = +0.5", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: [{ subject: "Statistics", score: 3 }],
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(0.5);
  });

  it("7 passing APs (score 3) → bonus capped at +3 (not +3.5)", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: Array.from({ length: 7 }, (_, i) => ({ subject: `AP ${i}`, score: 3 })),
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(3);
  });

  it("mixed: 2 strong (score 4) + 3 passing (score 3) → +3.0 + +1.5 = +4.5", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: [
        { subject: "Biology", score: 4 },
        { subject: "Chemistry", score: 4 },
        { subject: "Statistics", score: 3 },
        { subject: "Psychology", score: 3 },
        { subject: "US History", score: 3 },
      ],
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBeCloseTo(4.5);
  });

  it("scores 1 and 2 → no effect, bonus = 0", () => {
    const profile = makeProfile({
      satTotal: 1400,
      apScores: [
        { subject: "Calculus AB", score: 2 },
        { subject: "Physics 1", score: 1 },
      ],
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.apBonus).toBe(0);
  });

  it("AP bonus cannot push final score above 95 (clamp)", () => {
    // SAT 1600 at Tier 2 → academicRaw near 95; adding APs must not break the cap.
    const profile = makeProfile({
      satTotal: 1600,
      gpaValue: 4.0,
      gpaScale: "4.0",
      apScores: Array.from({ length: 8 }, (_, i) => ({ subject: `AP ${i}`, score: 5 })),
    });
    const university = makeUniversity();
    const rate = resolveAcceptance(university);
    const result = calculateAcademicFit(profile, university, rate, calculateRubricTotal(profile.rubric));
    expect(result.score).toBeLessThanOrEqual(95);
  });
});
