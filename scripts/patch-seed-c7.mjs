import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const seedPath = resolve(import.meta.dirname, "../data/universities.seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

const C7 = {
  mit: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "considered",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "MIT reinstated test requirements for the Class of 2029 and conducts alumni interviews for virtually all applicants — a hands-on maker track record in science or engineering is uniquely valued here.",
  },
  harvard: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "important", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Harvard builds a class rather than admitting individuals — there is no formula, and the committee actively seeks students who will shape their community, not just succeed in it.",
  },
  stanford: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Stanford prizes intellectual vitality — its three required short essays are treated as a direct window into your mind, and generic responses to them are a common rejection trigger.",
  },
  princeton: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Princeton requires a senior thesis for every undergraduate and interviews most applicants via alumni — demonstrated love of deep, independent research is a strong differentiator here.",
  },
  yale: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Yale conducts alumni interviews for nearly every applicant and considers them significant — prepare to speak fluently about your intellectual interests and why Yale's residential college system fits how you learn.",
  },
  columbia: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "not considered", geographic: "considered", volunteer: "considered",
    work_experience: "considered",
    special_note: "Columbia's Core Curriculum is central to its identity — your essays must address why you specifically want a structured, interdisciplinary liberal-arts foundation alongside your major interests.",
  },
  upenn: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "important", geographic: "considered", volunteer: "important",
    work_experience: "important",
    special_note: "Penn rewards students who connect their ambitions across disciplines — articulating how your goals span multiple Penn schools (e.g., Wharton plus engineering) can set you apart in a competitive pool.",
  },
  cornell: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "important",
    talent_ability: "important", character: "very important", first_gen: "considered",
    alumni_relation: "considered", geographic: "considered", volunteer: "considered",
    work_experience: "considered",
    special_note: "Cornell admits to specific colleges, not the university — your Why Cornell essay must name the exact program and college you are applying to, and a mismatch between your stated major and chosen college is a common fatal error.",
  },
  brown: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Brown's Open Curriculum attracts students who take genuine ownership of their education — your application should describe the specific courses and concentrations you would combine, and why that self-direction defines how you learn.",
  },
  duke: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Duke prizes students who thrive at the intersection of disciplines — showing how your interests connect to its Bass Connections research program or DukeEngage experiential learning gives your application a concrete, Duke-specific angle.",
  },
  "johns-hopkins": {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "considered",
    alumni_relation: "not considered", geographic: "considered", volunteer: "important",
    work_experience: "important",
    special_note: "Hopkins is research-intensive even at the undergraduate level — applicants who can point to specific research projects, STEM competitions, or lab experience stand out significantly here.",
  },
  caltech: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "important", recommendations: "very important", extracurriculars: "important",
    talent_ability: "very important", character: "very important", first_gen: "considered",
    alumni_relation: "not considered", geographic: "not considered", volunteer: "considered",
    work_experience: "considered",
    special_note: "Caltech is one of the few elite schools where raw mathematical and scientific talent can genuinely outweigh extracurricular breadth — a student who has independently solved hard problems in math or physics will be taken very seriously.",
  },
  nyu: {
    rigor: "very important", gpa: "very important", test_scores: "important",
    essays: "very important", recommendations: "very important", extracurriculars: "important",
    talent_ability: "important", character: "important", first_gen: "considered",
    alumni_relation: "not considered", geographic: "not considered", volunteer: "considered",
    work_experience: "considered",
    special_note: "NYU's supplements are school-specific (Stern, Tisch, Gallatin, etc.) — applying without addressing the culture and specific programs of the school within NYU is the most common avoidable mistake.",
  },
  dartmouth: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Dartmouth's D-Plan and emphasis on undergraduate teaching mean students who articulate specific off-campus term plans or research experiences demonstrate exactly the initiative the school rewards.",
  },
  northwestern: {
    rigor: "very important", gpa: "very important", test_scores: "very important",
    essays: "very important", recommendations: "very important", extracurriculars: "very important",
    talent_ability: "very important", character: "very important", first_gen: "important",
    alumni_relation: "considered", geographic: "considered", volunteer: "important",
    work_experience: "considered",
    special_note: "Northwestern's quarter system rewards intellectual range — students who articulate specific connections between their interests and its interdisciplinary programs (e.g., Integrated Science, Segal Design) write the strongest applications.",
  },
};

// Patch existing 13 universities
for (const u of seed) {
  if (C7[u.id]) u.c7_factors = C7[u.id];
}

// Dartmouth full seed entry
seed.push({
  id: "dartmouth",
  name: "Dartmouth College",
  state: "NH",
  city: "Hanover",
  setting: "rural",
  undergrad_enrollment: 4458,
  type: "private",
  major_categories: ["computer-science", "engineering", "economics", "biology", "psychology", "humanities-languages", "political-science", "mathematics"],
  acceptance_rate_overall: 6.2,
  acceptance_rate_intl: null,
  sat25: 1500, sat50: 1545, sat75: 1570,
  act25: 34, act50: 35, act75: 36,
  gpa_distribution: null,
  test_policy: "required",
  ielts_min: 7.0, toefl_min: 100,
  cost_of_attendance_usd: 83000,
  intl_aid_policy: "need-blind-full-need",
  avg_intl_aid_usd: 67000,
  pct_intl_receiving_aid: 85,
  cds_url: "https://home.dartmouth.edu/about/institutional-research/common-data-set",
  admission_source_url: "https://admissions.dartmouth.edu/stats",
  admission_source_year: "2023-24",
  cost_source_url: "https://admissions.dartmouth.edu/costs",
  cost_source_year: "2024-25",
  aid_source_url: "https://financialaid.dartmouth.edu/international-students",
  aid_source_year: "2023-24",
  field_confidence: {
    acceptance_rate_overall: "estimated",
    acceptance_rate_intl: "missing",
    sat25: "estimated", sat50: "estimated", sat75: "estimated",
    avg_intl_aid_usd: "estimated",
    pct_intl_receiving_aid: "estimated",
    gpa_distribution: "missing",
  },
  c7_factors: C7.dartmouth,
});

// Northwestern full seed entry
seed.push({
  id: "northwestern",
  name: "Northwestern University",
  state: "IL",
  city: "Evanston",
  setting: "suburban",
  undergrad_enrollment: 8327,
  type: "private",
  major_categories: ["computer-science", "engineering", "business", "economics", "biology", "psychology", "communications", "political-science", "mathematics", "humanities-languages"],
  acceptance_rate_overall: 7.0,
  acceptance_rate_intl: null,
  sat25: 1500, sat50: 1540, sat75: 1570,
  act25: 34, act50: 35, act75: 36,
  gpa_distribution: null,
  test_policy: "required",
  ielts_min: 7.0, toefl_min: 100,
  cost_of_attendance_usd: 85000,
  intl_aid_policy: "need-aware",
  avg_intl_aid_usd: null,
  pct_intl_receiving_aid: null,
  cds_url: "https://www.northwestern.edu/institutional-research/topics-data/common-data-set/index.html",
  admission_source_url: "https://admissions.northwestern.edu/discover/our-students.html",
  admission_source_year: "2023-24",
  cost_source_url: "https://www.northwestern.edu/admission/cost-and-aid/",
  cost_source_year: "2024-25",
  aid_source_url: "https://undergradaid.northwestern.edu/aid-programs/international-students.html",
  aid_source_year: "2023-24",
  field_confidence: {
    acceptance_rate_overall: "estimated",
    acceptance_rate_intl: "missing",
    sat25: "estimated", sat50: "estimated", sat75: "estimated",
    avg_intl_aid_usd: "missing",
    pct_intl_receiving_aid: "missing",
    gpa_distribution: "missing",
  },
  c7_factors: C7.northwestern,
});

writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
console.log("Total entries:", seed.length);
const ids = ["mit","harvard","stanford","princeton","yale","columbia","upenn","cornell","brown","duke","johns-hopkins","caltech","nyu","dartmouth","northwestern"];
for (const id of ids) {
  const u = seed.find(x => x.id === id);
  console.log(id + ": c7=" + (u?.c7_factors ? "yes" : "MISSING"));
}
