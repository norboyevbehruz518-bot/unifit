# BACKLOG

Candidate fixes and features not scheduled for the current phase. Items here
are tracked informally; promote to an ADR + implementation when picked up.

---

## v1.1 candidates

### Path B ceiling for test-blind schools (FIT_ALGORITHM.md §7.11)

- **Finding:** At test-blind schools, Path B (`0.7·gpa + 0.3·rubric`, §1.3) has
  a structurally lower ceiling than Path A (`0.6·test + 0.4·gpa`) would for the
  same student, because `rubricTotal` is capped well below the 95 a strong test
  score would contribute under Path A.
- **Evidence:** `scripts/calibrate.ts` — ASU (test-blind, 90% overall
  acceptance) scores strong-test students up to ~6 points lower on academic fit
  than University of Alabama (test-optional, 80% acceptance), for students with
  near-identical GPA scores (both Tier 4 post-ADR-0004). Both land in Safety in
  the current run, but the gap could flip a borderline Target/Safety case.
- **Likely lever:** revise §1.3 Path B weighting or ceiling specifically for
  test-blind schools — e.g. a higher GPA weight, an "excellent rubric" bonus, or
  a different rubric-to-100 scaling. Needs calibration against more profiles
  before changing constants again.
- **Status:** documented as a known v1 limitation, not fixed. Discovered during
  the ADR-0004 calibration pass (2026-06-13).

### Early Decision / Early Action modeling (FIT_ALGORITHM.md §7.7)

- ED acceptance rates run far higher than RD; round strategy is real strategy.
  CDS data we already half-have could support this.

---

## v2 roadmap

See FIT_ALGORITHM.md §7 for the full list of v1 limitations that define the v2
roadmap (essay/recommendation evaluation, major-specific acceptance rates,
structured activity verification, multi-cycle trend data, external-scholarship
modeling, outcome-based recalibration of constants).
