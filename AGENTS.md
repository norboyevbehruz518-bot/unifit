# AGENTS.md — UniFit

## Project

UniFit is a web platform that answers **one question** for international students (initial market: Uzbekistan):

> "Which US universities actually fit ME?"

Students see prestigious names (Harvard, MIT, Stanford) and cannot judge their real chances or fit. UniFit gives them a transparent, explainable **Fit Score** and a balanced application list.

## Product principles (these override everything)

1. **ONE feature done excellently: the Fit Score.** No feature creep. If asked for something outside MVP scope, remind the user of this principle.
2. **Radical clarity over sophistication.** Every score must be explainable to a 17-year-old in one sentence.
3. **Never discourage.** Language and colors must frame results as strategy ("this is a Reach — pair it with Targets"), never as rejection.
4. **Honest uncertainty.** Show ranges and confidence; never fake precision like "73.4% admission chance".

## Tech stack

- **Next.js 14+** (App Router), **TypeScript** strict mode, **Tailwind CSS**
- **Supabase**: Postgres + Auth + Row Level Security
- **Vitest** for unit tests, **Playwright** for E2E (added in Phase 6)
- Deployed on **Vercel**; preview deployments for every branch

## Engineering rules

- **Plan mode first** for every non-trivial task: propose plan → wait for explicit approval → implement.
- The user is **not a professional developer**: before implementing, explain key decisions in plain language.
- TypeScript strict; **no `any` types** without a written justification comment.
- Every business-logic module gets **unit tests in the same PR**.
- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`); commit after every working increment.
- All fit-algorithm logic lives in **`/src/lib/fit-engine`** — pure functions, zero UI or database imports, **100% test coverage required**.
- Database changes **only via migration files**, never manual edits.
- Secrets only in `.env.local` (gitignored); keep `.env.example` updated with placeholder keys.

## Working agreements

- Maintain **PROGRESS.md**: after completing each task, append date, what was done, what's next.
- Maintain **docs/decisions/**: one short ADR file per major decision (why Supabase, why this algorithm shape, etc.). Use `docs/decisions/0000-template.md`.
