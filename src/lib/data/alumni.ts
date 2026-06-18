import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { Alumni } from "@/types/domain";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

interface AlumniRow {
  id: string;
  university_id: string;
  full_name: string;
  country: string;
  major: string;
  year_admitted: number;
  scholarship: string | null;
  extracurriculars: string[];
  honors: string[];
  linkedin_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

function mapAlumniRow(row: AlumniRow): Alumni {
  return {
    id: row.id,
    universityId: row.university_id,
    fullName: row.full_name,
    country: row.country,
    major: row.major,
    yearAdmitted: row.year_admitted,
    scholarship: row.scholarship,
    extracurriculars: row.extracurriculars,
    honors: row.honors,
    linkedinUrl: row.linkedin_url,
    bio: row.bio,
    isVerified: row.is_verified,
  };
}

const ALUMNI_COLUMNS =
  "id, university_id, full_name, country, major, year_admitted, scholarship, " +
  "extracurriculars, honors, linkedin_url, bio, is_verified";

export async function getAlumniForUniversity(
  supabase: SupabaseClient,
  universityId: string,
): Promise<Alumni[]> {
  const { data, error } = await supabase
    .from("alumni")
    .select(ALUMNI_COLUMNS)
    .eq("university_id", universityId)
    .order("year_admitted", { ascending: false });

  if (error) throw error;
  return (data as unknown as AlumniRow[]).map(mapAlumniRow);
}

/** Returns the distinct university IDs that have at least one alumni record. */
export async function getAlumniUniversityIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("alumni")
    .select("university_id");

  if (error) throw error;
  const ids = (data as { university_id: string }[]).map((r) => r.university_id);
  return [...new Set(ids)];
}
