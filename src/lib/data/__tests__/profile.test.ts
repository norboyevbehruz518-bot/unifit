import { describe, expect, it } from "vitest";
import { mapProfileRow, type ProfileRow } from "../profile";

function makeRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "user-1",
    gpa_value: 3.8,
    gpa_scale: "4.0",
    sat_total: 1450,
    act_composite: null,
    english_test: "ielts",
    english_score: 7.5,
    intended_majors: ["computer-science"],
    annual_budget_usd: 40000,
    aid_need_level: "partial",
    rubric_leadership: 2,
    rubric_awards: 1,
    rubric_commitment: 3,
    rubric_focus: 2,
    citizenship: "UZ",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapProfileRow", () => {
  it("maps a profiles row onto the StudentProfile domain shape", () => {
    const row = makeRow();
    const profile = mapProfileRow(row);

    expect(profile.gpaValue).toBe(3.8);
    expect(profile.gpaScale).toBe("4.0");
    expect(profile.satTotal).toBe(1450);
    expect(profile.actComposite).toBeUndefined();
    expect(profile.englishTest).toBe("ielts");
    expect(profile.englishScore).toBe(7.5);
    expect(profile.intendedMajors).toEqual(["computer-science"]);
    expect(profile.annualBudgetUsd).toBe(40000);
    expect(profile.aidNeedLevel).toBe("partial");
    expect(profile.rubric).toEqual({ leadership: 2, awards: 1, commitment: 3, focus: 2 });
    expect(profile.citizenship).toBe("UZ");
  });

  it("converts numeric gpa_value coming back as a string from postgres", () => {
    const row = makeRow({ gpa_value: "3.8" as unknown as number });
    expect(mapProfileRow(row).gpaValue).toBe(3.8);
  });

  it("maps null optional test scores to undefined", () => {
    const row = makeRow({ sat_total: null, act_composite: 31, english_score: null });
    const profile = mapProfileRow(row);

    expect(profile.satTotal).toBeUndefined();
    expect(profile.actComposite).toBe(31);
    expect(profile.englishScore).toBeUndefined();
  });
});
