/**
 * Practical Fit — FIT_ALGORITHM.md §2.
 * Affordability (70%) + major availability (30%), with hard gates (§2.1)
 * that survive aggregation — a perfect major match cannot launder an
 * unfundable cost, and vice versa.
 */

import type { StudentProfile, University } from "@/types/domain";
import type { MajorMatch, PracticalResult } from "./types";
import {
  AFFORDABILITY_ANCHORS,
  AFFORDABILITY_FLOOR,
  MAJOR_SCORES,
  MERIT_LOTTERY_THRESHOLD,
  PRACTICAL_GATES,
  PRACTICAL_WEIGHTS,
} from "./weights";
import { piecewiseLinear } from "./normalize";

/** §2.2 step 1 — realistic net cost given the school's aid policy. */
function calculateNetCost(profile: StudentProfile, university: University): number {
  if (profile.aidNeedLevel === "none") return university.costOfAttendanceUsd;

  switch (university.intlAidPolicy) {
    case "need-blind-full-need":
      return profile.annualBudgetUsd;
    case "need-aware": {
      const gap = university.costOfAttendanceUsd - profile.annualBudgetUsd;
      const avgAid = university.avgIntlAidUsd ?? 0;
      return avgAid >= gap ? profile.annualBudgetUsd : university.costOfAttendanceUsd - avgAid;
    }
    case "merit-only":
      return university.avgIntlAidUsd != null
        ? university.costOfAttendanceUsd - university.avgIntlAidUsd
        : university.costOfAttendanceUsd;
    case "none":
      return university.costOfAttendanceUsd;
  }
}

/** §2.2 step 2 — r = budget / netCost, scored via piecewise-linear anchors with a 10-pt floor below r = 0.4. */
function calculateAffordabilityScore(ratio: number): number {
  if (ratio < AFFORDABILITY_ANCHORS[0]![0]) return AFFORDABILITY_FLOOR;
  return piecewiseLinear(ratio, AFFORDABILITY_ANCHORS);
}

/** §2.3 — major availability score from the student's ordered intended majors. */
function calculateMajorMatch(profile: StudentProfile, university: University): { match: MajorMatch; score: number } {
  const offered = university.majorCategoriesOffered;
  const matched = profile.intendedMajors.filter((major) => offered.includes(major));

  if (matched.length === 0) return { match: "none", score: MAJOR_SCORES.none };
  if (matched.length === profile.intendedMajors.length) return { match: "all", score: MAJOR_SCORES.all };
  if (profile.intendedMajors[0] != null && offered.includes(profile.intendedMajors[0])) {
    return { match: "first-choice", score: MAJOR_SCORES.firstChoice };
  }
  return { match: "partial", score: MAJOR_SCORES.partial };
}

export function calculatePracticalFit(profile: StudentProfile, university: University): PracticalResult {
  const netCost = calculateNetCost(profile, university);
  const ratio = profile.annualBudgetUsd / netCost;
  const affordabilityScore = calculateAffordabilityScore(ratio);
  const { match: majorMatch, score: majorScore } = calculateMajorMatch(profile, university);

  const raw = PRACTICAL_WEIGHTS.affordability * affordabilityScore + PRACTICAL_WEIGHTS.major * majorScore;

  const gates: PracticalResult["gates"] = [];
  let score = raw;

  // Gate F — financial impossibility: no intl aid AND budget below cost.
  if (university.intlAidPolicy === "none" && profile.annualBudgetUsd < university.costOfAttendanceUsd) {
    score = Math.min(score, PRACTICAL_GATES.financialCap);
    const gap = university.costOfAttendanceUsd - profile.annualBudgetUsd;
    gates.push({
      gate: "financial",
      explanation: `${university.name} offers no financial aid to international students — at $${university.costOfAttendanceUsd}/yr, that's $${gap} above your $${profile.annualBudgetUsd} budget. Without outside funding, your application energy works harder elsewhere.`,
    });
  }

  // Gate M — major unavailable.
  if (majorMatch === "none") {
    score = Math.min(score, PRACTICAL_GATES.majorCap);
    const firstMajor = profile.intendedMajors[0] ?? "your intended major";
    gates.push({
      gate: "major-unavailable",
      explanation: `${university.name} doesn't offer ${firstMajor} — a great school for someone else's plan, not yours.`,
    });
  }

  // §2.2 merit-lottery caveat: merit-only school where few internationals receive aid.
  const meritLottery =
    university.intlAidPolicy === "merit-only" &&
    university.pctIntlReceivingAid != null &&
    university.pctIntlReceivingAid < MERIT_LOTTERY_THRESHOLD
      ? { pctReceiving: university.pctIntlReceivingAid, avgAid: university.avgIntlAidUsd }
      : null;

  // §6 — merit-only school, student needs aid, but avgIntlAidUsd is unpublished.
  const meritAidUnknown =
    university.intlAidPolicy === "merit-only" &&
    university.avgIntlAidUsd == null &&
    profile.aidNeedLevel !== "none";

  return {
    score,
    gates,
    netCost,
    ratio,
    affordabilityScore,
    majorMatch,
    majorScore,
    meritLottery,
    meritAidUnknown,
  };
}
