-- Remove the 13-25 age restriction. Age is now computed from birth year
-- server-side and applies to all ages without restriction.
alter table public.profiles
  drop constraint if exists profiles_age_check;
