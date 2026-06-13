/**
 * Data confidence tests against FIT_ALGORITHM.md §6.
 */

import { describe, expect, it } from "vitest";
import { deriveConfidence } from "../confidence";
import type { ConfidenceInputs } from "../types";

const ALL_CLEAR: ConfidenceInputs = {
  intlPublished: true,
  gpaConverted: false,
  pathB: false,
  percentilesMissingWithTest: false,
  meritAidUnknown: false,
  academicOnTierAnchorsOnly: false,
  costEstimated: false,
  dataStale: false,
};

describe("deriveConfidence (§6)", () => {
  it("is high when no caps are triggered", () => {
    expect(deriveConfidence(ALL_CLEAR)).toBe("high");
  });

  it.each<[keyof ConfidenceInputs, boolean]>([
    ["intlPublished", false], // !intlPublished triggers medium
    ["gpaConverted", true],
    ["pathB", true],
    ["costEstimated", true],
    ["dataStale", true],
  ])("medium cap: %s = %s", (field, value) => {
    expect(deriveConfidence({ ...ALL_CLEAR, [field]: value })).toBe("medium");
  });

  it.each<keyof ConfidenceInputs>(["percentilesMissingWithTest", "meritAidUnknown", "academicOnTierAnchorsOnly"])(
    "low cap: %s",
    (field) => {
      expect(deriveConfidence({ ...ALL_CLEAR, [field]: true })).toBe("low");
    },
  );

  it("low caps win even when a medium trigger is also present", () => {
    expect(deriveConfidence({ ...ALL_CLEAR, pathB: true, meritAidUnknown: true })).toBe("low");
  });
});
