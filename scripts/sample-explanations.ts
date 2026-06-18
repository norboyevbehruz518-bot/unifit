import { calculateFitResult } from "../src/lib/fit-engine/index";
import type { StudentProfile, University } from "../src/types/domain";

const student: StudentProfile = {
  gpaValue: 4.6,
  gpaScale: "5.0-uz",
  satTotal: 1380,
  englishTest: "ielts",
  englishScore: 6.5,
  intendedMajors: ["computer-science"],
  annualBudgetUsd: 15000,
  aidNeedLevel: "full",
  rubric: { leadership: 1, awards: 1, commitment: 1, focus: 1 },
  citizenship: "UZ",
};

const mit: University = {
  id: "mit",
  name: "MIT",
  state: "MA",
  city: "Cambridge",
  setting: "urban",
  undergradEnrollment: 4638,
  type: "private",
  majorCategoriesOffered: ["computer-science", "engineering", "mathematics", "physics"],
  acceptanceRateOverall: 3.9,
  acceptanceRateIntl: 3.2,
  sat25: 1510, sat50: 1545, sat75: 1570,
  act25: 34, act50: 35, act75: 36,
  testPolicy: "required",
  ieltsMin: 7.0,
  toeflMin: 90,
  costOfAttendanceUsd: 85000,
  intlAidPolicy: "need-blind-full-need",
  avgIntlAidUsd: 60000,
  pctIntlReceivingAid: 90,
  cdsUrl: "https://mit.edu/cds",
  admissionSourceYear: "2024-2025",
  fieldConfidence: {},
};

const asu: University = {
  id: "arizona-state",
  name: "Arizona State University",
  state: "AZ",
  city: "Tempe",
  setting: "urban",
  undergradEnrollment: 62000,
  type: "public",
  majorCategoriesOffered: ["computer-science", "engineering", "business", "biology"],
  acceptanceRateOverall: 87.5,
  acceptanceRateIntl: 70,
  sat25: 1040, sat50: 1160, sat75: 1290,
  act25: 19, act50: 24, act75: 30,
  testPolicy: "optional",
  ieltsMin: 6.5,
  toeflMin: 61,
  costOfAttendanceUsd: 50000,
  intlAidPolicy: "need-aware",
  avgIntlAidUsd: 8000,
  pctIntlReceivingAid: 15,
  cdsUrl: "https://asu.edu/cds",
  admissionSourceYear: "2024-2025",
  fieldConfidence: {},
};

function show(name: string, university: University) {
  const r = calculateFitResult(student, university);
  console.log(`\n=== ${name} ===`);
  console.log(`Overall: ${r.overall} | Category: ${r.category}`);
  console.log(`Gates: ${r.gatesFired.map((g) => g.gate).join(", ") || "none"}`);
  console.log(`\nAcademic:  ${r.explanations.academic}`);
  console.log(`Practical: ${r.explanations.practical}`);
  console.log(`Profile:   ${r.explanations.profile}`);
  console.log(`Overall:   ${r.explanations.overall}`);
  if (r.explanations.specialNote) console.log(`Note:      ${r.explanations.specialNote}`);
}

show("MIT", mit);
show("Arizona State University", asu);
