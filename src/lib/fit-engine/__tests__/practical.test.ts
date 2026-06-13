/**
 * Practical Fit tests against FIT_ALGORITHM.md §2.
 */

import { describe, expect, it } from "vitest";
import { calculatePracticalFit } from "../practical";
import { makeProfile, makeUniversity } from "./fixtures";

describe("Practical Fit — Gate F (financial impossibility, §2.1)", () => {
  it("caps the score at 15 regardless of an otherwise-perfect major match", () => {
    const profile = makeProfile({
      annualBudgetUsd: 50000,
      intendedMajors: ["computer-science"], // "all" match -> majorScore 100
    });
    const university = makeUniversity({
      intlAidPolicy: "none",
      costOfAttendanceUsd: 70000, // budget < CoA, no aid
      majorCategoriesOffered: ["computer-science"],
    });

    const result = calculatePracticalFit(profile, university);

    expect(result.majorMatch).toBe("all");
    expect(result.gates.map((g) => g.gate)).toContain("financial");
    expect(result.score).toBe(15);
  });

  it("does not fire when the budget covers the cost even with no aid", () => {
    const profile = makeProfile({ annualBudgetUsd: 70000 });
    const university = makeUniversity({ intlAidPolicy: "none", costOfAttendanceUsd: 70000 });

    const result = calculatePracticalFit(profile, university);

    expect(result.gates.map((g) => g.gate)).not.toContain("financial");
  });

  it("does not fire when the school offers aid, even if budget < cost", () => {
    const profile = makeProfile({ annualBudgetUsd: 50000, aidNeedLevel: "full" });
    const university = makeUniversity({
      intlAidPolicy: "need-blind-full-need",
      costOfAttendanceUsd: 70000,
    });

    const result = calculatePracticalFit(profile, university);

    expect(result.gates.map((g) => g.gate)).not.toContain("financial");
  });
});

describe("Practical Fit — Gate M (major unavailable, §2.1)", () => {
  it("caps the score at 20 regardless of affordability", () => {
    const profile = makeProfile({
      intendedMajors: ["biology"],
      annualBudgetUsd: 70000,
      aidNeedLevel: "none",
    });
    const university = makeUniversity({
      majorCategoriesOffered: ["computer-science", "engineering"],
      costOfAttendanceUsd: 70000, // ratio = 1 -> affordability 100
    });

    const result = calculatePracticalFit(profile, university);

    expect(result.majorMatch).toBe("none");
    expect(result.majorScore).toBe(0);
    expect(result.gates.map((g) => g.gate)).toContain("major-unavailable");
    expect(result.score).toBe(20);
  });

  it("Gate M with no intended majors at all -> generic placeholder in the explanation", () => {
    const profile = makeProfile({
      intendedMajors: [],
      annualBudgetUsd: 70000,
      aidNeedLevel: "none",
    });
    const university = makeUniversity({
      majorCategoriesOffered: ["computer-science", "engineering"],
      costOfAttendanceUsd: 70000,
    });

    const result = calculatePracticalFit(profile, university);

    expect(result.majorMatch).toBe("none");
    const gate = result.gates.find((g) => g.gate === "major-unavailable");
    expect(gate?.explanation).toContain("your intended major");
  });
});

describe("Practical Fit — net cost by aid policy (§2.2 step 1)", () => {
  const baseProfile = { annualBudgetUsd: 50000, aidNeedLevel: "full" as const };

  it("need-blind-full-need: netCost = budget", () => {
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({ intlAidPolicy: "need-blind-full-need", costOfAttendanceUsd: 70000 });
    expect(calculatePracticalFit(profile, university).netCost).toBe(50000);
  });

  it("need-aware, aid covers the gap: netCost = budget", () => {
    // gap = 70000 - 50000 = 20000; avgIntlAidUsd 40000 >= gap
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({
      intlAidPolicy: "need-aware",
      costOfAttendanceUsd: 70000,
      avgIntlAidUsd: 40000,
    });
    expect(calculatePracticalFit(profile, university).netCost).toBe(50000);
  });

  it("need-aware, aid does not cover the gap: netCost = CoA - avgIntlAidUsd", () => {
    // gap = 70000 - 50000 = 20000; avgIntlAidUsd 10000 < gap
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({
      intlAidPolicy: "need-aware",
      costOfAttendanceUsd: 70000,
      avgIntlAidUsd: 10000,
    });
    expect(calculatePracticalFit(profile, university).netCost).toBe(60000);
  });

  it("merit-only with published average aid: netCost = CoA - avgIntlAidUsd", () => {
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({
      intlAidPolicy: "merit-only",
      costOfAttendanceUsd: 70000,
      avgIntlAidUsd: 20000,
    });
    expect(calculatePracticalFit(profile, university).netCost).toBe(50000);
  });

  it("merit-only with unpublished average aid: netCost = CoA", () => {
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({
      intlAidPolicy: "merit-only",
      costOfAttendanceUsd: 70000,
      avgIntlAidUsd: null,
    });
    expect(calculatePracticalFit(profile, university).netCost).toBe(70000);
  });

  it("no aid policy: netCost = CoA", () => {
    const profile = makeProfile(baseProfile);
    const university = makeUniversity({ intlAidPolicy: "none", costOfAttendanceUsd: 70000 });
    expect(calculatePracticalFit(profile, university).netCost).toBe(70000);
  });

  it("aidNeedLevel = none: netCost = CoA regardless of policy", () => {
    const profile = makeProfile({ annualBudgetUsd: 50000, aidNeedLevel: "none" });
    const university = makeUniversity({
      intlAidPolicy: "need-blind-full-need",
      costOfAttendanceUsd: 70000,
    });
    expect(calculatePracticalFit(profile, university).netCost).toBe(70000);
  });
});

describe("Practical Fit — affordability anchors (§2.2 step 2)", () => {
  // intlAidPolicy "none" -> netCost = CoA = 100000, so ratio = budget / 100000.
  it.each([
    [100000, 1.0, 100],
    [80000, 0.8, 75],
    [60000, 0.6, 45],
    [40000, 0.4, 20],
    [30000, 0.3, 10], // below 0.4 -> floor of 10, not the 20 the line would extrapolate to
    [70000, 0.7, 60], // halfway between (0.6, 45) and (0.8, 75)
  ])("budget %i -> ratio %f -> affordability %f", (budget, expectedRatio, expectedScore) => {
    const profile = makeProfile({ annualBudgetUsd: budget, aidNeedLevel: "full" });
    const university = makeUniversity({ intlAidPolicy: "none", costOfAttendanceUsd: 100000 });

    const result = calculatePracticalFit(profile, university);
    expect(result.ratio).toBeCloseTo(expectedRatio, 5);
    expect(result.affordabilityScore).toBeCloseTo(expectedScore, 5);
  });
});

describe("Practical Fit — major availability (§2.3)", () => {
  it("all intended majors offered -> 'all', 100", () => {
    const profile = makeProfile({ intendedMajors: ["computer-science"] });
    const university = makeUniversity({ majorCategoriesOffered: ["computer-science", "engineering"] });
    const result = calculatePracticalFit(profile, university);
    expect(result.majorMatch).toBe("all");
    expect(result.majorScore).toBe(100);
  });

  it("first-choice major offered, others not -> 'first-choice', 90", () => {
    const profile = makeProfile({ intendedMajors: ["computer-science", "biology"] });
    const university = makeUniversity({ majorCategoriesOffered: ["computer-science", "engineering"] });
    const result = calculatePracticalFit(profile, university);
    expect(result.majorMatch).toBe("first-choice");
    expect(result.majorScore).toBe(90);
  });

  it("a non-first-choice intended major offered -> 'partial', 60", () => {
    const profile = makeProfile({ intendedMajors: ["biology", "computer-science"] });
    const university = makeUniversity({ majorCategoriesOffered: ["computer-science", "engineering"] });
    const result = calculatePracticalFit(profile, university);
    expect(result.majorMatch).toBe("partial");
    expect(result.majorScore).toBe(60);
  });

  it("no intended major offered -> 'none', 0", () => {
    const profile = makeProfile({ intendedMajors: ["biology"] });
    const university = makeUniversity({ majorCategoriesOffered: ["computer-science", "engineering"] });
    const result = calculatePracticalFit(profile, university);
    expect(result.majorMatch).toBe("none");
    expect(result.majorScore).toBe(0);
  });
});

describe("Practical Fit — merit-lottery caveat and unknown aid (§2.2, §6)", () => {
  it("flags the merit-lottery caveat when fewer than 30% of internationals receive aid", () => {
    const profile = makeProfile({ aidNeedLevel: "full" });
    const university = makeUniversity({
      intlAidPolicy: "merit-only",
      avgIntlAidUsd: 15000,
      pctIntlReceivingAid: 20,
    });
    const result = calculatePracticalFit(profile, university);
    expect(result.meritLottery).toEqual({ pctReceiving: 20, avgAid: 15000 });
  });

  it("does not flag the caveat when 30% or more receive aid", () => {
    const profile = makeProfile({ aidNeedLevel: "full" });
    const university = makeUniversity({
      intlAidPolicy: "merit-only",
      avgIntlAidUsd: 15000,
      pctIntlReceivingAid: 30,
    });
    const result = calculatePracticalFit(profile, university);
    expect(result.meritLottery).toBeNull();
  });

  it("flags meritAidUnknown when avgIntlAidUsd is unpublished and the student needs aid", () => {
    const profile = makeProfile({ aidNeedLevel: "full" });
    const university = makeUniversity({ intlAidPolicy: "merit-only", avgIntlAidUsd: null });
    const result = calculatePracticalFit(profile, university);
    expect(result.meritAidUnknown).toBe(true);
  });

  it("does not flag meritAidUnknown when the student needs no aid", () => {
    const profile = makeProfile({ aidNeedLevel: "none" });
    const university = makeUniversity({ intlAidPolicy: "merit-only", avgIntlAidUsd: null });
    const result = calculatePracticalFit(profile, university);
    expect(result.meritAidUnknown).toBe(false);
  });
});

describe("Practical Fit — overall blend (§2.3)", () => {
  it("practicalRaw = 0.7 * affordability + 0.3 * major", () => {
    const profile = makeProfile({
      annualBudgetUsd: 50000,
      aidNeedLevel: "none",
      intendedMajors: ["computer-science", "biology"], // first-choice -> 90
    });
    const university = makeUniversity({
      intlAidPolicy: "need-blind-full-need",
      costOfAttendanceUsd: 100000, // aidNeedLevel none -> netCost = CoA -> ratio 0.5
      majorCategoriesOffered: ["computer-science"],
    });
    const result = calculatePracticalFit(profile, university);
    // ratio 0.5 is between (0.4, 20) and (0.6, 45): 20 + 0.5*(0.5-0.4)/0.2*25 = 26.25
    const expectedAffordability = 20 + ((0.5 - 0.4) / (0.6 - 0.4)) * (45 - 20);
    expect(result.affordabilityScore).toBeCloseTo(expectedAffordability, 5);
    expect(result.score).toBeCloseTo(0.7 * expectedAffordability + 0.3 * 90, 5);
  });
});
