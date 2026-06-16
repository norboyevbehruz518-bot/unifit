import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { C7Factors, FieldConfidence, University } from "@/types/domain";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/** Raw shape of a row in `public.universities` (snake_case DB columns). */
export interface UniversityRow {
  id: string;
  name: string;
  state: string;
  city: string;
  setting: University["setting"];
  undergrad_enrollment: number;
  type: University["type"];
  major_categories: string[];
  acceptance_rate_overall: number;
  acceptance_rate_intl: number | null;
  sat25: number | null;
  sat50: number | null;
  sat75: number | null;
  act25: number | null;
  act50: number | null;
  act75: number | null;
  test_policy: University["testPolicy"];
  ielts_min: number | null;
  toefl_min: number | null;
  cost_of_attendance_usd: number;
  intl_aid_policy: University["intlAidPolicy"];
  avg_intl_aid_usd: number | null;
  pct_intl_receiving_aid: number | null;
  cds_url: string;
  admission_source_year: string;
  field_confidence: Record<string, FieldConfidence>;
  c7_factors: C7Factors | null;
}

/** Maps `field_confidence` keys from snake_case DB columns to `University` field names. */
const FIELD_CONFIDENCE_KEY_MAP: Record<string, keyof University> = {
  acceptance_rate_overall: "acceptanceRateOverall",
  acceptance_rate_intl: "acceptanceRateIntl",
  sat25: "sat25",
  sat50: "sat50",
  sat75: "sat75",
  act25: "act25",
  act50: "act50",
  act75: "act75",
  cost_of_attendance_usd: "costOfAttendanceUsd",
  avg_intl_aid_usd: "avgIntlAidUsd",
  pct_intl_receiving_aid: "pctIntlReceivingAid",
  ielts_min: "ieltsMin",
  toefl_min: "toeflMin",
};

function mapFieldConfidence(
  raw: Record<string, FieldConfidence>,
): Partial<Record<keyof University, FieldConfidence>> {
  const mapped: Partial<Record<keyof University, FieldConfidence>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = FIELD_CONFIDENCE_KEY_MAP[key];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }
  return mapped;
}

/** Maps a `public.universities` row to the domain `University` type (DOMAIN.md §1.2). */
export function mapUniversityRow(row: UniversityRow): University {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    city: row.city,
    setting: row.setting,
    undergradEnrollment: row.undergrad_enrollment,
    type: row.type,
    majorCategoriesOffered: row.major_categories,
    acceptanceRateOverall: row.acceptance_rate_overall,
    acceptanceRateIntl: row.acceptance_rate_intl,
    sat25: row.sat25,
    sat50: row.sat50,
    sat75: row.sat75,
    act25: row.act25,
    act50: row.act50,
    act75: row.act75,
    testPolicy: row.test_policy,
    ieltsMin: row.ielts_min,
    toeflMin: row.toefl_min,
    costOfAttendanceUsd: row.cost_of_attendance_usd,
    intlAidPolicy: row.intl_aid_policy,
    avgIntlAidUsd: row.avg_intl_aid_usd,
    pctIntlReceivingAid: row.pct_intl_receiving_aid,
    cdsUrl: row.cds_url,
    admissionSourceYear: row.admission_source_year,
    fieldConfidence: mapFieldConfidence(row.field_confidence ?? {}),
    c7Factors: row.c7_factors ?? undefined,
  };
}

const UNIVERSITY_COLUMNS =
  "id, name, state, city, setting, undergrad_enrollment, type, major_categories, " +
  "acceptance_rate_overall, acceptance_rate_intl, sat25, sat50, sat75, act25, act50, act75, " +
  "test_policy, ielts_min, toefl_min, cost_of_attendance_usd, intl_aid_policy, " +
  "avg_intl_aid_usd, pct_intl_receiving_aid, cds_url, admission_source_year, field_confidence, " +
  "c7_factors";

/** Loads the full university catalog (public read, no auth required). */
export async function getAllUniversities(supabase: SupabaseClient): Promise<University[]> {
  const { data, error } = await supabase
    .from("universities")
    .select(UNIVERSITY_COLUMNS)
    .order("name");

  if (error) throw error;
  return (data as unknown as UniversityRow[]).map(mapUniversityRow);
}

/**
 * Cached version of getAllUniversities for server-side use.
 * Uses a public (anon-key) client — universities are public read, no auth needed.
 * Revalidates every hour; data changes only when we re-seed.
 */
export const getCachedUniversities: () => Promise<University[]> = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    return getAllUniversities(supabase as unknown as SupabaseClient);
  },
  ["universities-catalog"],
  { revalidate: 3600 },
);

/** Loads a single university by id, or null if not found. */
export async function getUniversitiesByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<University[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("universities")
    .select(UNIVERSITY_COLUMNS)
    .in("id", ids);

  if (error) throw error;
  return (data as unknown as UniversityRow[]).map(mapUniversityRow);
}
