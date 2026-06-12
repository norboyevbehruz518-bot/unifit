# ADR-0001: Tech stack — Next.js + Supabase + Vercel

- **Date:** 2026-06-12
- **Status:** Accepted

## Context

UniFit is built by a solo, non-professional founder with AI assistance. The MVP is one feature (the Fit Score) for an initial market in Uzbekistan. The stack must minimize operational burden, cost nothing at small scale, and be well-documented enough that AI coding assistance is consistently reliable.

## Decision

Use **Next.js 14+ (App Router) with TypeScript and Tailwind** for the app, **Supabase** (Postgres + Auth + Row Level Security) for the backend, and **Vercel** for hosting.

## Why

- **Speed for a solo founder.** One framework covers frontend and backend (API routes / server actions); Supabase replaces building auth, a database layer, and access control from scratch. No servers to manage.
- **Free tiers.** Vercel and Supabase both have generous free tiers — the MVP can launch and run with real users at $0/month.
- **Huge documentation and community.** Next.js, Supabase, Tailwind, and Postgres are among the most-documented tools in web development, which makes AI assistance markedly more reliable — fewer hallucinated APIs, more correct first attempts, abundant examples for any error message.
- **Easy migration path later.** Supabase is plain Postgres underneath (standard SQL, exportable anytime), and Next.js is portable off Vercel (self-host, other clouds). Nothing locks us in.

## Alternatives considered

- **Plain React (Vite) + separate Node/Express backend** — two codebases to wire together, auth and deployment built by hand; too much surface area for a solo founder.
- **Django or Rails full-stack** — mature, but smaller overlap with the modern hosted-platform ecosystem (Vercel previews, Supabase) and a second language to maintain alongside the TypeScript frontend.
- **Firebase instead of Supabase** — NoSQL data model fits the relational shape of universities/profiles/scores poorly, and migration away from Firestore is much harder than from Postgres.

## What would make us reconsider

- **Heavy ML for fit scoring.** If the Fit Score evolves beyond explainable pure-function logic into trained models, we add a small Python service (FastAPI) alongside — not a rewrite, just a new component the Next.js app calls.
- **Free-tier limits hit.** Sustained usage beyond Vercel/Supabase free tiers means paying or self-hosting Supabase; Postgres portability keeps that option open.
- **Vercel pricing or platform changes.** Next.js can be self-hosted or moved to another host with modest effort.

## Consequences

- Fastest possible path to a working MVP with auth, database, and previews on every branch.
- We accept some coupling to Supabase client libraries (mitigated by keeping fit-engine logic pure and database access behind a thin layer).
- All business logic stays in TypeScript for now; a second language enters only if ML demands it.
