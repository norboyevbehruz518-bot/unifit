import type { AidNeedLevel, ApScore, EnglishTest, GpaScale, ProfileRubric } from "@/types/domain";

/**
 * Working state for the profile wizard. Numeric fields are kept as strings
 * while editing so inputs can be empty/partial without fighting NaN; they're
 * parsed at validation/submit time.
 */
export interface ProfileDraft {
  fullName: string;
  birthYear: string;
  citizenship: string;
  gpaValue: string;
  gpaScale: GpaScale;
  satTotal: string;
  actComposite: string;
  englishTest: EnglishTest;
  englishScore: string;
  intendedMajors: string[];
  annualBudgetUsd: number;
  fullScholarship: boolean;
  aidNeedLevel: AidNeedLevel;
  rubric: ProfileRubric;
  apScores: ApScore[];
}

export const EMPTY_DRAFT: ProfileDraft = {
  fullName: "",
  birthYear: "",
  citizenship: "",
  gpaValue: "",
  gpaScale: "4.0",
  satTotal: "",
  actComposite: "",
  englishTest: "none",
  englishScore: "",
  intendedMajors: [],
  annualBudgetUsd: 5000,
  fullScholarship: false,
  aidNeedLevel: "partial",
  rubric: { leadership: 0, awards: 0, commitment: 0, focus: 0 },
  apScores: [],
};
