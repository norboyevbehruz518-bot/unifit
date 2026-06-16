-- competitor_pool: stores virtual applicant pool data for ranking.
-- Public read, service-role-only write (pool data is seeded server-side).

create table public.competitor_pool (
  id            uuid        primary key default gen_random_uuid(),
  university_id text        not null references public.universities(id) on delete cascade,
  academic_fit  numeric(5,2) not null,
  overall_score numeric(5,2) not null,
  is_virtual    boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- Fast lookup by university (constant in ranking queries)
create index competitor_pool_university_id_idx
  on public.competitor_pool (university_id);

-- Covering index for ranking queries: filter by university, order/compare by academic_fit
create index competitor_pool_university_academic_idx
  on public.competitor_pool (university_id, academic_fit);

-- RLS: on, anon can read, no client writes
alter table public.competitor_pool enable row level security;

create policy "competitor_pool_public_read"
  on public.competitor_pool
  for select
  using (true);
