import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { EnglishTest, StudentProfile } from "@/types/domain";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/** Raw shape of a row in `public.profiles` (snake_case DB columns). */
export interface ProfileRow {
  id: string;
  gpa_value: number;
  gpa_scale: StudentProfile["gpaScale"];
  sat_total: number | null;
  act_composite: number | null;
  english_test: EnglishTest;
  english_score: number | null;
  intended_majors: string[];
  annual_budget_usd: number;
  aid_need_level: StudentProfile["aidNeedLevel"];
  rubric_leadership: number;
  rubric_awards: number;
  rubric_commitment: number;
  rubric_focus: number;
  citizenship: string;
  updated_at: string;
}

/** A loaded profile plus its `updated_at` timestamp, used for snapshot freshness checks. */
export interface ProfileWithMeta {
  profile: StudentProfile;
  updatedAt: string;
}

/** Maps a `public.profiles` row to the domain `StudentProfile` type (DOMAIN.md §1.1). */
export function mapProfileRow(row: ProfileRow): StudentProfile {
  return {
    gpaValue: Number(row.gpa_value),
    gpaScale: row.gpa_scale,
    satTotal: row.sat_total ?? undefined,
    actComposite: row.act_composite ?? undefined,
    englishTest: row.english_test,
    englishScore: row.english_score ?? undefined,
    intendedMajors: row.intended_majors,
    annualBudgetUsd: row.annual_budget_usd,
    aidNeedLevel: row.aid_need_level,
    rubric: {
      leadership: row.rubric_leadership as StudentProfile["rubric"]["leadership"],
      awards: row.rubric_awards as StudentProfile["rubric"]["awards"],
      commitment: row.rubric_commitment as StudentProfile["rubric"]["commitment"],
      focus: row.rubric_focus as StudentProfile["rubric"]["focus"],
    },
    citizenship: row.citizenship,
  };
}

const PROFILE_COLUMNS =
  "id, gpa_value, gpa_scale, sat_total, act_composite, english_test, english_score, " +
  "intended_majors, annual_budget_usd, aid_need_level, rubric_leadership, rubric_awards, " +
  "rubric_commitment, rubric_focus, citizenship, updated_at";

/** Loads the signed-in user's profile, or null if they haven't completed setup yet. */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileWithMeta | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProfileRow;
  return { profile: mapProfileRow(row), updatedAt: row.updated_at };
}
