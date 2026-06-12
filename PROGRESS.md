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
