# UniFit

![CI](https://github.com/norboyevbehruz518-bot/unifit/actions/workflows/ci.yml/badge.svg)

UniFit answers one question for international students (initial market: Uzbekistan):

> "Which US universities actually fit ME?"

Students see prestigious names (Harvard, MIT, Stanford) but can't judge their real
chances or fit. UniFit gives them a transparent, explainable **Fit Score** for each
university and helps them build a balanced application list — a healthy mix of
Reach, Target, and Safety schools, never just a wall of dream schools.

Core principles:

- **One feature, done well**: the Fit Score. No feature creep.
- **Radical clarity**: every score is explainable in one sentence.
- **Never discourage**: results are framed as strategy, not rejection.
- **Honest uncertainty**: ranges and confidence levels instead of fake precision.

See [AGENTS.md](./AGENTS.md) for product principles and engineering rules, and
[PROGRESS.md](./PROGRESS.md) for a running log of completed work.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript (strict mode)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — Postgres, Auth, Row Level Security
- [Vitest](https://vitest.dev/) for unit tests

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your Supabase project's
   values:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
     Supabase project's API settings.
   - `SUPABASE_SERVICE_ROLE_KEY` — used by local scripts only (e.g. seeding).
     Never exposed to the browser.
   - `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` — used by the Supabase
     CLI to apply migrations (`supabase db push`).

   `.env.local` is gitignored and must never be committed.

3. **Apply database migrations**

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | Description                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server (Turbopack).                  |
| `npm run build`     | Production build.                                          |
| `npm run start`     | Run the production build.                                  |
| `npm run test`      | Run the Vitest unit test suite.                            |
| `npm run lint`      | Run ESLint.                                                |
| `npm run typecheck` | Run the TypeScript compiler in `--noEmit` mode.            |
| `npm run format`    | Format the codebase with Prettier.                         |

Additional one-off scripts under [`scripts/`](./scripts):

- `npx tsx scripts/seed.ts` — idempotent upsert of `data/universities.seed.json`
  into the `universities` table.
- `npx tsx scripts/calibrate.ts` — sanity-checks the fit algorithm against a
  fixed set of synthetic student profiles.
- `npx tsx scripts/generate-review-list.ts` — regenerates `data/REVIEW_LIST.md`,
  a human-reviewable summary of the seed dataset.

## CI

Every push and pull request runs typecheck, lint, the unit test suite, and a
production build via [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
