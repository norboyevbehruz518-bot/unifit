/**
 * Explanation templates — FIT_ALGORITHM.md §5.
 * Every sentence must pass the 17-year-old test and pair honesty with a
 * next move. Banding: low = score < 40, mid = 40–70, high = > 70
 * (EXPLANATION_BANDS).
 */

import type { ProfileRubric, StudentProfile, University, FitCategory } from "@/types/domain";
import type { AcademicResult, PracticalResult, ProfileResult, RateResolution } from "./types";
import { EXPLANATION_BANDS } from "./weights";
import { round1 } from "./normalize";

/** §5 Academic Fit. */
export function explainAcademic(academic: AcademicResult, rate: RateResolution): string {
  const blockingGate = academic.gates.find(
    (g) => g.gate === "test-required" || g.gate === "english-below-minimum",
  );
  if (blockingGate) return blockingGate.explanation;

  let base: string;
  if (academic.path === "B" || academic.testUsed === null) {
    base = `Without test scores, universities put more weight on your essays, recommendations, and activities — which we can't measure. This estimate leans on your GPA of ${academic.gpa.original} and is less precise.`;
  } else {
    const { name, value, p25, p75 } = academic.testUsed;
    if (academic.score > EXPLANATION_BANDS.midUpTo) {
      base = `Your ${name} ${value} is above the middle range of students here (${p25}–${p75}) — academically, you'd fit right in.`;
    } else if (academic.score >= EXPLANATION_BANDS.lowBelow) {
      base = `Your ${name} ${value} lands inside this school's middle range (${p25}–${p75}) — right where most admitted students are.`;
    } else {
      base = `Your current ${name} ${value} is below this school's typical range (${p25}–${p75}) — raising it to ${p25}+ would change this picture.`;
    }
  }

  if (!rate.intlPublished) {
    base += " This school doesn't publish international-specific stats, so we adjusted conservatively — international acceptance rates are typically lower than overall ones.";
  }
  return base;
}

/** Plain-language label for §5's "{aidPolicyPlain}" placeholder. */
function aidPolicyPlain(university: University): string {
  switch (university.intlAidPolicy) {
    case "need-blind-full-need":
      return "need-blind, full-need financial aid";
    case "need-aware":
      return "need-aware financial aid";
    case "merit-only":
      return "merit-based aid";
    case "none":
      return "lack of financial aid for international students";
  }
}

/** §5 Practical Fit. */
export function explainPractical(profile: StudentProfile, university: University, practical: PracticalResult): string {
  const gateF = practical.gates.find((g) => g.gate === "financial");
  if (gateF) return gateF.explanation;

  const gateM = practical.gates.find((g) => g.gate === "major-unavailable");
  if (gateM) return gateM.explanation;

  let base: string;
  if (practical.affordabilityScore > EXPLANATION_BANDS.midUpTo) {
    base = `With your budget of $${profile.annualBudgetUsd} and this school's ${aidPolicyPlain(university)}, the costs work — money shouldn't be the obstacle here.`;
  } else if (practical.affordabilityScore >= EXPLANATION_BANDS.lowBelow) {
    const coveragePct = Math.round((profile.annualBudgetUsd / practical.netCost) * 100);
    const avgAid = university.avgIntlAidUsd != null ? `$${university.avgIntlAidUsd}` : "merit aid";
    base = `Your budget covers about ${coveragePct}% of the realistic cost (~$${Math.round(practical.netCost)}/yr) — doable with ${avgAid !== "merit aid" ? `merit aid averaging ${avgAid}` : avgAid}, but have a funding plan.`;
  } else {
    base = `The realistic cost here (~$${Math.round(practical.netCost)}/yr) is well above your $${profile.annualBudgetUsd} budget, and aid for international students is limited — your application money likely works harder elsewhere.`;
  }

  if (practical.meritLottery) {
    const avgAidPart =
      practical.meritLottery.avgAid != null ? ` averaging $${practical.meritLottery.avgAid}` : "";
    base += ` About ${practical.meritLottery.pctReceiving}% of international students here receive merit aid${avgAidPart} — possible, but don't build your plan on it.`;
  }

  return base;
}

/** Plain labels for §5's "{strongestRubricArea}" placeholder. */
const RUBRIC_AREA_LABELS: Record<keyof ProfileRubric, string> = {
  leadership: "leadership experience",
  awards: "awards and competitions",
  commitment: "long-term commitment",
  focus: "focused activities",
};

/** Each rubric area's max stored level (DOMAIN.md §2), used to compare areas on a common scale. */
const RUBRIC_AREA_MAX: Record<keyof ProfileRubric, number> = {
  leadership: 3,
  awards: 4,
  commitment: 3,
  focus: 3,
};

function strongestRubricArea(rubric: ProfileRubric): keyof ProfileRubric {
  const areas = Object.keys(RUBRIC_AREA_LABELS) as (keyof ProfileRubric)[];
  return areas.reduce((best, area) =>
    rubric[area] / RUBRIC_AREA_MAX[area] > rubric[best] / RUBRIC_AREA_MAX[best] ? area : best,
  );
}

/** §5 Profile Fit. */
export function explainProfile(rubric: ProfileRubric, profile: ProfileResult): string {
  if (profile.score > EXPLANATION_BANDS.midUpTo) {
    const area = RUBRIC_AREA_LABELS[strongestRubricArea(rubric)];
    const selectivityWord = profile.tier <= 2 ? "selective" : "accessible";
    return `Your ${area} stands out at a school this ${selectivityWord} — activities like yours are a real differentiator here.`;
  }
  if (profile.score >= EXPLANATION_BANDS.lowBelow) {
    return "Your profile is typical of students admitted here — solid, with room to stand out more through your essays.";
  }
  return "Students here usually show stronger leadership, awards, or longer-term commitment — you have time to build toward that, and your essays can carry more weight meanwhile.";
}

/** §5 Overall, one per category. Reach also covers the unsorted/gated case. */
export function explainOverall(category: FitCategory | null, rate: RateResolution): string {
  switch (category) {
    case "safety":
      return "Strong fit and strong odds — a school you can count on while you aim higher.";
    case "target":
      return "A genuine match — schools like this are where most students on lists like yours end up enrolling.";
    case "reach":
    case null:
      return `This is a Reach — your profile belongs in the pool, and at a ${round1(rate.r)}% acceptance rate that's true for most applicants. Apply, and pair it with Targets.`;
  }
}
