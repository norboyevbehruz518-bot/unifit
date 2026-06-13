/**
 * Tests for shared scoring primitives against FIT_ALGORITHM.md §0.
 */

import { describe, expect, it } from "vitest";
import { bandScore, clamp, normalizeGpa, piecewiseLinear, resolveAcceptance, round1, selectivityTier } from "../normalize";
import { makeUniversity } from "./fixtures";

describe("clamp", () => {
  it("clamps below min", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps above max", () => expect(clamp(15, 0, 10)).toBe(10));
  it("passes through values in range", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("piecewiseLinear", () => {
  const anchors: [number, number][] = [
    [0, 0],
    [10, 100],
  ];

  it("interpolates the midpoint", () => expect(piecewiseLinear(5, anchors)).toBe(50));
  it("clamps below the first anchor", () => expect(piecewiseLinear(-5, anchors)).toBe(0));
  it("clamps above the last anchor", () => expect(piecewiseLinear(15, anchors)).toBe(100));
  it("returns exact anchor values", () => {
    expect(piecewiseLinear(0, anchors)).toBe(0);
    expect(piecewiseLinear(10, anchors)).toBe(100);
  });
});

describe("bandScore (§0.1)", () => {
  // p25 = 100, p75 = 200, w = 100
  it("at p25 -> 40", () => expect(bandScore(100, 100, 200)).toBe(40));
  it("at p75 -> 75", () => expect(bandScore(200, 100, 200)).toBe(75));
  it("at the midpoint -> 57.5", () => expect(bandScore(150, 100, 200)).toBe(57.5));
  it("at the 25th percentile exactly", () => expect(bandScore(100, 100, 200)).toBe(40));

  it("one band-width above p75 -> exactly 95 (cap)", () => expect(bandScore(300, 100, 200)).toBe(95));
  it("far above p75 -> still capped at 95", () => expect(bandScore(100000, 100, 200)).toBe(95));

  it("one band-width below p25 -> 15", () => expect(bandScore(0, 100, 200)).toBe(15));
  it("far below p25 -> floored at 5", () => expect(bandScore(-100000, 100, 200)).toBe(5));

  it("guards a degenerate band width (p25 === p75) with w = 1", () => {
    expect(bandScore(100, 100, 100)).toBe(40);
    // one unit above a zero-width band = one full band-width -> 75 + 20 = 95
    expect(bandScore(101, 100, 100)).toBe(95);
  });

  it("guards an inverted band (p75 < p25) with w = 1", () => {
    // p25 = 100, p75 = 99 (inverted) -> w falls back to 1
    expect(bandScore(99, 100, 99)).toBe(15); // one unit below p25 -> 40 - 25 = 15
    expect(bandScore(100, 100, 99)).toBe(95); // at/above p75 -> capped at 95
  });

  it("does NOT widen a small-but-real band (ADR-0003) — GPA-scale width 0.3", () => {
    // p25 = 3.55, p75 = 3.85, w = 0.3 (a real Tier-2 GPA band, §1.2)
    expect(bandScore(3.55, 3.55, 3.85)).toBe(40); // at p25
    expect(bandScore(3.85, 3.55, 3.85)).toBe(75); // at p75
    expect(bandScore(3.7, 3.55, 3.85)).toBeCloseTo(57.5, 5); // midpoint
  });
});

describe("normalizeGpa — 4.0 scale", () => {
  it("passes through values in [0, 4]", () => expect(normalizeGpa(3.5, "4.0")).toBe(3.5));
  it("clamps above 4.0", () => expect(normalizeGpa(4.5, "4.0")).toBe(4));
  it("clamps below 0", () => expect(normalizeGpa(-1, "4.0")).toBe(0));
});

describe("normalizeGpa — 5.0-uz scale (§0.3 table)", () => {
  it.each([
    [3.0, 2.3],
    [3.5, 2.8],
    [4.0, 3.3],
    [4.5, 3.7],
    [5.0, 4.0],
  ])("anchor %f -> %f", (input, expected) => {
    expect(normalizeGpa(input, "5.0-uz")).toBeCloseTo(expected, 5);
  });

  it("interpolates 4.6 -> 3.76 (spec worked example)", () => {
    expect(normalizeGpa(4.6, "5.0-uz")).toBeCloseTo(3.76, 5);
  });

  it("clamps inputs below 3.0 to the 3.0 anchor value", () => {
    expect(normalizeGpa(2.0, "5.0-uz")).toBeCloseTo(2.3, 5);
  });

  it("clamps inputs above 5.0 to the 5.0 anchor value", () => {
    expect(normalizeGpa(5.8, "5.0-uz")).toBeCloseTo(4.0, 5);
  });
});

describe("normalizeGpa — percentage scale (§0.3 table)", () => {
  it.each([
    [60, 2.3],
    [70, 2.8],
    [80, 3.3],
    [88, 3.7],
    [95, 4.0],
    [100, 4.0],
  ])("anchor %f -> %f", (input, expected) => {
    expect(normalizeGpa(input, "percentage")).toBeCloseTo(expected, 5);
  });

  it("interpolates between anchors (75 -> 3.05)", () => {
    expect(normalizeGpa(75, "percentage")).toBeCloseTo(3.05, 5);
  });

  it("is flat between 95 and 100 (97 -> 4.0)", () => {
    expect(normalizeGpa(97, "percentage")).toBeCloseTo(4.0, 5);
  });

  it("clamps inputs below 60 to the 60 anchor value", () => {
    expect(normalizeGpa(50, "percentage")).toBeCloseTo(2.3, 5);
  });

  it("clamps inputs above 100 to the 100 anchor value", () => {
    expect(normalizeGpa(110, "percentage")).toBeCloseTo(4.0, 5);
  });
});

describe("selectivityTier (§0.2)", () => {
  it.each([
    [5, 1],
    [9.99, 1],
    [10, 2],
    [25, 2],
    [25.01, 3],
    [50, 3],
    [50.01, 4],
    [100, 4],
  ])("acceptance rate %f%% -> tier %i", (rate, tier) => {
    expect(selectivityTier(rate)).toBe(tier);
  });
});

describe("resolveAcceptance (§0.2 + §1.4a)", () => {
  it("uses the published international rate directly when available", () => {
    const uni = makeUniversity({ acceptanceRateIntl: 8, acceptanceRateOverall: 30 });
    // overallTier comes from the unadjusted overall rate (30% -> tier 3),
    // independent of the published intl rate's own tier (8% -> tier 1).
    expect(resolveAcceptance(uni)).toEqual({ r: 8, tier: 1, overallTier: 3, intlPublished: true });
  });

  it("adjusts the overall rate by the overall-tier factor (overall tier 1)", () => {
    // overall 5% -> tier 1 -> factor 0.5 -> adjusted r = 2.5 -> tier(2.5) = 1
    const uni = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 5 });
    const result = resolveAcceptance(uni);
    expect(result.intlPublished).toBe(false);
    expect(result.r).toBeCloseTo(2.5, 5);
    expect(result.tier).toBe(1);
  });

  it("adjusts the overall rate by the overall-tier factor (overall tier 2)", () => {
    // overall 20% -> tier 2 -> factor 0.6 -> adjusted r = 12 -> tier(12) = 2
    const uni = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 20 });
    const result = resolveAcceptance(uni);
    expect(result.r).toBeCloseTo(12, 5);
    expect(result.tier).toBe(2);
  });

  it("adjusts the overall rate by the overall-tier factor (overall tier 3)", () => {
    // overall 40% -> tier 3 -> factor 0.7 -> adjusted r = 28 -> tier(28) = 3
    const uni = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 40 });
    const result = resolveAcceptance(uni);
    expect(result.r).toBeCloseTo(28, 5);
    expect(result.tier).toBe(3);
  });

  it("adjusts the overall rate by the overall-tier factor (overall tier 4)", () => {
    // overall 70% -> tier 4 -> factor 0.85 -> adjusted r = 59.5 -> tier(59.5) = 4
    const uni = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 70 });
    const result = resolveAcceptance(uni);
    expect(result.r).toBeCloseTo(59.5, 5);
    expect(result.tier).toBe(4);
  });

  it("the adjusted rate's tier can differ from the overall rate's tier", () => {
    // overall 11% -> overall tier 2 -> factor 0.6 -> adjusted r = 6.6 -> tier(6.6) = 1
    const uni = makeUniversity({ acceptanceRateIntl: null, acceptanceRateOverall: 11 });
    const result = resolveAcceptance(uni);
    expect(result.r).toBeCloseTo(6.6, 5);
    expect(result.tier).toBe(1);
  });
});

describe("round1", () => {
  it("rounds to one decimal place", () => {
    expect(round1(1.23)).toBe(1.2);
    expect(round1(1.26)).toBe(1.3);
    expect(round1(1)).toBe(1);
  });
});
