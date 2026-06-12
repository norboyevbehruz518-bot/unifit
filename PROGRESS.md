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
