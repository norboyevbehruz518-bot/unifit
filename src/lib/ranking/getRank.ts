import { createClient } from "@supabase/supabase-js";

export interface CompetitorEntry {
  rank: number;
  name: string;
  academicFit: number;
}

export interface RankData {
  rank: number;
  total: number;
  percentile: number; // 1–100, higher = better
}

// Module-level client — anon key, public read, no auth needed (RLS allows SELECT)
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Returns the student's rank among the virtual competitor pool for a given
 * university. Two parallel HEAD-only COUNT queries — no rows transferred.
 * Returns null on any error so the UI degrades gracefully.
 */
export async function getRank(
  universityId: string,
  studentAcademicFit: number,
): Promise<RankData | null> {
  const supabase = getClient();

  const [aheadRes, totalRes] = await Promise.all([
    supabase
      .from("competitor_pool")
      .select("*", { count: "exact", head: true })
      .eq("university_id", universityId)
      .gt("academic_fit", studentAcademicFit),
    supabase
      .from("competitor_pool")
      .select("*", { count: "exact", head: true })
      .eq("university_id", universityId),
  ]);

  if (aheadRes.error || totalRes.error) return null;

  const aheadCount = aheadRes.count ?? 0;
  const total = totalRes.count ?? 0;
  if (total === 0) return null;

  return {
    rank: aheadCount + 1,
    total,
    percentile: Math.round((1 - aheadCount / total) * 100),
  };
}

/**
 * Fetches competitors ranked just above and below the student for display
 * in a ranking ladder. Returns up to `range` entries above + `range` below.
 */
export async function getNearbyCompetitors(
  universityId: string,
  studentRank: number,
  range = 3,
): Promise<CompetitorEntry[]> {
  const supabase = getClient();

  // Offset so we fetch rows straddling the student's rank position
  const aboveOffset = Math.max(0, studentRank - range - 1);
  const limit = range * 2 + 1; // above + student slot + below

  const { data, error } = await supabase
    .from("competitor_pool")
    .select("name, academic_fit")
    .eq("university_id", universityId)
    .order("academic_fit", { ascending: false })
    .range(aboveOffset, aboveOffset + limit - 1);

  if (error || !data) return [];

  return data.map((row, i) => ({
    rank: aboveOffset + i + 1,
    name: row.name as string,
    academicFit: row.academic_fit as number,
  }));
}
