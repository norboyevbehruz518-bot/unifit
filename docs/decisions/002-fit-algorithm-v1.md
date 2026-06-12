# ADR-0002: Fit algorithm v1 — key judgment calls

- **Date:** 2026-06-12
- **Status:** Accepted
- **Full specification:** [docs/FIT_ALGORITHM.md](../FIT_ALGORITHM.md)

## Context

The v1 Fit Score required several decisions that are matters of judgment, not derivation — we have no outcome data yet. This ADR records the four most consequential calls so future-us (with calibration data) knows what was chosen deliberately versus incidentally.

## Decision 1 — Path B profile double-counting is intentional

On the test-optional path (no usable test score), the profile rubric enters `academicFit` at 30% weight — _and_ it already drives `profileFit` (20% of overall). That is double-counting: the rubric's total influence on `overall` rises from 20% to ~35% (0.3 × 0.5 + 0.2).

**Why intentional:** test-optional admissions genuinely re-weights holistic factors — when a student submits no score, real admissions readers lean harder on activities, essays, and context. Our rubric is the only holistic signal we have, so its weight rising in exactly this case mirrors reality rather than distorting it. The risk (a noisy self-reported input gaining influence) is bounded: Path B mandatorily caps `dataConfidence` at `medium` and adds an explanation that essays/recommendations — which we cannot see — carry more weight.

## Decision 2 — International adjustment factors (conservative by design)

When a university publishes no international-specific acceptance rate: overall rate × 0.5 / 0.6 / 0.7 / 0.85 by selectivity tier, plus an academicFit penalty of −10 / −8 / −5 / −2.

**Why these numbers:** published international rates, where they exist, run roughly 2–5× below overall rates, with the gap widest at selective schools (deeper international pools; need-aware reading). The factors sit at the _gentle_ end of that observed range — but the asymmetry of errors drives the direction: an over-optimistic score costs a student an application fee and a crushed plan; an over-conservative one costs nothing, because categories are strategy floors, not verdicts. Both corrections force `dataConfidence ≤ medium` and surface a caveat sentence.

## Decision 3 — Sub-10% schools are ALWAYS at best Reach

No combination of scores can make a school with an international acceptance rate under 10% a Target or Safety; the parallel rule bars Safeties under 30%.

**Why absolute:** at sub-10% schools, applicants with the numbers outnumber seats several times over; decisions turn on institutional priorities our model cannot see. Stats can establish that a student belongs in the pool, never that they'll be picked from it. Calling Harvard a "Target" for anyone is false precision — the exact failure mode UniFit exists to correct.

## Decision 4 — All constants are priors pending calibration

Band anchors, blend weights (50/30/20), adjustment factors, tier curves, affordability anchors: reasoned estimates, not fitted parameters (FIT_ALGORITHM.md §7.9).

**Operational consequence:** every constant lives in a single constants file in `/src/lib/fit-engine`, so any recalibration is one reviewable diff. v2 plans to collect anonymized application outcomes from consenting users and replace priors with fits.

## Consequences

- DOMAIN.md §1.3 amended to the academicFit / practicalFit / profileFit structure with gates and "Action needed" routing — the two documents must never disagree.
- The engine must be built so weights/thresholds are data, not logic — calibration must never require touching scoring code.
- We accept that v1 is conservative on schools with poor data; honesty about that lives in `dataConfidence` and the explanation templates.
