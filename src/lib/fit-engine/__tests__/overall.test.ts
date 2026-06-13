/**
 * Overall score, category mapping, and list-balance tests against
 * FIT_ALGORITHM.md §4.
 */

import { describe, expect, it } from "vitest";
import type { FitCategory } from "@/types/domain";
import { analyzeListBalance, calculateOverall, categorize } from "../overall";
import type { RateResolution } from "../types";
import { mockAcademic, mockPractical, mockProfile } from "./fixtures";

function rate(r: number, tier: 1 | 2 | 3 | 4 = 2): RateResolution {
  return { r, tier, intlPublished: true };
}

describe("calculateOverall (§4.1)", () => {
  it("blends academic 0.5, practical 0.3, profile 0.2", () => {
    const overall = calculateOverall(mockAcademic(80), mockPractical(60), mockProfile(50));
    expect(overall).toBeCloseTo(0.5 * 80 + 0.3 * 60 + 0.2 * 50, 5);
  });
});

describe("categorize (§4.2/§4.3)", () => {
  it("Safety: academicFit >= 75 AND R >= 30", () => {
    expect(categorize(mockAcademic(80), mockPractical(80), rate(35))).toBe("safety");
  });

  it("boundary: academicFit = 75, R = 30 -> Safety (inclusive)", () => {
    expect(categorize(mockAcademic(75), mockPractical(80), rate(30))).toBe("safety");
  });

  it("just below the Safety academic threshold falls through to Target", () => {
    expect(categorize(mockAcademic(74.9), mockPractical(80), rate(30))).toBe("target");
  });

  it("just below the Safety rate threshold falls through to Target", () => {
    expect(categorize(mockAcademic(80), mockPractical(80), rate(29))).toBe("target");
  });

  it("Target: not Safety, academicFit >= 55, R >= 10", () => {
    expect(categorize(mockAcademic(60), mockPractical(80), rate(15))).toBe("target");
  });

  it("boundary: academicFit = 55, R = 10 -> Target (inclusive)", () => {
    expect(categorize(mockAcademic(55), mockPractical(80), rate(10))).toBe("target");
  });

  it("just below the Target academic threshold falls through to Reach", () => {
    expect(categorize(mockAcademic(54.9), mockPractical(80), rate(50))).toBe("reach");
  });

  it("§4.3 absolute override: R < 10% is ALWAYS at best a Reach, regardless of scores", () => {
    expect(categorize(mockAcademic(95), mockPractical(95), rate(9.99))).toBe("reach");
  });

  it("returns null when an academic gate fired (routes to Action needed)", () => {
    const academic = mockAcademic(80, [{ gate: "english-below-minimum", explanation: "x" }]);
    expect(categorize(academic, mockPractical(80), rate(35))).toBeNull();
  });

  it("returns null when a practical gate fired (routes to Action needed)", () => {
    const practical = mockPractical(15, [{ gate: "financial", explanation: "x" }]);
    expect(categorize(mockAcademic(80), practical, rate(35))).toBeNull();
  });
});

describe("analyzeListBalance (§4.5)", () => {
  it("empty list -> too-small", () => {
    const result = analyzeListBalance([]);
    expect(result.classification).toBe("too-small");
    expect(result.reachCount).toBe(0);
    expect(result.targetCount).toBe(0);
    expect(result.safetyCount).toBe(0);
  });

  it("single university -> too-small", () => {
    const result = analyzeListBalance(["safety"]);
    expect(result.classification).toBe("too-small");
  });

  it("all-Reach list (n >= 3) -> no-safety, not top-heavy (rule order)", () => {
    const categories: (FitCategory | null)[] = ["reach", "reach", "reach", "reach", "reach"];
    const result = analyzeListBalance(categories);
    expect(result.classification).toBe("no-safety");
    expect(result.reachCount).toBe(5);
    expect(result.safetyCount).toBe(0);
  });

  it("no targets but at least one safety -> no-target", () => {
    const categories: (FitCategory | null)[] = ["reach", "reach", "safety", "safety"];
    const result = analyzeListBalance(categories);
    expect(result.classification).toBe("no-target");
  });

  it("reach share > 0.6 with both targets and safeties present -> top-heavy", () => {
    const categories: (FitCategory | null)[] = [
      "reach",
      "reach",
      "reach",
      "reach",
      "reach",
      "reach",
      "reach",
      "target",
      "target",
      "safety",
    ];
    const result = analyzeListBalance(categories);
    expect(result.reachCount / categories.length).toBeGreaterThan(0.6);
    expect(result.classification).toBe("top-heavy");
  });

  it("balanced list -> balanced", () => {
    const categories: (FitCategory | null)[] = ["reach", "reach", "target", "target", "target", "safety", "safety"];
    const result = analyzeListBalance(categories);
    expect(result.classification).toBe("balanced");
    expect(result.reachCount).toBe(2);
    expect(result.targetCount).toBe(3);
    expect(result.safetyCount).toBe(2);
  });

  it("gated (null-category) schools count toward N but not toward any category", () => {
    const categories: (FitCategory | null)[] = [null, "reach", "target", "safety"];
    const result = analyzeListBalance(categories);
    expect(result.reachCount + result.targetCount + result.safetyCount).toBe(3);
  });
});
