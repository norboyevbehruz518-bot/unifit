-- Clear all synthetic data — will be regenerated with names and tier-based pool sizes.
truncate public.competitor_pool;

-- Add name column for display in nearby-competitors ranking.
alter table public.competitor_pool
  add column name text not null default '';

alter table public.competitor_pool
  alter column name drop default;
