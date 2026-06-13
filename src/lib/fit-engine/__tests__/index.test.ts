/**
 * Tests for the calculateFitResult entry point — focuses on the §6
 * staleness check (isDataStale), which is only exercised when the caller
 * supplies `currentYear`. Sub-score behavior is covered by the
 * per-module test files.
 */

import { describe, expect, it } from "vitest";
import { calculateFitResult } from "../index";
import { makeProfile, makeUniversity } from "./fixtures";

describe("calculateFitResult — §6 staleness (isDataStale)", () => {
  it("without currentYear, data is never considered stale", () => {
    const profile = makeProfile();
    const university = makeUniversity({ admissionSourceYear: "2020-2021" });
    const result = calculateFitResult(profile, university);
    expect(result.dataConfidence).not.toBe("low");
  });

  it("within STALE_AFTER_CYCLES admission cycles, data is not stale", () => {
    // admissionSourceYear "2024-2025" -> 2024; currentYear 2026 -> 2026-2024 = 2, not > 2
    const profile = makeProfile();
    const university = makeUniversity({ admissionSourceYear: "2024-2025" });
    const result = calculateFitResult(profile, university, 2026);
    expect(result.dataConfidence).toBe("high");
  });

  it("beyond STALE_AFTER_CYCLES admission cycles, data is stale and caps confidence at medium", () => {
    // admissionSourceYear "2024-2025" -> 2024; currentYear 2027 -> 2027-2024 = 3 > 2
    const profile = makeProfile();
    const university = makeUniversity({ admissionSourceYear: "2024-2025" });
    const result = calculateFitResult(profile, university, 2027);
    expect(result.dataConfidence).toBe("medium");
  });

  it("an admissionSourceYear with no 4-digit year is never considered stale", () => {
    const profile = makeProfile();
    const university = makeUniversity({ admissionSourceYear: "unknown" });
    const result = calculateFitResult(profile, university, 2030);
    expect(result.dataConfidence).toBe("high");
  });
});
