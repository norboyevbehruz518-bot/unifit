/**
 * Property-based sanity checks. Generates many random-but-valid
 * (StudentProfile, University) pairs with a seeded PRNG (deterministic
 * across runs) and checks invariants that must hold for ANY input per
 * FIT_ALGORITHM.md.
 */

import { describe, expect, it } from "vitest";
import type { AidNeedLevel, GpaScale, IntlAidPolicy, ProfileRubric, StudentProfile, TestPolicy, University } from "@/types/domain";
import { calculateFitResult } from "../index";
import { CATEGORY_RULES } from "../weights";
import { resolveAcceptance } from "../normalize";

// Deterministic PRNG (mulberry32) so failures are reproducible.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAJOR_POOL = ["computer-science", "engineering", "biology", "economics", "art"];

function generatePair(rand: () => number): { profile: StudentProfile; university: University } {
  const gpaScales: GpaScale[] = ["4.0", "5.0-uz", "percentage"];
  const gpaScale = gpaScales[Math.floor(rand() * gpaScales.length)]!;
  const gpaValue =
    gpaScale === "4.0" ? rand() * 4 : gpaScale === "5.0-uz" ? 2.5 + rand() * 3 : 50 + rand() * 55;

  const hasSat = rand() > 0.3;
  const hasAct = rand() > 0.7;

  const englishTestOptions: StudentProfile["englishTest"][] = ["ielts", "toefl", "none"];
  const englishTest = englishTestOptions[Math.floor(rand() * englishTestOptions.length)]!;

  const rubric: ProfileRubric = {
    leadership: Math.floor(rand() * 4) as ProfileRubric["leadership"],
    awards: Math.floor(rand() * 5) as ProfileRubric["awards"],
    commitment: Math.floor(rand() * 4) as ProfileRubric["commitment"],
    focus: Math.floor(rand() * 4) as ProfileRubric["focus"],
  };

  const numMajors = 1 + Math.floor(rand() * 3);
  const intendedMajors = Array.from(new Set(Array.from({ length: numMajors }, () => MAJOR_POOL[Math.floor(rand() * MAJOR_POOL.length)]!)));

  const profile: StudentProfile = {
    gpaValue,
    gpaScale,
    satTotal: hasSat ? 400 + Math.floor(rand() * 1200) : undefined,
    actComposite: hasAct ? 1 + Math.floor(rand() * 35) : undefined,
    englishTest,
    englishScore: englishTest === "none" ? undefined : englishTest === "ielts" ? rand() * 9 : rand() * 120,
    intendedMajors,
    annualBudgetUsd: 1000 + rand() * 99000,
    aidNeedLevel: (["none", "partial", "full"] as AidNeedLevel[])[Math.floor(rand() * 3)]!,
    rubric,
    citizenship: "UZ",
  };

  const acceptanceRateOverall = 1 + rand() * 99;
  const intlPublished = rand() > 0.5;
  const sat25 = rand() > 0.2 ? 800 + Math.floor(rand() * 600) : null;
  const sat75 = sat25 != null ? sat25 + 50 + Math.floor(rand() * 300) : null;
  const act25 = rand() > 0.2 ? 15 + Math.floor(rand() * 15) : null;
  const act75 = act25 != null ? act25 + 2 + Math.floor(rand() * 8) : null;

  const testPolicies: TestPolicy[] = ["required", "optional", "blind"];
  const intlAidPolicies: IntlAidPolicy[] = ["need-blind-full-need", "need-aware", "merit-only", "none"];

  const costOfAttendanceUsd = 10000 + rand() * 90000;
  const intlAidPolicy = intlAidPolicies[Math.floor(rand() * 4)]!;
  // Keep netCost comfortably positive: avgIntlAidUsd never exceeds 90% of CoA.
  const avgIntlAidUsd = rand() > 0.3 ? Math.floor(rand() * costOfAttendanceUsd * 0.9) : null;

  const university: University = {
    id: `uni-${Math.floor(rand() * 1e9)}`,
    name: "Random University",
    state: "CA",
    city: "Randomville",
    setting: "urban",
    undergradEnrollment: 5000,
    type: "private",
    majorCategoriesOffered: Array.from(new Set(Array.from({ length: 1 + Math.floor(rand() * 3) }, () => MAJOR_POOL[Math.floor(rand() * MAJOR_POOL.length)]!))),
    acceptanceRateOverall,
    acceptanceRateIntl: intlPublished ? Math.max(0.1, acceptanceRateOverall * (0.4 + rand() * 0.5)) : null,
    sat25,
    sat50: sat25,
    sat75,
    act25,
    act50: act25,
    act75,
    testPolicy: testPolicies[Math.floor(rand() * 3)]!,
    ieltsMin: rand() > 0.5 ? 5 + rand() * 2 : null,
    toeflMin: rand() > 0.5 ? 60 + rand() * 40 : null,
    costOfAttendanceUsd,
    intlAidPolicy,
    avgIntlAidUsd,
    pctIntlReceivingAid: rand() > 0.3 ? rand() * 100 : null,
    cdsUrl: "https://example.com/cds",
    admissionSourceYear: "2024-2025",
    fieldConfidence: {},
  };

  return { profile, university };
}

describe("Property-based sanity (FIT_ALGORITHM.md, all sections)", () => {
  const rand = mulberry32(42);
  const SAMPLES = 300;

  for (let i = 0; i < SAMPLES; i++) {
    const { profile, university } = generatePair(rand);

    it(`sample ${i}: scores in range, category consistency, non-empty explanations`, () => {
      const result = calculateFitResult(profile, university);

      // 1. All sub-scores and overall stay within [0, 100].
      for (const score of [result.academicFit, result.practicalFit, result.profileFit, result.overall]) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isFinite(score)).toBe(true);
      }

      // 2. Gated <=> uncategorized.
      if (result.gatesFired.length > 0) {
        expect(result.category).toBeNull();
      } else {
        expect(result.category).not.toBeNull();
      }

      // 3. Category is consistent with academicFit + R per §4.2/§4.3, independent of
      //    the engine's own categorize() — recomputed directly from CATEGORY_RULES.
      if (result.category !== null) {
        const rate = resolveAcceptance(university);
        let expectedCategory: "safety" | "target" | "reach";
        if (result.academicFit >= CATEGORY_RULES.safetyMinAcademic && rate.r >= CATEGORY_RULES.safetyMinRate) {
          expectedCategory = "safety";
        } else if (result.academicFit >= CATEGORY_RULES.targetMinAcademic && rate.r >= CATEGORY_RULES.targetMinRate) {
          expectedCategory = "target";
        } else {
          expectedCategory = "reach";
        }
        expect(result.category).toBe(expectedCategory);

        // §4.3 absolute override: sub-10% acceptance is always at best a Reach.
        if (rate.r < 10) {
          expect(result.category).toBe("reach");
        }
      }

      // 4. Explanations are always present and non-empty.
      for (const text of Object.values(result.explanations)) {
        expect(text.length).toBeGreaterThan(0);
      }
    });
  }
});
