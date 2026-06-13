# PROGRESS

Log of completed work. Append a new entry after each completed task.

Format:

## YYYY-MM-DD — Task title

- **Done:** what was accomplished
- **Next:** what comes next

---

## 2026-06-12 — Project discipline setup

- **Done:** Created AGENTS.md (principles, stack, engineering rules), PROGRESS.md, ADR template in docs/decisions/, .env.example.
- **Next:** Define Fit Score algorithm shape (ADR) and scaffold Next.js project.

## 2026-06-12 — Domain model, fit algorithm spec, database schema

- **Done:** DOMAIN.md (entities, rubric, data sourcing, edge cases); FIT_ALGORITHM.md v1 spec (band scoring, gates, categories, explanations, confidence) + ADR-0002; initial Supabase migration `20260612000000_initial_schema.sql` (profiles, universities, saved_lists, list_items, fit_snapshots — all with RLS). Migration written but NOT applied; no Supabase project exists yet.
- **Next:** Scaffold Next.js project, then implement /src/lib/fit-engine from FIT_ALGORITHM.md, tests first.

## 2026-06-12 — Project skeleton

- **Done:** Next.js 16 (App Router) scaffold, TypeScript strict + noUncheckedIndexedAccess, Tailwind v4; folder structure (`components/ui`, `components/features`, `lib/fit-engine`, `lib/supabase`, `types`); domain types from DOMAIN.md in `src/types/domain.ts`; Vitest with passing smoke test; Supabase browser/server clients + session middleware (@supabase/ssr); ESLint + Prettier; scripts dev/build/test/lint/typecheck/format — all green.
- **Next:** USER creates Supabase project + `.env.local`, then `supabase login/link/db push` to apply the initial migration. After that: implement fit-engine, tests first.

## 2026-06-12 — Supabase project linked, migration applied

- **Done:** Hosted Supabase project created (ref `zhvytavtdsgpligjmmsv`), CLI authed via access token, `db push` applied `20260612000000_initial_schema.sql`. Verified via REST API: all 5 tables exist, anon can read universities, anon INSERT rejected (RLS working). `.env.local` holds all secrets (incl. CLI token + db password); `.env.example` stays placeholders-only.
- **Next:** Implement /src/lib/fit-engine from FIT_ALGORITHM.md, tests first.

## 2026-06-12 — Skeleton verification (all green)

- **Done:** Full verification pass: dev server HTTP 200 serving UniFit page; production build clean; 1/1 tests pass; lint clean; typecheck clean. Secrets audit: `.env.example` placeholders-only, `.env.local` gitignored (rule confirmed via `git check-ignore`), `git grep` finds no tokens/keys/passwords in any tracked file, working tree clean.
- **Next:** Implement /src/lib/fit-engine from FIT_ALGORITHM.md, tests first. Phase 1 (foundation) is complete.

## 2026-06-12 — Design system foundation

- **Done:** Design tokens in globals.css (Tailwind v4 @theme): ink accent (indigo), warm stone neutrals, category colors reach=amber/target=green/safety=blue (never red), 7-step type scale, radii, single card shadow, light-only v1. Seven UI primitives in components/ui (Button, Input, Select, Card, ProgressBar, Badge, ScoreBar) — typed props, forwardRef, label association via useId, aria-describedby/invalid, shared ink focus ring; ScoreBar supports range display ("65–78") for honest uncertainty. Living style guide at /dev/design-system. Verified: screenshots of rendered page, focus-visible rule in compiled CSS, lint/typecheck/test/build all green.
- **Next:** Fit engine implementation (tests first), then profile form + results UI using these primitives.

## 2026-06-13 — Phase 2 complete: design system approved

- **Done:** Founder reviewed the live style guide and approved tokens (ink accent, reach/target/safety palette, type scale) and all seven primitives. Final check suite green: 1/1 tests, lint clean, typecheck clean, production build clean (3 routes).
- **Next:** Phase 3 — fit engine in /src/lib/fit-engine from FIT_ALGORITHM.md, tests first, 100% coverage. Then profile form + results UI.

## 2026-06-13 — Fit engine implementation (all modules, no tests yet)

- **Done:** Implemented every fit-engine module from FIT_ALGORITHM.md: `academic.ts` (§1, Path A/B, English/test-required gates, intl + need-aware penalties), `practical.ts` (§2, net cost, affordability, major match, Gate F/M, merit-lottery caveat), `profile.ts` (§3, rubric total + expectation curve), `overall.ts` (§4, blend, category mapping incl. sub-10% override, list balance), `explanations.ts` (§5, all templates), `confidence.ts` (§6), and `index.ts` (orchestrating `calculateFitResult`). Each committed separately; typecheck and lint both clean.
- **Next:** Write unit tests for all fit-engine modules (100% coverage required per AGENTS.md) before moving on to profile form + results UI.

## 2026-06-13 — Fit engine test suite + bandScore guard fix (ADR-0003)

- **Done:** Wrote a comprehensive test suite against FIT_ALGORITHM.md (not the implementation): `fixtures.ts` plus `normalize.test.ts`, `academic.test.ts`, `practical.test.ts`, `profile.test.ts`, `overall.test.ts`, `confidence.test.ts`, `explanations.test.ts`, and a seeded property-based suite `property.test.ts` (300 generated cases). 528/530 passed on first run; 2 failures traced to a single spec/implementation bug: `bandScore`'s width guard (`w < 1 → w = 1`) silently widened every GPA-scale band (all <1 wide by design), understating academic fit by ~12 points. Fixed `bandScore` to only guard a truly degenerate band (`p75 <= p25`), updated FIT_ALGORITHM.md §0.1 to match, documented as ADR-0003 (constants-are-priors recalibration per ADR-0002 Decision 4). Removed the obsolete `smoke.test.ts`. Full suite now 530/530, typecheck and lint clean.
- **Next:** Profile form + results UI using the fit engine and design system primitives.

## 2026-06-13 — Fit engine coverage report (99.24% stmts, 97.66% branches)

- **Done:** Installed `@vitest/coverage-v8`, added `coverage` config to `vitest.config.ts` (v8 provider, scoped to `src/lib/fit-engine`). First run found 4 gaps: (1) `index.ts` §6 staleness check (`isDataStale`) never exercised with `currentYear` — added `index.test.ts` (stale/not-stale/malformed-year cases); (2) `practical.ts` Gate M placeholder for an empty `intendedMajors` array — added a case to `practical.test.ts`; (3) `normalize.ts` `piecewiseLinear`'s post-loop `return last[1]` — unreachable given the pre-loop range guards, documented inline; (4) `profile.ts` `RUBRIC_POINTS[...] ?? 0` fallbacks — unreachable for valid `RubricXLevel` values (TS-escape guard only), documented inline. Suite now 535/535, typecheck and lint clean.
- **Next:** Profile form + results UI using the fit engine and design system primitives.

## 2026-06-13 — Calibration sanity-check + two calibration fixes (ADR-0004)

- **Done:** `scripts/calibrate.ts` ran 6 synthetic students against MIT/Stanford/NYU/Penn State/ASU/Alabama and surfaced 3 issues. Fixed 2: (1) split `RateResolution` into `overallTier` (drives §1.2 GPA/SAT bands and §3 profile curve — published percentiles already describe who enrolls) and `tier` (resolved/intl-adjusted — drives §4.2-4.3 category mapping and the §1.4(b) penalty only), fixing NYU's tier-crossing double-count; (2) lowered `GPA_TIER_BANDS[4]` from `{2.80, 3.50}` to `{2.30, 3.00}` so a ~3.46/4.0-equivalent applicant at a ~90%-acceptance test-blind school (ASU) scores Target instead of Reach. Updated `types.ts`, `normalize.ts`, `academic.ts`, `index.ts`, `weights.ts`, FIT_ALGORITHM.md §0.2/§1.2/§1.4, documented as ADR-0004. Added NYU-tier-crossing and ASU-Tier-4 tests to `academic.test.ts`. Suite now 537/537, typecheck and lint clean.
- **Next:** Issue #3 (ASU-vs-Alabama test-blind inconsistency) remains open. Then profile form + results UI using the fit engine and design system primitives.

## 2026-06-13 — Issue #3 documented as known v1 limitation; Phase 3 complete

- **Done:** Re-ran `scripts/calibrate.ts` after ADR-0004 — Issue #3 (test-blind ASU scores strong-test students up to ~6pt lower than test-optional Alabama despite a higher acceptance rate, both Tier 4) persists, narrowed but not fixed by the GPA band change. Documented as FIT_ALGORITHM.md §7.11 (Path B's ceiling is structurally below Path A's even for excellent students at test-blind schools) and added a corresponding v1.1 candidate to new `BACKLOG.md` (likely lever: §1.3 Path B weighting/ceiling for test-blind schools). Phase 3 (3.1 fit-engine implementation, 3.2 test suite at 99.24%/100% funcs coverage, 3.3 calibration sanity-check + ADR-0003/ADR-0004 fixes) is now fully complete.
- **Next:** Profile form + results UI using the fit engine and design system primitives (Phase 4).

## 2026-06-13 — Phase 4: 60-university seed dataset + schema/validation

- **Done:** Resolved DOMAIN.md §5 item 3 (major-category vocabulary) with a fixed 17-category list in `data/major-categories.json`. Created `data/university.schema.json` (JSON Schema draft-07, mirrors `public.universities` columns incl. provenance fields not yet on the camelCase `University` type — `admission_source_url`, `cost_source_url/year`, `aid_source_url/year`, `gpa_distribution`). Authored `data/universities.seed.json`: 60 US universities spanning acceptance rates from ~3% (Caltech) to ~95% (Webster), each with per-field `field_confidence` (`verified-overall | estimated | missing`) — no invented precise numbers; uncertain fields (most `acceptance_rate_intl`, `avg_intl_aid_usd`, `pct_intl_receiving_aid`, and SAT/ACT for test-blind schools) marked `estimated`/`missing`. Includes large state schools and need-blind/need-aware-for-intl schools popular with Uzbek applicants (ASU, Alabama, Indiana, Ohio State, Utah, etc.). Added `data/__tests__/seed.test.ts` (362 cases via `ajv`/`ajv-formats`: schema conformance, unique ids, major-category vocabulary, SAT/ACT/acceptance-rate cross-field sanity, exactly 60 records) and wired `data/**/*.test.{ts,tsx}` into `vitest.config.ts`. Added idempotent `scripts/seed.ts` (Supabase upsert by `id`, **not yet run against the live project**) and `scripts/generate-review-list.ts` → `data/REVIEW_LIST.md` (all 60 sorted by acceptance rate, plus a "Verify these first" section for the 10 schools with the most volatile/recently-changed test policies and acceptance rates). Fixed a pre-existing typecheck break in `explanations.test.ts`/`overall.test.ts` (missing `overallTier` on `RateResolution` fixtures from ADR-0004, unrelated to this phase). Full suite now 899/899, typecheck and lint clean.
- **Next:** Founder reviews `data/REVIEW_LIST.md` against current Common Data Sets (especially the flagged 10), then run `npx tsx scripts/seed.ts` to populate the live Supabase project. Separately: mapping DB rows (snake_case + provenance) to the camelCase `University` type is a deferred data-access-layer task before the fit engine can consume real seed data. After seeding: profile form + results UI.

## 2026-06-13 — Authentication + onboarding flow

- **Done:** Email auth via Supabase: password sign-in/sign-up and magic-link sign-in, with Google OAuth implemented but hidden behind `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` (`src/lib/auth/feature-flags.ts`) until the provider is configured in the dashboard. New `(auth)` route group (`/login`, `/signup`) using the design system; `src/lib/auth/messages.ts` maps Supabase auth error codes to human-language copy (8 unit tests). Added `/auth/confirm` (magic-link + signup-confirmation OTP verification) and `/auth/callback` (OAuth code exchange, inert until the flag flips) route handlers. Extended `src/lib/supabase/middleware.ts` + new `src/middleware.ts` to redirect unauthenticated visitors away from `/app/*` to `/login`, and authenticated visitors away from `/login`/`/signup` to `/app/profile`. New `/app` layout with sign-out button and an empty-state `/app/profile` page (the full profile-creation form is a separate future task). Verified live against the hosted Supabase project: unauthenticated `/app/profile` redirects to `/login`, login/signup pages render correctly, magic-link/password toggle works, and a real signup attempt correctly surfaced a humanized rate-limit message (confirming the Supabase round trip and error-mapping both work — "Confirm email" is ON, so the happy path is the "check your email" state, not an immediate session). Suite now 907/907, typecheck and lint clean.
- **Next:** Multi-field profile creation form (DOMAIN.md §1.1 StudentProfile) + results UI, replacing the empty-state `/app/profile` placeholder.
