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
/**
 * Fetches competitors ranked just above and below the student for display
 * in a ranking ladder. Returns up to `range` entries above + `range` below,
 * each tagged with their virtual rank number.
 *
 * The student row is NOT included — callers stitch it in at index `actualAbove`
 * (also returned) so it lands correctly even when studentRank < range.
 */
export async function getNearbyCompetitors(
  universityId: string,
  studentRank: number,
  range = 3,
): Promise<{ competitors: CompetitorEntry[]; actualAbove: number }> {
  const supabase = getClient();

  // How many rows actually exist above the student (clamped at top of board)
  const actualAbove = Math.min(range, studentRank - 1);
  const aboveOffset = studentRank - actualAbove - 1; // 0-indexed DB offset
  const limit = actualAbove + range; // rows above + rows below

  const { data, error } = await supabase
    .from("competitor_pool")
    .select("name, academic_fit")
    .eq("university_id", universityId)
    .order("academic_fit", { ascending: false })
    .range(aboveOffset, aboveOffset + limit - 1);

  if (error || !data) return { competitors: [], actualAbove };

  const competitors = data.map((row, i) => ({
    // Rows before actualAbove are above the student; rows from actualAbove onward
    // are below, so shift their rank by +1 to account for the student's slot.
    rank: i < actualAbove ? aboveOffset + i + 1 : aboveOffset + i + 2,
    name: row.name as string,
    academicFit: row.academic_fit as number,
  }));

  return { competitors, actualAbove };
}
