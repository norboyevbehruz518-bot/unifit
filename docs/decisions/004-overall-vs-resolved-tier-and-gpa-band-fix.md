# ADR-0004: split selectivity tiers (overall vs. resolved) and lower the Tier-4 GPA band

- **Date:** 2026-06-13
- **Status:** Accepted
- **Full specification:** [docs/FIT_ALGORITHM.md](../FIT_ALGORITHM.md) §0.2, §1.2, §1.4

## Context

`scripts/calibrate.ts` (synthetic students against MIT/Stanford/NYU/Penn
State/ASU/Alabama) surfaced two calibration problems:

1. **NYU tier-crossing.** NYU's `acceptanceRateOverall` (~12.8%) falls in
   tier 2, but §1.4's international adjustment (factor 0.6) produced an
   adjusted rate whose tier is 1. The single `RateResolution.tier` from
   `resolveAcceptance()` was used for *everything downstream* — GPA/SAT band
   anchors (§1.2), the profile expectation curve (§3), category mapping
   (§4.2-4.3), and the §1.4(b) academic-fit penalty. Using the
   intl-adjusted tier to pick GPA/SAT anchors double-counts the
   international difficulty: published percentiles already describe who
   actually enrolls.

2. **Tier-4 GPA band too harsh.** `GPA_TIER_BANDS[4]` was `{ p25: 2.80, p75:
   3.50 }`. For ASU (~90% overall acceptance, test-blind), this put a
   3.46/4.0-equivalent, zero-extracurricular student's `gpaScore` near the
   middle of the band (~49 academicFit), which categorized as **Reach** —
   backwards for a school most counselors would call a Safety for that
   profile.

## Decision

**1. Split `RateResolution` into two tiers.**

- `overallTier` — tier of the unadjusted `acceptanceRateOverall`. Drives the
  §1.2 GPA/SAT band anchors and the §3 profile expectation curve. Both
  describe *who enrolls*, which published percentiles already capture.
- `tier` (resolved) — tier of `R` (published `acceptanceRateIntl` if
  available, else the §1.4-adjusted rate, itself keyed off `overallTier`).
  Drives category mapping (§4.2-4.3) and the §1.4(b) academic-fit penalty —
  both specifically about *international* admission odds, which is exactly
  what the §1.4 adjustment estimates.

The §1.4 adjustment factor (`INTL_RATE_FACTOR`) and the §1.4(b) penalty
(`INTL_ACADEMIC_PENALTY`) are unchanged in value; only which tier feeds which
downstream calculation changed.

**2. Lower `GPA_TIER_BANDS[4]` from `{2.80, 3.50}` to `{2.30, 3.00}`.**

A 3.46/4.0-equivalent applicant now scores near the band's 95 cap
(`bandScore` above `p75`) instead of mid-band, moving `academicFit` from
~49 to ~61 for that profile at ASU — Target instead of Reach. True Safety for
a zero-extracurricular Path-B profile remains structurally out of reach even
at `gpaScore = 95` under the 0.7/0.3 GPA/rubric weighting (§1.3) — that is a
separate, intentional limit, not addressed here.

## Alternatives considered

- **Keep one tier, only fix the GPA band.** Doesn't address the NYU
  double-counting; a tier-crossing school would still get the wrong GPA
  anchors.
- **Apply the §1.4 adjustment to GPA/SAT anchors too, but with a smaller
  factor.** Adds a second calibration constant for the same phenomenon;
  rejected as unnecessary — the published percentiles are already the
  ground truth for who enrolls.
- **Raise Tier-4's `p75` instead of lowering both anchors.** Considered, but
  the 25th-percentile end was the one producing the unrealistic "average
  ASU applicant is below the 25th percentile" result; both anchors needed to
  move down to keep the band's shape meaningful for an open-access school.

## Consequences

- `types.ts`'s `RateResolution` now carries both `tier` and `overallTier`;
  any new downstream consumer must pick the correct one per the table in
  §0.2.
- `academic.ts` (GPA band lookup), `index.ts` (§3 profile-fit tier), and
  `normalize.ts` (`resolveAcceptance`) all updated; `weights.ts`
  `GPA_TIER_BANDS[4]` updated.
- New tests in `academic.test.ts`: a NYU-style tier-crossing case (GPA band
  uses `overallTier` even when `tier` differs) and an ASU-style Tier-4 case
  (revised band moves a previously-Reach average profile to Target).
- `scripts/calibrate.ts` re-run: Student 4 ("Average student") at ASU moved
  from sub-Target academic score to Target overall (A=61.2, Overall=48.7).
  NYU's category outcomes were unaffected in this run (still Reach/GATED
  across all six students) but are now derived correctly rather than by
  coincidence.
- Issue #3 from the calibration review (ASU-vs-Alabama test-blind
  inconsistency) remains open and is not addressed by this ADR.
