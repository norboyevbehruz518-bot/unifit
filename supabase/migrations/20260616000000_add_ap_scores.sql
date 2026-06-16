-- Add AP exam scores to student profiles (DOMAIN.md §1.1, FIT_ALGORITHM.md §1.5).
-- Each element: {subject: text, score: integer 1–5}. Optional (null = not supplied).
-- Max 8 entries enforced at the app layer; JSONB chosen so future schema
-- evolution (e.g. adding exam year) needs no migration.
-- DO NOT APPLY until explicitly instructed (supabase db push).

alter table public.profiles
  add column ap_scores jsonb
    check (
      ap_scores is null
      or (
        jsonb_typeof(ap_scores) = 'array'
        and jsonb_array_length(ap_scores) <= 8
      )
    );
