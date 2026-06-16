-- Add full_name and age to profiles.
-- Existing rows get full_name = '' (triggers wizard redirect) and age = null.
-- After backfill the default is dropped so future inserts must supply the value.

alter table public.profiles
  add column full_name text    not null default '',
  add column age       integer check (age >= 13 and age <= 25);

alter table public.profiles
  alter column full_name drop default;
