# UniFit Fit Score — v1 Algorithm Specification

**Status:** Draft, pending founder review of weights and thresholds.
**Implements:** the FitResult entity in [DOMAIN.md](DOMAIN.md). All logic specified here lives in `/src/lib/fit-engine` as pure functions with 100% test coverage.

> **Naming note vs DOMAIN.md:** this spec restructures the three sub-scores as **Academic Fit**, **Practical Fit** (absorbing DOMAIN.md's `financialFit` + the major-availability part of `contextFit`), and **Profile Fit** (new — rubric vs. selectivity). DOMAIN.md §1.3 must be amended to match before implementation. The §4.3 hard financial filter is implemented here as Gate F (§2.1).

Every constant in this document is a **named, reviewable decision** — they live in one constants file in the fit engine so a single diff shows any recalibration.

---

## 0. Shared definitions

### 0.1 Band interpolation primitive

Most scoring uses one primitive. Given a value `x` and a band `[p25, p75]` with width `w = p75 − p25` (guard: if `w < 1`, set `w = 1`):

| Region | Formula | Range |
|---|---|---|
| Inside band (`p25 ≤ x ≤ p75`) | `40 + 35 · (x − p25) / w` | 40–75 |
| Above band (`x > p75`) | `min(95, 75 + 20 · (x − p75) / w)` | 75–95 |
| Below band (`x < p25`) | `max(5, 40 − 25 · (p25 − x) / w)` | 5–40 |

Design intent:
- **No cliffs.** Falling below the 25th percentile degrades at a *gentler* slope (25/w vs 35/w inside the band) — being slightly under the band is "below the middle," not "hopeless."
- **Diminishing returns above.** Beating the 75th percentile keeps helping, but at a flatter slope, capped at 95. A 1600 SAT does not make MIT a safety, and the cap encodes that.
- **Never 0, never 100.** Floor 5 / cap 95 enforce the honest-uncertainty principle: we never claim certainty in either direction.

One-sentence explainability: every band score reduces to "you are inside / above / below the middle 50% of enrolled students."

### 0.2 Selectivity tiers

Tier is computed from the **best-available international acceptance rate** `R`:
`R = acceptanceRateInternational` if published, else the adjusted rate from §1.4.

| Tier | Acceptance rate `R` | Label (internal) |
|---|---|---|
| 1 | < 10% | Ultra-selective |
| 2 | 10–25% | Highly selective |
| 3 | 25–50% | Selective |
| 4 | > 50% | Accessible |

(Ordering note: the §1.4 adjustment factor needs a tier before `R` exists — that first tier lookup uses the *overall* rate; the resulting adjusted `R` is then used everywhere else, including category mapping.)

### 0.3 GPA normalization (exact tables)

All GPAs normalize to the 4.0 scale via **piecewise-linear interpolation between anchors**; inputs clamp to the anchor range.

**Uzbek 5-point scale** (anchors; clamp input to [3.0, 5.0]):

| 5.0-scale | 4.0 equivalent |
|---|---|
| 3.0 | 2.3 |
| 3.5 | 2.8 |
| 4.0 | 3.3 |
| 4.5 | 3.7 |
| 5.0 | 4.0 |

Example: 4.6 → between (4.5, 3.7) and (5.0, 4.0) → 3.7 + (0.1/0.5)·0.3 = **3.76**.

**Percentage scale** (anchors; clamp input to [60, 100]):

| Percentage | 4.0 equivalent |
|---|---|
| 60 | 2.3 |
| 70 | 2.8 |
| 80 | 3.3 |
| 88 | 3.7 |
| 95 | 4.0 |
| 100 | 4.0 |

**Limitations (stated, not hidden):** these mappings are conventions, not measurements. Grading severity varies by school and region; a 4.5/5.0 at a strict lyceum may outperform a 4.9 elsewhere. Therefore: every converted GPA carries `estimated` confidence, the UI always shows the original alongside ("your 4.6/5.0 ≈ 3.76/4.0"), and converted GPAs are compared via bands, never points.

---

## 1. Academic Fit (0–100)

### 1.1 Test score component

- `satScore = bandScore(satTotal, sat25, sat75)` using the university's CDS C9 percentiles.
- `actScore = bandScore(actComposite, act25, act75)`.
- If the student has both tests: `testScore = max(satScore, actScore)` (mirrors real submit-the-better-one strategy).
- **Submit-only-if-it-helps rule** (test-optional schools, `testPolicy = "optional"`): use the test branch only if `testScore ≥ 40` (i.e., the score is at or above the school's 25th percentile). Otherwise compute as if no test (§1.3) — and the explanation tells the student this is the recommended real-world strategy too.
- If the university's percentiles are null: testScore cannot be computed → fall back to §1.3 path with `dataConfidence` capped at `low`.

### 1.2 GPA component

Universities rarely publish usable GPA distributions (CDS C11 is spotty), so v1 scores GPA against **tier-anchored expectation bands** (normalized 4.0 scale):

| Tier | gpa25 | gpa75 |
|---|---|---|
| 1 | 3.75 | 3.95 |
| 2 | 3.55 | 3.85 |
| 3 | 3.20 | 3.70 |
| 4 | 2.80 | 3.50 |

`gpaScore = bandScore(gpaNorm, gpa25_tier, gpa75_tier)`

These anchors are constants in the engine, reviewable in one diff. If a university publishes C11, it can override its own anchors (per-school override field, optional in v1).

### 1.3 Weighting: with-test vs. test-optional paths

**Path A — test used** (score exists AND helps per §1.1):

```
academicRaw = 0.6 · testScore + 0.4 · gpaScore
```

Justification: standardized tests are the only internationally comparable academic signal we have; converted GPAs carry conversion noise. So the test leads — but does not monopolize, because C9 percentiles describe *enrolled* students (survivor bias), not admits.

**Path B — no test used** (`testPolicy = "blind"`, no score taken, or score withheld per §1.1):

```
academicRaw = 0.7 · gpaScore + 0.3 · profileRubricScore   // rubric 0–100 used directly
```

GPA weight rises because it is the strongest remaining signal; the profile rubric enters because test-optional admissions genuinely shifts weight onto holistic factors. Mandatory consequences of Path B:
- `dataConfidence` capped at `medium`;
- explanation must include: *"Without test scores, universities put more weight on your essays, recommendations, and activities — which we can't measure. This estimate leans on your GPA and is less precise."*

**English proficiency gate** (applies to both paths): if the university publishes an IELTS/TOEFL minimum and the student's score is below it (or the student has no English test): `academicFit = min(academicRaw, 30)`, with an *actionable* explanation ("their minimum is IELTS {ieltsMin}; retaking the test unlocks this school"), and the school is routed to the **Action needed** list (§4.4) rather than labeled Reach/Target/Safety. If no minimum is published, assume IELTS 6.5 / TOEFL 79, tagged `estimated`.

**Test-required gate:** if `testPolicy = "required"` and the student has no SAT/ACT: `academicFit = min(academicRaw, 25)`, actionable explanation ("this school requires the SAT — taking it unlocks this school"), routed to **Action needed**.

### 1.4 International adjustment (when only overall stats exist)

If `acceptanceRateInternational` is null, two conservative corrections apply:

**(a) Adjusted acceptance rate** (used for tiers and category mapping):

| Tier (from overall rate) | Adjustment factor |
|---|---|
| 1 | × 0.5 |
| 2 | × 0.6 |
| 3 | × 0.7 |
| 4 | × 0.85 |

**(b) Academic-fit penalty:**

| Tier | Penalty on academicFit |
|---|---|
| 1 | −10 |
| 2 | −8 |
| 3 | −5 |
| 4 | −2 |

**Reasoning:** published international acceptance rates, where they exist, run roughly 2–5× below overall rates at selective institutions (larger gaps at more selective schools — international pools are deeper and many schools read internationals need-aware). We deliberately err conservative: an over-optimistic score sends a student's application fee to a school that won't admit them; an over-conservative one costs nothing because categories are floors for strategy, not verdicts. Both corrections force `dataConfidence ≤ medium` and add the caveat sentence: *"This university doesn't publish international-specific stats, so we adjusted conservatively — international acceptance rates are typically lower than overall ones."*

**(c) Need-aware penalty:** if `intlAidPolicy = "need-aware"` AND `aidNeedLevel ≠ "none"`: additional −5 on academicFit, explanation: *"This school considers financial need for international applicants, which makes admission slightly harder when you need aid."* (Affordability itself is Practical Fit's job; this term reflects admission odds only.)

Final: `academicFit = clamp(academicRaw − penalties, 5, 95)`.

---

## 2. Practical Fit (0–100) — with hard gates

Answers: *if admitted, can you actually go, and does it teach what you want?*

### 2.1 The gates (caps, not gradients)

**Gate F — financial impossibility:** `intlAidPolicy = "none"` AND `annualBudgetUsd < costOfAttendanceUsd` → `practicalFit = min(raw, 15)`.

**Gate M — major unavailable:** none of the student's `intendedMajors` offered → `practicalFit = min(raw, 20)`.

**Why gates and not gradients:** a weighted average lets strength in one factor *launder* impossibility in another — a school with perfect major match (100) and zero affordability (0) would average to a respectable-looking 50, which reads as "maybe." But these two situations are not "weak fit," they are arithmetic ("you cannot fund the I-20") and fact ("they don't teach your subject"). A gate makes the impossibility survive aggregation: nothing the student does elsewhere in their profile can push a Gate-F school into "Target." Any school with a fired gate is excluded from the ranked list and shown in a separate, explained section (DOMAIN.md §4.3), with the student able to override Gate F explicitly (external funding exists; their data, their call).

Gate F's cap is 15 rather than 0 because 0 communicates "worthless," which violates never-discourage; 15 communicates "essentially blocked as planned" while leaving the override path visually sensible.

### 2.2 Affordability component (70% of raw)

**Step 1 — realistic net cost:**

| `intlAidPolicy` | `netCost` | Confidence note |
|---|---|---|
| `need-blind-full-need` | `annualBudgetUsd` (full demonstrated need met) | high |
| `need-aware` | `annualBudgetUsd` if `avgIntlAidUsd` ≥ (CoA − budget), else `CoA − avgIntlAidUsd` | medium |
| `merit-only` | `CoA − avgIntlAidUsd`; if `avgIntlAidUsd` null → `CoA` | medium; low if null |
| `none` | `CoA` | high (sadly) |

If `aidNeedLevel = "none"`: `netCost = CoA` regardless of policy (no aid sought).

**Step 2 — affordability ratio** `r = annualBudgetUsd / netCost`, scored by piecewise-linear anchors:

| `r` | Score |
|---|---|
| ≥ 1.0 | 100 |
| 0.8 | 75 |
| 0.6 | 45 |
| 0.4 | 20 |
| < 0.4 | 10 (floor) |

Linear interpolation between anchors. The curve is deliberately convex-down: a 20% funding gap is a solvable problem (small scholarships, family stretch); a 60% gap is not a plan.

**Merit-lottery caveat:** for `merit-only` schools, if `pctIntlReceivingAid < 30%`, the affordability explanation must state the odds: *"About {pctIntlReceivingAid}% of international students here receive merit aid averaging ${avgIntlAidUsd} — possible, but don't build your plan on it."* (Score unchanged; honesty handled by language + confidence.)

### 2.3 Major availability component (30% of raw)

| Situation | Score |
|---|---|
| All intended majors offered | 100 |
| First-choice major offered (others partial) | 90 |
| Some intended major offered, but not first choice | 60 |
| None offered | 0 (and Gate M fires) |

```
practicalRaw = 0.7 · affordability + 0.3 · majorAvailability
practicalFit = apply gates (§2.1) to practicalRaw
```

(v1.1 will add location preference as a third component once StudentProfile collects it — see DOMAIN.md §5.)

---

## 3. Profile Fit (0–100)

Maps the DOMAIN.md §2 rubric score (0–100) against what each selectivity tier *expects*, because the same profile reads differently across tiers: a national-olympiad profile is table stakes at a sub-10% school and a standout at an accessible one.

**Expectation curve per tier:**

| Tier | Expected rubric `E` | Sensitivity `k` |
|---|---|---|
| 1 | 75 | 1.2 |
| 2 | 60 | 1.0 |
| 3 | 45 | 0.8 |
| 4 | 30 | 0.6 |

```
profileFit = clamp(50 + k_tier · (rubricScore − E_tier), 5, 95)
```

Reading: 50 = "your profile is typical for who enrolls here"; above/below scales by tier sensitivity. `k` falls with tier because holistic factors *matter more* where admissions is holistic: at Tier 1 every applicant has the grades, so the profile differentiates (k = 1.2); at Tier 4 admission is largely stats-driven and the profile barely moves outcomes (k = 0.6). A rubric of 90 yields 68 at Tier 1 (good, not decisive — honest) and 86 at Tier 4 (genuinely distinguishing, also honest).

CDS C7 (which factors each school marks "very important") is curated per school and can flag mismatches in explanations (e.g., school marks essays "very important" → explanation reminds the student the rubric can't see essays). C7 does **not** change the score in v1 — see open question in §7.

---

## 4. Overall score, category, list balance

### 4.1 Weighted blend

```
overall = 0.50 · academicFit + 0.30 · practicalFit + 0.20 · profileFit
```

**Justification:**
- **Academic 50% — dominates, as required.** It is built on the hardest data we have (published percentiles) and is the primary admit/deny signal.
- **Practical 30%.** Second because an unaffordable or major-less admission is worthless — but the catastrophic cases are already handled by gates, so the weighted term only needs to rank the *viable* middle.
- **Profile 20% — smallest.** Self-reported, coarse (4 questions), and the least verifiable input we have. Its weight should grow only when we can measure it better (v2).

If any gate fired (F, M, or the academic gates in §1.3), the school skips category mapping entirely and routes to a separate list (§4.4) — a blended number must never paper over a gate.

### 4.2 Category mapping

Let `R` = best-available international acceptance rate (§0.2). Categories derive from `academicFit` (the admission-odds proxy), not `overall` — affordability shouldn't make a school look easier to get into:

| Category | Condition |
|---|---|
| **Safety** | `academicFit ≥ 75` AND `R ≥ 30%` |
| **Target** | not Safety, AND `academicFit ≥ 55` AND `R ≥ 10%` |
| **Reach** | everything else |

### 4.3 The sub-10% override (absolute rule)

**Any school with `R < 10%` is ALWAYS at best a Reach, regardless of scores.** A 1600 SAT, 4.0 GPA, international-olympiad profile at Harvard is still a Reach.

Why this is admissions reality and not pessimism: at sub-10% schools, applicants who "have the numbers" outnumber seats several times over. Admission decisions there turn on factors no statistical model can see — institutional priorities, essays, regional shaping of the class. Published stats can tell you that you *belong in the applicant pool*; they cannot tell you that you'll be picked from it. Any tool that labels a sub-10% school "Target" is selling false precision — the exact failure mode this product exists to correct. The explanation framing stays strategic: *"Your profile is genuinely competitive here — and at a {R}% acceptance rate, that's true of most applicants. Apply, and pair it with Targets."*

(The Safety rule's `R ≥ 30%` bound is the same principle one notch down: under 30%, no one's safety.)

### 4.4 The "Action needed" list

Schools with fired gates (no test where required, English below minimum, Gate F, Gate M) are excluded from Reach/Target/Safety and shown in a separate section ordered by `overall`, each with its actionable explanation. Framing rule: every entry must state *what would unlock it* (take the SAT, retake IELTS, budget change/external funding) — or, for Gate M, suggest looking at the student's other intended majors. Nothing in this section reads as a rejection.

### 4.5 List-balance analysis

Given the student's selected list of N universities with categories assigned:

| Rule (checked in order) | Classification | Advisory sentence template |
|---|---|---|
| N < 3 | `too-small` | "With only {N} schools, one decision decides everything — most successful applicants apply to 6–10. Add more Targets and Safeties." |
| safetyCount = 0 | `no-safety` | "{reachCount} Reach, {targetCount} Target, 0 Safety — every school on this list could say no. Add 1–2 Safeties you'd be happy to attend." |
| targetCount = 0 | `no-target` | "Your list jumps from Reach to Safety with nothing in between. Targets are where most students actually land — add 2–3." |
| reachCount / N > 0.6 | `top-heavy` | "{reachCount} of your {N} schools are Reaches. Dreams belong on the list — but balance them: aim for roughly 2 Reach : 3 Target : 2 Safety." |
| otherwise | `balanced` | "{reachCount} Reach, {targetCount} Target, {safetyCount} Safety — this is a balanced list. Strong strategy." |

Exactly one classification (the first matching rule) and one sentence are returned. Tone rule for all templates: name the risk, immediately give the move.

---

## 5. Explanation templates

Placeholders in `{braces}`. Every sentence must pass the 17-year-old test; every sentence pairs honesty with a next move. Ranges shown, never single-point percentages (DOMAIN.md honest-uncertainty rule). Selection: low = sub-score < 40, mid = 40–70, high = > 70.

### Academic Fit

| Case | Template |
|---|---|
| high | "Your {testName} {testValue} is above the middle range of students here ({band25}–{band75}) — academically, you'd fit right in." |
| mid | "Your {testName} {testValue} lands inside this school's middle range ({band25}–{band75}) — right where most admitted students are." |
| low | "Your current {testName} {testValue} is below this school's typical range ({band25}–{band75}) — raising it to {band25}+ would change this picture." |
| no-test (Path B) | "Without test scores, universities put more weight on your essays, recommendations, and activities — which we can't measure. This estimate leans on your GPA of {gpaOriginal} and is less precise." |
| intl-adjusted | "This school doesn't publish international-specific stats, so we adjusted conservatively — international acceptance rates are typically lower than overall ones." |

### Practical Fit

| Case | Template |
|---|---|
| high | "With your budget of ${budget} and this school's {aidPolicyPlain}, the costs work — money shouldn't be the obstacle here." |
| mid | "Your budget covers about {coveragePct} of the realistic cost (~${netCost}/yr) — doable with merit aid averaging ${avgAid}, but have a funding plan." |
| low | "The realistic cost here (~${netCost}/yr) is well above your ${budget} budget, and aid for international students is limited — your application money likely works harder elsewhere." |
| Gate F | "{universityName} doesn't offer financial aid to international students, and its ${coa}/yr cost is above your budget — unless outside funding appears, this one's blocked. The schools below give you a real path." |
| Gate M | "{universityName} doesn't offer {firstMajor} — a great school for someone else's plan, not yours." |

### Profile Fit

| Case | Template |
|---|---|
| high | "Your {strongestRubricArea} stands out at a school this {selectivityWord} — activities like yours are a real differentiator here." |
| mid | "Your profile is typical of students admitted here — solid, with room to stand out more through your essays." |
| low | "Students here usually show {tierExpectationPlain} — you have time to build toward that, and your essays can carry more weight meanwhile." |

### Overall (one per category)

| Case | Template |
|---|---|
| Safety | "Strong fit and strong odds — a school you can count on while you aim higher." |
| Target | "A genuine match — schools like this are where most students on lists like yours end up enrolling." |
| Reach | "This is a Reach — your profile belongs in the pool, and at a {R} acceptance rate that's true for most applicants. Apply, and pair it with Targets." |

---

## 6. Data confidence derivation

Start at `high`; apply the **worst** cap triggered by any field that actually drove the score:

| Condition | Cap |
|---|---|
| `acceptanceRateInternational` null (→ §1.4 adjustment used) | medium |
| GPA converted from non-4.0 scale | medium |
| Path B (no test used) | medium |
| `costOfAttendanceUsd` assembled from components (`estimated`) | medium |
| `dataYear` older than two admission cycles | medium |
| C9 percentiles null while student has a test score | low |
| `avgIntlAidUsd` null at a `merit-only` school | low |
| `gpaDistribution` AND C9 both null (academic fit rests on tier anchors alone) | low |

`dataConfidence = worst cap triggered` (or `high` if none). The UI must always render it, with plain-language meaning: high = "based on this school's own published international data"; medium = "based on published data with some conservative assumptions"; low = "this school publishes little — treat this as a rough sketch."

A field that didn't drive the score doesn't cap it (e.g., missing aid data at a school where the student needs no aid is irrelevant).

---

## 7. Known limitations of v1 (these define the v2 roadmap)

1. **No essay or recommendation evaluation.** At holistic schools these can decide outcomes; we say so in explanations rather than pretending the rubric covers them. *(v2: optional essay-readiness checklist — still never auto-scoring prose.)*
2. **No major-specific acceptance rates.** CS at UIUC is dramatically harder than the university average; v1 sees only university-level rates. *(v2: per-college/major data for the worst offenders, hand-curated.)*
3. **Profile strength is self-reported and coarse.** Four questions, honor system. *(v2: structured activity list with verification prompts.)*
4. **Enrolled ≠ admitted bias.** CDS C9 describes who enrolled; admitted students skew slightly higher, and enrolled *internationals* skew higher still. Our band math is therefore mildly optimistic at the margins; the §1.4 penalties partially offset this, imprecisely.
5. **GPA conversion is a convention.** §0.3 tables are defensible, not true; school-level grading severity is invisible to us.
6. **Single-cycle data.** Acceptance rates and test bands move year to year; we carry one `dataYear` per school and flag staleness, but can't model trends.
7. **No Early Decision / Early Action modeling.** ED acceptance rates run far higher; round strategy is real strategy we don't yet capture. *(Strong v1.1 candidate — it's data we already half-have in CDS.)*
8. **No external-scholarship modeling.** Uzbek students may hold El-Yurt Umidi or similar funding that changes Gate F math; v1 handles this only via the manual Gate-F override.
9. **The constants are priors, not fits.** Band anchors, weights, penalties, and tier curves are reasoned estimates — we have no outcome data yet. *(v2: collect anonymized application outcomes from consenting users and recalibrate; every constant lives in one file for exactly this reason.)*
10. **Sub-10% schools are genuinely unpredictable** — the §4.3 override is the honest response, not a workaround.
