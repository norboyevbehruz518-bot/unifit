# UniFit Domain Model

This document is the intellectual foundation of the product. Every entity, score, and rule in the codebase must trace back to a definition here. When code and this document disagree, this document wins — fix the code or amend the document via an ADR.

Guiding constraints (from AGENTS.md): one feature (the Fit Score), every number explainable in one sentence, never discourage, never fake precision.

> **Amendments:**
>
> - 2026-06-12 — §1.3 sub-scores restructured to `academicFit` / `practicalFit` / `profileFit` with hard gates and "Action needed" routing, matching [FIT_ALGORITHM.md](FIT_ALGORITHM.md) (see ADR-0002).

---

## 1. Core entities

### 1.1 StudentProfile

What we know about the student. Everything is self-reported in v1; the model must stay honest about that.

#### Academics

| Field          | Type                                | Required      | Notes                                                                                                                                                                        |
| -------------- | ----------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gpaValue`     | number                              | yes           | The grade as the student knows it, in their own system.                                                                                                                      |
| `gpaScale`     | `"4.0" \| "5.0-uz" \| "percentage"` | yes           | We convert internally (see §4.2) but always store the original. Never overwrite what the student entered.                                                                    |
| `satTotal`     | number 400–1600                     | no            | Optional — many applicants are test-optional (see §4.1).                                                                                                                     |
| `actComposite` | number 1–36                         | no            | If both SAT and ACT exist, use whichever ranks higher against the university's percentiles.                                                                                  |
| `englishTest`  | `"ielts" \| "toefl" \| "none"`      | yes           |                                                                                                                                                                              |
| `englishScore` | number                              | if test taken | IELTS 0–9 or TOEFL 0–120. English proficiency is closer to a gate than a ranking factor: below a university's minimum it blocks admission; above it, more doesn't help much. |

#### Intended majors

| Field            | Type                         | Required | Notes                                                                                                                                                                                                                                                |
| ---------------- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intendedMajors` | 1–3 CIP-style category codes | yes      | One to three, ordered by preference. We match at the broad-category level (e.g. "Computer Science", "Business"), not the individual program level — v1 data cannot support program-level matching, and pretending otherwise would be fake precision. |

#### Financial context

| Field             | Type                            | Required | Notes                                                                                                                                             |
| ----------------- | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `annualBudgetUsd` | number                          | yes      | What the family can realistically pay per year, in USD. The single most decision-relevant number for an international applicant.                  |
| `aidNeedLevel`    | `"none" \| "partial" \| "full"` | yes      | `none` = family can pay full cost; `partial` = needs some aid; `full` = needs most or all costs covered. Drives the hard financial filter (§4.3). |

#### Profile strength

| Field             | Type                 | Required | Notes                                                                                                                                                                                                 |
| ----------------- | -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profileStrength` | object → 0–100 score | yes      | Structured rubric, NOT a single self-rating. Full specification in §2. We store the four raw answers, not just the derived score, so the rubric can be recalibrated later without re-asking students. |

#### Citizenship

| Field             | Type             | Required | Notes                                              |
| ----------------- | ---------------- | -------- | -------------------------------------------------- |
| `citizenship`     | ISO country code | yes      |                                                    |
| `isInternational` | derived boolean  | —        | Anyone who is not a US citizen/permanent resident. |

**Why citizenship matters enough to model explicitly:** US universities admit international and domestic applicants from effectively separate pools. International acceptance rates are routinely 2–5× lower than the published overall rate, international applicants are often evaluated need-aware even at colleges that are need-blind domestically, and federal aid (FAFSA, Pell) is unavailable to them entirely. A fit score computed against domestic stats would be systematically, dangerously optimistic for our users. Every comparison in the fit engine must use international-specific data when we have it, and must _say so_ when we don't (see §3.2).

---

### 1.2 University

One row per institution. Every stats field carries its own provenance and confidence (§3.2).

#### Identity & character

| Field                    | Type                                                     | Notes                                            |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| `id`                     | slug                                                     | Stable identifier, e.g. `purdue-west-lafayette`. |
| `name`                   | string                                                   |                                                  |
| `state`, `city`          | string                                                   |                                                  |
| `setting`                | `"urban" \| "suburban" \| "rural"`                       |                                                  |
| `undergradEnrollment`    | number                                                   |                                                  |
| `sizeCategory`           | derived: `"small"` <5k, `"medium"` 5–15k, `"large"` >15k |                                                  |
| `type`                   | `"public" \| "private"`                                  | Affects sticker price and aid behavior.          |
| `majorCategoriesOffered` | category codes                                           | Same vocabulary as `intendedMajors`.             |

#### Admission statistics — international where available

| Field                         | Type                                  | Notes                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `acceptanceRateOverall`       | percentage                            | From CDS section C1.                                                                                                                                                                     |
| `acceptanceRateInternational` | percentage \| null                    | Published by some universities (CDS or international-admissions pages). Often null — see §3.2 for how we degrade honestly.                                                               |
| `sat25`, `sat50`, `sat75`     | numbers \| null                       | SAT total percentiles of _enrolled_ students, CDS C9. Note the bias: these describe who enrolled, not who was admitted, and enrolled internationals often sit above the 50th percentile. |
| `act25`, `act50`, `act75`     | numbers \| null                       |                                                                                                                                                                                          |
| `gpaDistribution`             | banded percentages \| null            | CDS C11 when published; many omit it. Falls back to null, never to an invented value.                                                                                                    |
| `testPolicy`                  | `"required" \| "optional" \| "blind"` | See §4.1.                                                                                                                                                                                |
| `ieltsMin`, `toeflMin`        | numbers \| null                       | From international-admissions pages.                                                                                                                                                     |

#### Cost & financial aid

| Field                 | Type                                                               | Notes                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `costOfAttendanceUsd` | number                                                             | Full annual sticker price for an international student: tuition + fees + room/board + estimated books/personal. This is the number on the I-20 financial certification, so it is the honest baseline — not discounted tuition alone. |
| `intlAidPolicy`       | `"need-blind-full-need" \| "need-aware" \| "merit-only" \| "none"` | **The most consequential single field in the dataset.** See §4.3 for why `"none"` is a hard filter, not a score penalty.                                                                                                             |
| `avgIntlAidUsd`       | number \| null                                                     | Average award to undergraduate nonresident aliens, CDS H6.                                                                                                                                                                           |
| `pctIntlReceivingAid` | percentage \| null                                                 | Also H6. Together these tell a student whether aid is realistic or a lottery.                                                                                                                                                        |

#### Provenance

| Field             | Type                     | Notes                                                                                                                          |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `cdsUrl`          | URL                      | Link to the university's published Common Data Set. Every stat must be checkable by the student — transparency is the product. |
| `dataYear`        | string, e.g. `"2024-25"` | Stats older than two cycles get a confidence downgrade.                                                                        |
| `fieldConfidence` | per-field map, see §3.2  |                                                                                                                                |

---

### 1.3 FitResult

The output of the fit engine for one (StudentProfile, University) pair. This is the product.

| Field            | Type                                     | Notes                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `academicFit`    | 0–100                                    | How the student's academic record compares to enrolled internationals at this university (test + GPA band comparison, with conservative international adjustments and English/test gates — FIT_ALGORITHM.md §1).                                                                                                                                                         |
| `practicalFit`   | 0–100                                    | "If admitted, can you actually go, and does it teach what you want?" Affordability (70%) + major availability (30%), with hard gates: Gate F (no intl aid AND cost > budget → cap 15), Gate M (no intended major offered → cap 20) — FIT_ALGORITHM.md §2. Size/setting and location alignment remain v1.1 candidates (§5).                                               |
| `profileFit`     | 0–100                                    | The §2 rubric score mapped against the university's selectivity-tier expectation curve — the same profile reads differently at a 5% school vs a 70% school (FIT_ALGORITHM.md §3).                                                                                                                                                                                        |
| `overall`        | 0–100                                    | Weighted blend: 0.50 academic + 0.30 practical + 0.20 profile (FIT_ALGORITHM.md §4.1). Gates are caps applied _before_ blending — a blended number must never paper over a gate.                                                                                                                                                                                         |
| `category`       | `"safety" \| "target" \| "reach"`        | Strategy framing, never a verdict. A reach is "pair it with targets," not "you can't." Derived from `academicFit` + acceptance rate, with the sub-10% absolute-Reach override (FIT_ALGORITHM.md §4.2–4.3). We deliberately have no category below reach.                                                                                                                 |
| `gatesFired`     | list of `{ gate, explanation }`          | Non-empty means this university skips category mapping and routes to the **"Action needed"** list (FIT_ALGORITHM.md §4.4) — shown separately, ordered by `overall`, each entry stating _what would unlock it_ (take the SAT, retake IELTS, budget change). Gate F is student-overridable (external funding; their data, their call). This implements §4.3's hard filter. |
| `explanations`   | one sentence per sub-score + one overall | Each must pass the 17-year-old test, e.g. "Your SAT 1380 is above the middle of admitted international students here (1300–1450)." Generated from the same inputs as the numbers — an explanation that doesn't match its number is a bug. Templates in FIT_ALGORITHM.md §5.                                                                                              |
| `dataConfidence` | `"high" \| "medium" \| "low"`            | Worst-of relevant field confidences (§3.2; derivation table in FIT_ALGORITHM.md §6). Shown in the UI, always.                                                                                                                                                                                                                                                            |

**Honest-uncertainty rule:** sub-scores are internal. The UI presents bands and ranges ("strong match", "55–70"), never "73.4%". The fit engine must expose range forms of its outputs so the UI never has to invent them.

---

## 2. Profile strength v1 — the structured rubric

**Why not a 1–5 self-rating:** self-ratings collapse two unknowns into one noisy number — what the student did, and how they judge themselves. Modest students underrate, confident students overrate, and nobody can explain what a "4" means. Instead we ask four factual questions, each scored 0–25, summed to 0–100. Factual questions are answerable, auditable, and explainable.

We store the four raw answers, not just the total, so weights can be recalibrated later without re-surveying students.

### Q1 — Leadership (0–25)

_"What is the highest level of responsibility you've held in any activity (club, team, project, job, volunteering)?"_

| Answer                                                                         | Points |
| ------------------------------------------------------------------------------ | ------ |
| No organized activities yet                                                    | 0      |
| Active member / participant                                                    | 8      |
| Officer, captain, team lead, or organizer of a one-off event                   | 17     |
| Founder, president, or led something with real responsibility for other people | 25     |

### Q2 — Awards & recognition (0–25)

_"What is the highest level at which you've won or placed in a competition, olympiad, or award?"_

| Answer                                            | Points |
| ------------------------------------------------- | ------ |
| None yet                                          | 0      |
| School level                                      | 6      |
| Regional / city / national-qualifier level        | 12     |
| National level (e.g. republic olympiad placement) | 19     |
| International level                               | 25     |

### Q3 — Sustained commitment (0–25)

_"How long have you continuously pursued your single longest-running activity outside of class?"_

| Answer           | Points |
| ---------------- | ------ |
| Less than 1 year | 0      |
| 1–2 years        | 8      |
| 2–3 years        | 17     |
| 3+ years         | 25     |

Admissions readers weight persistence heavily; a 4-year commitment to one thing signals more than six 3-month dabbles.

### Q4 — Focus: spike vs. well-rounded (0–25)

_"How do your activities relate to what you want to study?"_

| Answer                                                                        | Points |
| ----------------------------------------------------------------------------- | ------ |
| My activities are few and not related to my intended major                    | 5      |
| I do several different things, none deeply connected to my major              | 12     |
| I'm active in several areas AND at least one connects to my major             | 18     |
| Most of my time goes deep into one area directly tied to my major (a "spike") | 25     |

Selective US admissions currently reward a legible spike over generic well-roundedness, especially for internationals who must stand out in a crowded pool. The floor is 5, not 0 — having activities at all counts for something, and a 0 here would feel like punishment for honesty (violates "never discourage").

### Honesty notes on this rubric

- It is **self-reported and coarse**. It feeds `profileFit` and the test-optional academic path (FIT_ALGORITHM.md §1.3 Path B), and must never outweigh hard academic data in `academicFit`.
- It deliberately ignores essays, recommendations, and interviews — we cannot measure them, so we say so in the UI rather than pretending the score covers everything.
- Score bands for explanation: 0–35 "developing", 36–65 "solid", 66–100 "distinctive". Language chosen to describe a trajectory, not a rank.

---

## 3. Data sourcing strategy

### 3.1 v1 — manually curated seed dataset (60 universities)

Hand-built from each university's **Common Data Set (CDS)** — a standardized disclosure most US universities publish annually. Manual curation of 60 schools is roughly a week of careful work and gives us data we fully understand, with a provenance link per school. That beats scraping 2,000 schools badly.

Selection of the 60: span the full selectivity range (acceptance rates ~4% to ~90%), bias toward schools with meaningful international aid or low cost (what our users actually need), include known popular choices among Uzbek applicants so first searches don't come up empty.

**Exact CDS sections we extract:**

| Section | Contents                                                                                    | Feeds                                                                                          |
| ------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **C1**  | First-year applications, admits, enrollment (totals + by gender)                            | `acceptanceRateOverall`                                                                        |
| **C7**  | Relative importance of academic/non-academic factors (rigor, GPA, tests, essays, talent...) | Whether tests/GPA even matter at this school; sanity check on our sub-score weights per school |
| **C9**  | SAT/ACT score percentiles (25th/50th/75th) of enrolled first-years; share submitting scores | `sat25/50/75`, `act25/50/75`, test-submission base rates                                       |
| **H6**  | Aid to undergraduate **nonresident aliens**: number aided, average award                    | `intlAidPolicy` evidence, `avgIntlAidUsd`, `pctIntlReceivingAid`                               |

Supplemented (and recorded as separate sources): international-admissions pages for `acceptanceRateInternational`, IELTS/TOEFL minimums, and stated aid policy; the university's cost-of-attendance page for the I-20 budget figure.

### 3.2 Per-field confidence — the honesty mechanism

Not all 60 universities publish all fields. **We never fill gaps with invented numbers.** Each stats field carries one of:

| Level              | Meaning                                                    | UI obligation                                                                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `verified-intl`    | International-specific figure from a primary source        | Show plainly.                                                                                                                                                                                                      |
| `verified-overall` | Overall figure from CDS; no international breakdown exists | Show with the caveat: _"Based on overall stats — international acceptance rates are typically lower."_ The academic-fit comparison widens its uncertainty band and the result's `dataConfidence` caps at `medium`. |
| `estimated`        | Derived (e.g. cost summed from components)                 | Label as estimate; cap at `medium`.                                                                                                                                                                                |
| `missing`          | Not published                                              | Sub-score that depends on it goes to a wide band with `dataConfidence: low`, with an explanation — never a silently confident number.                                                                              |

A FitResult's `dataConfidence` is the **worst** confidence among the fields that actually drove its sub-scores. One weak input makes the whole result honest about being weak.

### 3.3 v2 path — College Scorecard API

The US Department of Education's **College Scorecard** API is free and covers every accredited institution: cost of attendance, net price, completion rates, post-graduation earnings. v2 uses it to (a) extend coverage beyond the curated 60 and (b) add outcome data (earnings, graduation rates) to context fit.

Known limitation to design around now: Scorecard's admission stats and net-price figures are **domestic-centric** (net price reflects federal-aid recipients, who are by definition not international). So Scorecard feeds cost/outcome fields, while international admission stats remain CDS/manual — the per-field confidence system (§3.2) already accommodates mixed sources, which is exactly why it exists.

---

## 4. Critical edge cases — modeled now, not patched later

### 4.1 Test-optional applicants (no SAT/ACT)

The most common case for our market, not an edge case in frequency.

- If `testPolicy = "required"` and the student has no score: hard filter — listed separately as "requires SAT/ACT, which you haven't taken yet," framed as actionable (take the test) rather than as rejection.
- If `"optional"`: academic fit computes from GPA + English proficiency + profile strength; the uncertainty band widens and `dataConfidence` caps at `medium`, because we're comparing against percentile data (C9) built from score-submitters. Explanation says so: _"Without test scores, this estimate relies on your GPA and is less precise."_
- If `"blind"`: scores ignored even if present, and we tell the student that ("this university doesn't look at test scores at all").
- A student **with** scores at an optional school: include scores only if they help (at or above the school's 25th percentile) — mirroring the real submit/withhold strategy, and we surface that advice as part of the explanation.

### 4.2 GPA scale conversion

Students enter their GPA in their own system; we convert internally and always keep the original.

| Uzbek 5-point | Percentage | 4.0 equivalent |
| ------------- | ---------- | -------------- |
| 5.0           | 95–100     | 4.0            |
| 4.5–4.9       | 88–94      | 3.7            |
| 4.0–4.4       | 80–87      | 3.3            |
| 3.5–3.9       | 70–79      | 2.8            |
| 3.0–3.4       | 60–69      | 2.3            |

Honesty constraints:

- Conversion is **inherently lossy and non-linear** — grading severity varies across schools and the mapping above is a convention, not a fact. Every converted GPA is tagged `estimated` confidence (§3.2), and comparisons using it use bands, not points.
- We never display the converted number as if the student earned it; the UI shows "your 4.6/5.0 (≈3.7 on the US 4.0 scale)".
- The conversion table lives in the fit engine as data (a constant), not buried in logic — it will be revised, and revisions must be visible in one diff.

### 4.3 Universities with no financial aid for internationals — the hard filter

If `intlAidPolicy = "none"` and `costOfAttendanceUsd > annualBudgetUsd`, the university is **excluded from the ranked list**, not scored low.

Why a hard filter and not a penalty: this is not a "fit" question — it is arithmetic. An international student cannot enroll without proving full funding on the I-20 financial certification; an admission the family cannot fund is not an option, it's a trap that costs application fees and heartbreak. Blending it into a weighted score would let a stellar academic fit drag an unaffordable school into "Target," which is exactly the misleading optimism this product exists to kill.

Never-discourage framing: excluded schools appear in a separate, clearly explained section — _"These don't offer aid to international students and cost more than your budget — your money is better spent on the applications below"_ — with the door left open: if the budget changes or the family has external funding, the student can override the filter per school (their data, their call; the override is explicit and logged in the result).

Adjacent cases handled by the same mechanism: `merit-only` schools where typical merit awards (`avgIntlAidUsd`) still leave a gap above budget get a **low financial fit with explanation**, not exclusion — merit is uncertain, not impossible, and the distinction between "arithmetic says no" and "unlikely but real" is precisely the honesty this product promises.

---

## 5. Open questions (to resolve via ADRs before the fit engine is built)

1. ~~Exact sub-score weights for `overall`~~ — resolved: FIT_ALGORITHM.md §4.1 / ADR-0002. Still open: whether weights should shift when `dataConfidence` is low.
2. ~~Category thresholds~~ — resolved: FIT_ALGORITHM.md §4.2–4.3 / ADR-0002.
3. ~~The major-category vocabulary~~ — resolved (Phase 4): a fixed 17-category simplified list (computer-science, engineering, business, economics, mathematics, biology, chemistry, physics, psychology, political-science, international-relations, communications, design-art, architecture, education, health-sciences, humanities-languages), defined in `data/major-categories.json`. Both `intendedMajors` and `majorCategoriesOffered` must draw from this list — enforced for seed data by `data/__tests__/seed.test.ts`.
4. How profile strength interacts with academic fit at holistic vs. stats-driven schools (CDS C7 tells us which is which).
5. **v1.1 candidate:** add size/setting alignment to `contextFit` — requires first adding size/setting preference questions to StudentProfile (we keep `setting`/`sizeCategory` in University data so this needs no re-curation).
