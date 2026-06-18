-- Alumni table: real students from Uzbekistan who were admitted to top US universities.
-- Public read, no client write.

create table public.alumni (
  id               uuid        primary key default gen_random_uuid(),
  university_id    text        not null references public.universities(id),
  full_name        text        not null,
  country          text        not null,
  major            text        not null,
  year_admitted    integer     not null,
  scholarship      text,
  extracurriculars text[]      not null default '{}',
  honors           text[]      not null default '{}',
  linkedin_url     text,
  bio              text,
  is_verified      boolean     not null default true,
  created_at       timestamptz not null default now()
);

create index alumni_university_id_idx on public.alumni (university_id);

alter table public.alumni enable row level security;

create policy "alumni_public_read"
  on public.alumni
  for select
  using (true);
