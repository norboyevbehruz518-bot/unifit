-- Add CDS Section C7 admission factors as optional JSONB column.
-- Populated per-university via the seed script; null for universities
-- without C7 data in the seed.
alter table public.universities
  add column if not exists c7_factors jsonb;
