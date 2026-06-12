-- ============================================================================
-- UniFit initial schema
-- Implements DOMAIN.md entities: StudentProfile, University, saved lists,
-- and FitResult snapshots. See docs/DOMAIN.md and docs/FIT_ALGORITHM.md.
--
-- RLS philosophy:
--   * profiles / saved_lists / list_items / fit_snapshots: owner-only.
--   * universities: readable by everyone (including anonymous visitors —
--     students browse before signing up); NO write policies exist at all,
--     so writes are only possible with the service_role key (which bypasses
--     RLS). That key is used exclusively by seed scripts / admin tooling
--     and never ships to the browser.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users (StudentProfile, DOMAIN.md §1.1)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Academics. GPA is stored exactly as the student entered it, with its
  -- scale; normalization to 4.0 happens in the fit engine (FIT_ALGORITHM §0.3)
  -- and the original is never overwritten.
  gpa_value numeric not null check (gpa_value > 0),
  gpa_scale text not null check (gpa_scale in ('4.0', '5.0-uz', 'percentage')),
  sat_total integer check (sat_total between 400 and 1600),
  act_composite integer check (act_composite between 1 and 36),
  english_test text not null check (english_test in ('ielts', 'toefl', 'none')),
  -- IELTS 0–9 or TOEFL 0–120; which range applies depends on english_test,
  -- so the broad bound lives here and the exact validation in the app layer.
  english_score numeric check (english_score between 0 and 120),
  -- Score present if and only if a test was taken.
  constraint english_score_matches_test check (
    (english_test = 'none' and english_score is null)
    or (english_test <> 'none' and english_score is not null)
  ),

  -- 1–3 major-category codes, ordered by preference (first = first choice).
  intended_majors text[] not null
    check (array_length(intended_majors, 1) between 1 and 3),

  -- Financial context (drives Gate F, FIT_ALGORITHM §2.1).
  annual_budget_usd integer not null check (annual_budget_usd >= 0),
  aid_need_level text not null check (aid_need_level in ('none', 'partial', 'full')),

  -- Profile-strength rubric (DOMAIN.md §2): we store the ANSWER LEVEL the
  -- student chose, not the points it maps to, so point weights can be
  -- recalibrated in the fit engine without re-asking anyone.
  rubric_leadership smallint not null check (rubric_leadership between 0 and 3),
  rubric_awards smallint not null check (rubric_awards between 0 and 4),
  rubric_commitment smallint not null check (rubric_commitment between 0 and 3),
  rubric_focus smallint not null check (rubric_focus between 0 and 3),

  -- ISO 3166-1 alpha-2. International vs domestic changes everything
  -- (DOMAIN.md §1.1); isInternational is derived in the app layer.
  citizenship char(2) not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No DELETE policy: profile rows die by cascade when the auth user is deleted.

-- ----------------------------------------------------------------------------
-- universities — curated seed dataset (University, DOMAIN.md §1.2)
-- ----------------------------------------------------------------------------
create table public.universities (
  -- Stable human-readable slug, e.g. 'purdue-west-lafayette'.
  id text primary key,

  -- Identity & character
  name text not null,
  state text not null,
  city text not null,
  setting text not null check (setting in ('urban', 'suburban', 'rural')),
  undergrad_enrollment integer not null check (undergrad_enrollment > 0),
  type text not null check (type in ('public', 'private')),
  major_categories text[] not null,

  -- Admission statistics. NULL means "not published" — we never invent
  -- values (DOMAIN.md §3.2); the fit engine degrades with wide bands and
  -- lowered confidence instead.
  acceptance_rate_overall numeric not null check (acceptance_rate_overall between 0 and 100),
  acceptance_rate_intl numeric check (acceptance_rate_intl between 0 and 100),
  sat25 integer check (sat25 between 400 and 1600),
  sat50 integer check (sat50 between 400 and 1600),
  sat75 integer check (sat75 between 400 and 1600),
  act25 integer check (act25 between 1 and 36),
  act50 integer check (act50 between 1 and 36),
  act75 integer check (act75 between 1 and 36),
  gpa_distribution jsonb,
  test_policy text not null check (test_policy in ('required', 'optional', 'blind')),
  ielts_min numeric check (ielts_min between 0 and 9),
  toefl_min numeric check (toefl_min between 0 and 120),

  -- Cost & aid. cost_of_attendance_usd is the full I-20 figure
  -- (tuition + fees + room/board + books/personal), not discounted tuition.
  cost_of_attendance_usd integer not null check (cost_of_attendance_usd > 0),
  intl_aid_policy text not null check (
    intl_aid_policy in ('need-blind-full-need', 'need-aware', 'merit-only', 'none')
  ),
  avg_intl_aid_usd integer check (avg_intl_aid_usd >= 0),
  pct_intl_receiving_aid numeric check (pct_intl_receiving_aid between 0 and 100),

  -- Provenance — the answer to "where is this number from?". One URL + data
  -- year per stats group, plus the CDS link and the per-field confidence map
  -- (DOMAIN.md §3.2: verified-intl | verified-overall | estimated | missing).
  cds_url text not null,
  admission_source_url text not null,
  admission_source_year text not null,   -- e.g. '2024-25'
  cost_source_url text not null,
  cost_source_year text not null,
  aid_source_url text not null,
  aid_source_year text not null,
  field_confidence jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger universities_set_updated_at
  before update on public.universities
  for each row execute function public.set_updated_at();

alter table public.universities enable row level security;

-- Readable by everyone, signed in or not — the catalog is the storefront.
create policy "universities: public read"
  on public.universities for select
  to anon, authenticated
  using (true);

-- Deliberately NO insert/update/delete policies: with RLS enabled and no
-- policy, those statements are denied for anon/authenticated. Only the
-- service_role key (seed scripts, admin tooling) can write.

-- NOTE on indexes: none beyond the PK, deliberately. ~60 rows in v1 means
-- Postgres will seq-scan every filter, correctly. Revisit at v2 scale
-- (College Scorecard import) — likely GIN on major_categories then.

-- ----------------------------------------------------------------------------
-- saved_lists + list_items — a student's selected universities
-- ----------------------------------------------------------------------------
create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My list',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger saved_lists_set_updated_at
  before update on public.saved_lists
  for each row execute function public.set_updated_at();

-- Postgres does not auto-index FK columns; RLS and "load my lists" both
-- filter on user_id.
create index saved_lists_user_id_idx on public.saved_lists (user_id);

alter table public.saved_lists enable row level security;

create policy "saved_lists: owner full access"
  on public.saved_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.saved_lists (id) on delete cascade,
  university_id text not null references public.universities (id),
  added_at timestamptz not null default now(),
  -- Integrity (no duplicate school per list) + serves as the list_id FK index.
  constraint list_items_unique_per_list unique (list_id, university_id)
);

alter table public.list_items enable row level security;

-- Ownership flows through the parent list.
create policy "list_items: owner full access"
  on public.list_items for all
  using (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_items.list_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_items.list_id and l.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- fit_snapshots — FitResults frozen at computation time (DOMAIN.md §1.3)
--
-- Results are stored, not computed live, for three reasons:
--   1. Algorithm versioning — every constant is a prior pending calibration
--      (ADR-0002); new versions must not silently rewrite old results.
--   2. User trust — a student's Reach/Target labels must never shift under
--      them because we refreshed university data; recalculation is explicit.
--   3. Debugging — frozen inputs + outputs make any "my score looks wrong"
--      report exactly reproducible.
-- ----------------------------------------------------------------------------
create table public.fit_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  university_id text not null references public.universities (id),

  algorithm_version text not null,        -- e.g. '1.0.0'
  -- Exact inputs as-of computation, for replay. jsonb (not columns) because
  -- snapshot shape evolves with the algorithm and is never queried into
  -- server-side in v1; columns would force a migration per algorithm tweak.
  profile_input jsonb not null,
  university_input jsonb not null,
  -- FitResult: sub-scores, overall, category, gates_fired, explanations,
  -- data_confidence.
  result jsonb not null,

  computed_at timestamptz not null default now()
);

-- Serves "all my snapshots, newest first" (leftmost prefix) and
-- "latest snapshot for school X".
create index fit_snapshots_user_univ_idx
  on public.fit_snapshots (user_id, university_id, computed_at desc);

alter table public.fit_snapshots enable row level security;

create policy "fit_snapshots: owner can read"
  on public.fit_snapshots for select
  using (auth.uid() = user_id);

create policy "fit_snapshots: owner can insert"
  on public.fit_snapshots for insert
  with check (auth.uid() = user_id);

create policy "fit_snapshots: owner can delete"
  on public.fit_snapshots for delete
  using (auth.uid() = user_id);

-- Deliberately NO update policy: snapshots are immutable, append-only.
