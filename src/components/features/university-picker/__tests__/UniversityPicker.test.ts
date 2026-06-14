import { describe, expect, it } from "vitest";
import { makeUniversity } from "@/lib/fit-engine/__tests__/fixtures";
import { shouldShowUltraSelectiveTip } from "../UniversityPicker";

const tier1 = makeUniversity({ acceptanceRateOverall: 5 });
const tier2 = makeUniversity({ acceptanceRateOverall: 20 });
const tier4 = makeUniversity({ acceptanceRateOverall: 80 });

describe("shouldShowUltraSelectiveTip", () => {
  it("is false with fewer than two selections, even if Tier 1", () => {
    expect(shouldShowUltraSelectiveTip([tier1])).toBe(false);
  });

  it("is false when fewer than 75% are Tier 1", () => {
    // 1 of 3 = 33%
    expect(shouldShowUltraSelectiveTip([tier1, tier2, tier4])).toBe(false);
  });

  it("is true for a pure Tier 1 list", () => {
    expect(shouldShowUltraSelectiveTip([tier1, tier1])).toBe(true);
  });

  it("is true for mostly Tier 1 with one Target (>= 75%)", () => {
    // 3 of 4 = 75%
    expect(shouldShowUltraSelectiveTip([tier1, tier1, tier1, tier2])).toBe(true);
  });

  it("is false for exactly 50% Tier 1", () => {
    expect(shouldShowUltraSelectiveTip([tier1, tier2])).toBe(false);
  });
});
