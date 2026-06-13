# ADR-0003: bandScore width guard fix — GPA bands are narrow, on purpose

- **Date:** 2026-06-13
- **Status:** Accepted
- **Full specification:** [docs/FIT_ALGORITHM.md](../FIT_ALGORITHM.md) §0.1

## Context

The `bandScore(x, p25, p75)` primitive (§0.1) interpolates a score across a
`[p25, p75]` band of width `w = p75 - p25`. The original spec and
implementation guarded against a zero-width band by writing:

> with a band `[p25, p75]` with width `w = p75 − p25` (guard: if `w < 1`, set `w = 1`)

This guard was written with SAT/ACT-scale bands in mind, where a width under 1
point is a degenerate edge case (e.g. `p25 === p75 === 1400`) that should not
be divided by.

## Why it broke GPA scoring

The same primitive is reused for GPA-scale bands (`GPA_TIER_BANDS`, §1.2),
whose widths are all **less than 1 by design** — tier 1: 0.2, tier 2: 0.3,
tier 3: 0.5, tier 4: 0.7. The `w < 1 → w = 1` guard fired on every single one
of these real, intentional bands, silently widening them to 1.

Concretely, for a tier-2 student with `gpaScore = bandScore(3.7, 3.55, 3.85)`:
the spec-correct band width is `0.3`, giving a midpoint score of `57.5`. With
the old guard, `w = Math.max(1, 0.3) = 1`, giving `45.25` instead — a
~12-point understatement of academic fit that propagated into `academicFit`
and `overall` for every student scored against a GPA band. This was caught by
`academic.test.ts`, where 15 tests failed by amounts that were exact
multiples of the same `12.25`-point `gpaScore` discrepancy.

## Decision

Replace the width guard so it only fires on a **truly degenerate** band
(`p75 <= p25`), and otherwise uses the real width — however small:

```ts
const w = p75 > p25 ? p75 - p25 : BAND.minWidth;
```

`docs/FIT_ALGORITHM.md` §0.1 is updated to match: "guard: if `w ≤ 0` — a
degenerate band where `p75 <= p25` — set `w = 1`".

## Alternatives considered

- **Leave the guard as `w < 1` and give GPA bands their own primitive** — adds
  a second code path for what is conceptually the same interpolation; rejected
  as unnecessary duplication.
- **Special-case GPA scoring with a different minimum width** — same problem
  as above, plus another constant to calibrate.

## Consequences

- This is exactly the "constants are priors, recalibrated" situation
  ADR-0002 (Decision 4) anticipated: the guard was a reasonable prior for one
  scale, wrong for another, and the fix is a single reviewable change to
  `normalize.ts` and §0.1.
- Any future band-based scoring (any scale) must have `p75 > p25` to produce
  a real interpolation; a band with `p75 <= p25` is treated as a single point
  one unit wide, same as before.
- Test coverage added in `normalize.test.ts` for both the degenerate/inverted
  case (`w` falls back to 1) and a small-but-real GPA-scale band (`w = 0.3`,
  not widened).
