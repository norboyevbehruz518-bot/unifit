/**
 * Calibration sanity-check — runs the fit engine over a set of realistic
 * synthetic Uzbek-applicant profiles against a set of real US universities
 * with realistic stats, and prints a student x university table of
 * category + overall score for human review.
 *
 * Run: npx tsx scripts/calibrate.ts
 */

import type { StudentProfile, University } from "../src/types/domain";
import { calculateFitResult } from "../src/lib/fit-engine/index";

const MAJORS = ["computer-science", "engineering", "biology", "economics", "business", "mathematics"];

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

const students: { name: string; profile: StudentProfile }[] = [
  {
    name: "1. Top student",
    profile: {
      gpaValue: 5.0,
      gpaScale: "5.0-uz",
      satTotal: 1520,
      englishTest: "ielts",
      englishScore: 8.0,
      intendedMajors: ["computer-science", "engineering"],
      annualBudgetUsd: 5000,
      aidNeedLevel: "full",
      rubric: { leadership: 2, awards: 3, commitment: 2, focus: 2 }, // national olympiad winner
      citizenship: "UZ",
    },
  },
  {
    name: "2. Strong student",
    profile: {
      gpaValue: 4.7,
      gpaScale: "5.0-uz",
      satTotal: 1380,
      englishTest: "ielts",
      englishScore: 7.0,
      intendedMajors: ["economics", "business"],
      annualBudgetUsd: 8000,
      aidNeedLevel: "partial",
      rubric: { leadership: 1, awards: 2, commitment: 2, focus: 1 }, // regional awards
      citizenship: "UZ",
    },
  },
  {
    name: "3. Solid student",
    profile: {
      gpaValue: 4.5,
      gpaScale: "5.0-uz",
      // test-optional: no SAT/ACT submitted
      englishTest: "ielts",
      englishScore: 6.5,
      intendedMajors: ["business"],
      annualBudgetUsd: 15000,
      aidNeedLevel: "partial",
      rubric: { leadership: 1, awards: 1, commitment: 1, focus: 1 }, // school-level activities
      citizenship: "UZ",
    },
  },
  {
    name: "4. Average student",
    profile: {
      gpaValue: 4.2,
      gpaScale: "5.0-uz",
      // no SAT
      englishTest: "ielts",
      englishScore: 6.0,
      intendedMajors: ["business"],
      annualBudgetUsd: 10000,
      aidNeedLevel: "partial",
      rubric: { leadership: 0, awards: 0, commitment: 0, focus: 0 }, // minimal activities
      citizenship: "UZ",
    },
  },
  {
    name: "5. High-budget average",
    profile: {
      gpaValue: 4.2,
      gpaScale: "5.0-uz",
      satTotal: 1250,
      englishTest: "ielts",
      englishScore: 6.5,
      intendedMajors: ["business"],
      annualBudgetUsd: 60000,
      aidNeedLevel: "none",
      rubric: { leadership: 0, awards: 0, commitment: 1, focus: 0 },
      citizenship: "UZ",
    },
  },
  {
    name: "6. Spike profile",
    profile: {
      gpaValue: 4.4,
      gpaScale: "5.0-uz",
      satTotal: 1450,
      englishTest: "ielts",
      englishScore: 7.0,
      intendedMajors: ["computer-science"],
      annualBudgetUsd: 4000,
      aidNeedLevel: "full",
      rubric: { leadership: 1, awards: 4, commitment: 2, focus: 3 }, // intl programming olympiad medalist, spike
      citizenship: "UZ",
    },
  },
];

// ---------------------------------------------------------------------------
// Universities (realistic stats, ~2024-2025 cycle)
// ---------------------------------------------------------------------------

function makeUniversity(overrides: Partial<University> & Pick<University, "id" | "name">): University {
  return {
    state: "XX",
    city: "City",
    setting: "urban",
    undergradEnrollment: 10000,
    type: "private",
    majorCategoriesOffered: MAJORS,
    acceptanceRateOverall: 50,
    acceptanceRateIntl: null,
    sat25: null,
    sat50: null,
    sat75: null,
    act25: null,
    act50: null,
    act75: null,
    testPolicy: "optional",
    ieltsMin: 6.5,
    toeflMin: 80,
    costOfAttendanceUsd: 60000,
    intlAidPolicy: "merit-only",
    avgIntlAidUsd: null,
    pctIntlReceivingAid: null,
    cdsUrl: "https://example.com/cds",
    admissionSourceYear: "2024-2025",
    fieldConfidence: {},
    ...overrides,
  };
}

const universities: University[] = [
  makeUniversity({
    id: "mit",
    name: "MIT",
    type: "private",
    undergradEnrollment: 4600,
    acceptanceRateOverall: 4,
    acceptanceRateIntl: 3,
    sat25: 1520,
    sat50: 1550,
    sat75: 1580,
    act25: 35,
    act50: 35,
    act75: 36,
    testPolicy: "required",
    ieltsMin: 7.0,
    toeflMin: 100,
    costOfAttendanceUsd: 82000,
    intlAidPolicy: "need-blind-full-need",
    avgIntlAidUsd: 60000,
    pctIntlReceivingAid: 90,
  }),
  makeUniversity({
    id: "stanford",
    name: "Stanford",
    type: "private",
    undergradEnrollment: 7800,
    acceptanceRateOverall: 3.7,
    acceptanceRateIntl: 3,
    sat25: 1500,
    sat50: 1535,
    sat75: 1570,
    act25: 34,
    act50: 34,
    act75: 35,
    testPolicy: "required",
    ieltsMin: 7.0,
    toeflMin: 100,
    costOfAttendanceUsd: 87000,
    intlAidPolicy: "need-blind-full-need",
    avgIntlAidUsd: 62000,
    pctIntlReceivingAid: 88,
  }),
  makeUniversity({
    id: "nyu",
    name: "NYU",
    type: "private",
    undergradEnrollment: 28000,
    acceptanceRateOverall: 12.8,
    acceptanceRateIntl: null, // not separately published
    sat25: 1450,
    sat50: 1505,
    sat75: 1560,
    act25: 33,
    act50: 34,
    act75: 35,
    testPolicy: "optional",
    ieltsMin: 7.0,
    toeflMin: 100,
    costOfAttendanceUsd: 94000,
    intlAidPolicy: "need-aware",
    avgIntlAidUsd: 20000,
    pctIntlReceivingAid: 20,
  }),
  makeUniversity({
    id: "penn-state",
    name: "Penn State (University Park)",
    type: "public",
    undergradEnrollment: 40000,
    acceptanceRateOverall: 55,
    acceptanceRateIntl: null,
    sat25: 1160,
    sat50: 1270,
    sat75: 1380,
    act25: 24,
    act50: 27,
    act75: 31,
    testPolicy: "optional",
    ieltsMin: 6.5,
    toeflMin: 80,
    costOfAttendanceUsd: 58000,
    intlAidPolicy: "merit-only",
    avgIntlAidUsd: 5000,
    pctIntlReceivingAid: 10,
  }),
  makeUniversity({
    id: "asu",
    name: "Arizona State University",
    type: "public",
    undergradEnrollment: 65000,
    acceptanceRateOverall: 90,
    acceptanceRateIntl: null,
    sat25: 1140,
    sat50: 1245,
    sat75: 1350,
    act25: 21,
    act50: 25,
    act75: 29,
    testPolicy: "blind",
    ieltsMin: 6.0,
    toeflMin: 61,
    costOfAttendanceUsd: 48000,
    intlAidPolicy: "merit-only",
    avgIntlAidUsd: 10000,
    pctIntlReceivingAid: 30,
  }),
  makeUniversity({
    id: "alabama",
    name: "University of Alabama",
    type: "public",
    undergradEnrollment: 33000,
    acceptanceRateOverall: 80,
    acceptanceRateIntl: null,
    sat25: 1140,
    sat50: 1240,
    sat75: 1340,
    act25: 22,
    act50: 27,
    act75: 32,
    testPolicy: "optional",
    ieltsMin: 6.0,
    toeflMin: 68,
    costOfAttendanceUsd: 45000,
    intlAidPolicy: "merit-only",
    avgIntlAidUsd: 20000,
    pctIntlReceivingAid: 40,
  }),
];

// ---------------------------------------------------------------------------
// Run + print
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  safety: "Safety",
  target: "Target",
  reach: "Reach",
};

function categoryCell(category: string | null, gatesFired: { gate: string }[]): string {
  if (gatesFired.length > 0) {
    return `GATED (${gatesFired.map((g) => g.gate).join(", ")})`;
  }
  return category ? CATEGORY_LABEL[category] ?? category : "?";
}

const colWidth = 28;
const header = ["Student".padEnd(20), ...universities.map((u) => u.name.padEnd(colWidth))].join("| ");
console.log(header);
console.log("-".repeat(header.length));

for (const { name, profile } of students) {
  const cells = universities.map((university) => {
    const result = calculateFitResult(profile, university);
    const cat = categoryCell(result.category, result.gatesFired);
    return `${cat} (${result.overall.toFixed(1)})`.padEnd(colWidth);
  });
  console.log([name.padEnd(20), ...cells].join("| "));
}

// ---------------------------------------------------------------------------
// Detail dump (for follow-up debugging)
// ---------------------------------------------------------------------------

console.log("\n--- Detail (academic / practical / profile / overall / category / gates) ---\n");
for (const { name, profile } of students) {
  console.log(`## ${name}`);
  for (const university of universities) {
    const r = calculateFitResult(profile, university);
    console.log(
      `  ${university.name.padEnd(28)} A=${r.academicFit.toFixed(1).padStart(5)} ` +
        `P=${r.practicalFit.toFixed(1).padStart(5)} Pr=${r.profileFit.toFixed(1).padStart(5)} ` +
        `Overall=${r.overall.toFixed(1).padStart(5)} ${categoryCell(r.category, r.gatesFired)}`,
    );
  }
  console.log();
}
