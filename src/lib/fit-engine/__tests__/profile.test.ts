/**
 * Profile Fit tests against FIT_ALGORITHM.md §3.
 *
 * profileFit = clamp(50 + k_tier * (rubricTotal - E_tier), 5, 95)
 *
 * RUBRIC_POINTS (DOMAIN.md §2 / weights.ts):
 *   leadership: [0, 8, 17, 25]
 *   awards:     [0, 6, 12, 19, 25]
 *   commitment: [0, 8, 17, 25]
 *   focus:      [5, 12, 18, 25]
 *
 * PROFILE_CURVE: tier1 {E:75,k:1.2}, tier2 {E:60,k:1.0}, tier3 {E:45,k:0.8}, tier4 {E:30,k:0.6}
 */

import { describe, expect, it } from "vitest";
import type { ProfileRubric, SelectivityTier } from "@/types/domain";
import { calculateProfileFit, calculateRubricTotal } from "../profile";

const BASE_RUBRIC: ProfileRubric = { leadership: 0, awards: 0, commitment: 0, focus: 0 };

const RUBRIC_POINTS: Record<keyof ProfileRubric, number[]> = {
  leadership: [0, 8, 17, 25],
  awards: [0, 6, 12, 19, 25],
  commitment: [0, 8, 17, 25],
  focus: [5, 12, 18, 25],
};

const PROFILE_CURVE: Record<SelectivityTier, { expected: number; k: number }> = {
  1: { expected: 75, k: 1.2 },
  2: { expected: 60, k: 1.0 },
  3: { expected: 45, k: 0.8 },
  4: { expected: 30, k: 0.6 },
};

function expectedScore(rubricTotal: number, tier: SelectivityTier): number {
  const { expected, k } = PROFILE_CURVE[tier];
  return Math.min(95, Math.max(5, 50 + k * (rubricTotal - expected)));
}

describe("calculateRubricTotal", () => {
  it("sums the points for the chosen level in each dimension", () => {
    expect(calculateRubricTotal(BASE_RUBRIC)).toBe(0 + 0 + 0 + 5); // focus level 0 = 5
    expect(calculateRubricTotal({ leadership: 3, awards: 4, commitment: 3, focus: 3 })).toBe(25 * 4);
  });
});

describe("Profile Fit — every rubric level against every selectivity tier (§3)", () => {
  const tiers: SelectivityTier[] = [1, 2, 3, 4];
  const dimensions = Object.keys(RUBRIC_POINTS) as (keyof ProfileRubric)[];

  for (const tier of tiers) {
    for (const dimension of dimensions) {
      const levels = RUBRIC_POINTS[dimension];
      for (let level = 0; level < levels.length; level++) {
        it(`tier ${tier}, ${dimension} level ${level}`, () => {
          const rubric: ProfileRubric = { ...BASE_RUBRIC, [dimension]: level };
          const rubricTotal = calculateRubricTotal(rubric);
          const result = calculateProfileFit(rubric, tier);

          expect(result.tier).toBe(tier);
          expect(result.rubricTotal).toBe(rubricTotal);
          expect(result.expectation).toBe(PROFILE_CURVE[tier].expected);
          expect(result.score).toBeCloseTo(expectedScore(rubricTotal, tier), 5);
        });
      }
    }
  }
});

describe("Profile Fit — clamp bounds (§3)", () => {
  it("never drops below 5 for a minimal rubric at tier 1", () => {
    const result = calculateProfileFit(BASE_RUBRIC, 1); // rubricTotal = 5, E = 75, k = 1.2 -> -34
    expect(result.score).toBe(5);
  });

  it("never exceeds 95 for a maximal rubric at tier 4", () => {
    const maxed: ProfileRubric = { leadership: 3, awards: 4, commitment: 3, focus: 3 };
    const result = calculateProfileFit(maxed, 4); // rubricTotal = 100, E = 30, k = 0.6 -> 92
    expect(result.score).toBeLessThanOrEqual(95);
    expect(result.score).toBeCloseTo(92, 5);
  });
});
