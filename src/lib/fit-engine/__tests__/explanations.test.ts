/**
 * Explanation template tests against FIT_ALGORITHM.md §5.
 * Checks template selection per band/case, absence of leaked `{placeholder}`
 * syntax, and that no template uses discouraging/rejection language
 * (DOMAIN.md "never discourage" principle).
 */

import { describe, expect, it } from "vitest";
import { explainAcademic, explainOverall, explainPractical, explainProfile } from "../explanations";
import type { AcademicResult, PracticalResult, RateResolution } from "../types";
import { calculateFitResult } from "../index";
import { makeProfile, makeUniversity, mockAcademic, mockPractical, mockProfile } from "./fixtures";

const PUBLISHED: RateResolution = { r: 15, tier: 2, intlPublished: true };
const ADJUSTED: RateResolution = { r: 12, tier: 2, intlPublished: false };

function academicWithTest(score: number): AcademicResult {
  return {
    ...mockAcademic(score),
    path: "A",
    testUsed: { name: "SAT", value: 1400, p25: 1300, p75: 1500 },
  };
}

describe("explainAcademic (§5)", () => {
  it("high band: above the middle range", () => {
    const text = explainAcademic(academicWithTest(80), PUBLISHED);
    expect(text).toContain("above the middle range");
    expect(text).toContain("1400");
    expect(text).toContain("1300");
    expect(text).toContain("1500");
  });

  it("mid band: lands inside this school's middle range", () => {
    const text = explainAcademic(academicWithTest(57.5), PUBLISHED);
    expect(text).toContain("lands inside this school's middle range");
  });

  it("low band: below this school's typical range", () => {
    const text = explainAcademic(academicWithTest(30), PUBLISHED);
    expect(text).toContain("below this school's typical range");
  });

  it("Path B: no-test template references the student's GPA", () => {
    const academic: AcademicResult = { ...mockAcademic(50), path: "B", testUsed: null };
    const text = explainAcademic(academic, PUBLISHED);
    expect(text).toContain("Without test scores");
    expect(text).toContain("3.7");
  });

  it("appends the intl-adjusted caveat when the rate is not published", () => {
    const text = explainAcademic(academicWithTest(57.5), ADJUSTED);
    expect(text).toContain("doesn't publish international-specific stats");
  });

  it("does not append the intl-adjusted caveat when the rate is published", () => {
    const text = explainAcademic(academicWithTest(57.5), PUBLISHED);
    expect(text).not.toContain("doesn't publish international-specific stats");
  });

  it("returns the gate explanation directly when a blocking academic gate fired", () => {
    const academic: AcademicResult = {
      ...academicWithTest(25),
      gates: [{ gate: "test-required", explanation: "This school requires the SAT or ACT — taking one unlocks this school." }],
    };
    const text = explainAcademic(academic, PUBLISHED);
    expect(text).toBe("This school requires the SAT or ACT — taking one unlocks this school.");
  });
});

describe("explainPractical (§5)", () => {
  const profile = makeProfile({ annualBudgetUsd: 70000 });
  const university = makeUniversity({ avgIntlAidUsd: 40000 });

  it("high band: costs work", () => {
    const practical: PracticalResult = { ...mockPractical(85), affordabilityScore: 85, netCost: 60000 };
    const text = explainPractical(profile, university, practical);
    expect(text).toContain("the costs work");
    expect(text).toContain("70000");
  });

  it("mid band: doable with merit aid, includes coverage percent and net cost", () => {
    const practical: PracticalResult = { ...mockPractical(55), affordabilityScore: 55, netCost: 100000 };
    const text = explainPractical(profile, university, practical);
    expect(text).toContain("Your budget covers about");
    expect(text).toContain("%");
    expect(text).toContain("100000");
  });

  it("low band: cost well above budget", () => {
    const practical: PracticalResult = { ...mockPractical(20), affordabilityScore: 20, netCost: 150000 };
    const text = explainPractical(profile, university, practical);
    expect(text).toContain("is well above your");
  });

  it("returns the Gate F explanation directly when fired", () => {
    const practical: PracticalResult = {
      ...mockPractical(15),
      gates: [{ gate: "financial", explanation: "GATE F TEXT" }],
    };
    expect(explainPractical(profile, university, practical)).toBe("GATE F TEXT");
  });

  it("returns the Gate M explanation directly when fired", () => {
    const practical: PracticalResult = {
      ...mockPractical(20),
      gates: [{ gate: "major-unavailable", explanation: "GATE M TEXT" }],
    };
    expect(explainPractical(profile, university, practical)).toBe("GATE M TEXT");
  });

  it("appends the merit-lottery caveat with the stated odds", () => {
    const practical: PracticalResult = {
      ...mockPractical(85),
      affordabilityScore: 85,
      meritLottery: { pctReceiving: 20, avgAid: 15000 },
    };
    const text = explainPractical(profile, university, practical);
    expect(text).toContain("20%");
    expect(text).toContain("15000");
    expect(text).toContain("don't build your plan on it");
  });
});

describe("explainProfile (§5)", () => {
  const rubric = { leadership: 1 as const, awards: 1 as const, commitment: 1 as const, focus: 1 as const };

  it("high band: stands out", () => {
    const text = explainProfile(rubric, mockProfile(80));
    expect(text).toContain("stands out");
  });

  it("mid band: typical of students admitted here", () => {
    const text = explainProfile(rubric, mockProfile(55));
    expect(text).toContain("typical of students admitted here");
  });

  it("low band: students here usually show", () => {
    const text = explainProfile(rubric, mockProfile(30));
    expect(text).toContain("Students here usually show");
  });
});

describe("explainOverall (§5)", () => {
  it("safety", () => expect(explainOverall("safety", PUBLISHED)).toContain("Strong fit and strong odds"));
  it("target", () => expect(explainOverall("target", PUBLISHED)).toContain("genuine match"));
  it("reach", () => {
    const text = explainOverall("reach", { r: 8, tier: 1, intlPublished: true });
    expect(text).toContain("Reach");
    expect(text).toContain("8%");
    expect(text).toContain("pair it with Targets");
  });
  it("null category (gated) uses the Reach framing too", () => {
    const text = explainOverall(null, { r: 8, tier: 1, intlPublished: true });
    expect(text).toContain("Reach");
  });
});

describe("Explanations — no leaked placeholders or discouraging language (integration)", () => {
  const DISCOURAGING_WORDS = ["reject", "worthless", "hopeless", "fail", "no chance", "stupid"];

  const scenarios: { name: string; profile: ReturnType<typeof makeProfile>; university: ReturnType<typeof makeUniversity> }[] = [
    { name: "default fit (Tier 2, on-band)", profile: makeProfile(), university: makeUniversity() },
    {
      name: "Gate F: no aid, over budget",
      profile: makeProfile({ annualBudgetUsd: 30000 }),
      university: makeUniversity({ intlAidPolicy: "none", costOfAttendanceUsd: 70000 }),
    },
    {
      name: "Gate M: major unavailable",
      profile: makeProfile({ intendedMajors: ["biology"] }),
      university: makeUniversity({ majorCategoriesOffered: ["computer-science"] }),
    },
    {
      name: "English gate: no English test",
      profile: makeProfile({ englishTest: "none", englishScore: undefined }),
      university: makeUniversity(),
    },
    {
      name: "test-required gate: no SAT/ACT",
      profile: makeProfile({ satTotal: undefined, actComposite: undefined }),
      university: makeUniversity({ testPolicy: "required" }),
    },
    {
      name: "sub-10% Reach override, top student",
      profile: makeProfile({ satTotal: 1580, gpaValue: 4.0 }),
      university: makeUniversity({ acceptanceRateIntl: 4, sat25: 1500, sat75: 1570 }),
    },
    {
      name: "test-optional, score withheld (Path B)",
      profile: makeProfile({ satTotal: 1100 }),
      university: makeUniversity({ testPolicy: "optional" }),
    },
    {
      name: "merit-lottery caveat",
      profile: makeProfile({ aidNeedLevel: "full" }),
      university: makeUniversity({ intlAidPolicy: "merit-only", avgIntlAidUsd: 10000, pctIntlReceivingAid: 15 }),
    },
  ];

  it.each(scenarios)("$name", ({ profile, university }) => {
    const result = calculateFitResult(profile, university);
    const explanations = Object.values(result.explanations);

    for (const text of explanations) {
      expect(text.length).toBeGreaterThan(0);
      // No unresolved `{placeholder}` tokens.
      expect(text).not.toMatch(/\{[a-zA-Z0-9]+\}/);

      const lower = text.toLowerCase();
      for (const word of DISCOURAGING_WORDS) {
        expect(lower).not.toContain(word);
      }
    }
  });
});
