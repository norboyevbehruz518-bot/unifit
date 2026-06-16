import { redirect } from "next/navigation";
import { calculateFitResult } from "@/lib/fit-engine";
import { getOrCreateDefaultList, getListItems } from "@/lib/data/lists";
import { getProfile } from "@/lib/data/profile";
import { getUniversitiesByIds } from "@/lib/data/universities";
import { getLatestSnapshots, insertSnapshots, isSnapshotStale } from "@/lib/data/snapshots";
import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { RankData } from "@/lib/ranking/getRank";
import type { FitResult, StudentProfile, University } from "@/types/domain";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

export interface ResultEntry {
  university: University;
  result: FitResult;
  /** Always null from the server — fetched client-side by RankDisplay. */
  rankData: RankData | null;
}

export interface ResultsView {
  profile: StudentProfile;
  results: ResultEntry[];
  /** True if any existing snapshot predates the current profile or algorithm version. */
  needsRecalculate: boolean;
}

/**
 * Loads the user's selected universities and their fit results.
 *
 * Universities seen for the first time get a snapshot computed and frozen
 * immediately (there's nothing to show otherwise). Universities that already
 * have a snapshot keep showing that frozen result even if the profile has
 * since changed — `needsRecalculate` signals that to the caller, and
 * {@link recalculateResults} is the explicit action that re-freezes them.
 *
 * Returns `null` if the user hasn't completed their profile yet.
 */
export async function getOrComputeResults(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResultsView | null> {
  const [profileWithMeta, listId] = await Promise.all([
    getProfile(supabase, userId),
    getOrCreateDefaultList(supabase, userId),
  ]);
  if (!profileWithMeta) return null;
  const { profile, updatedAt } = profileWithMeta;

  // Existing users who predate the name/age fields get sent back to setup.
  if (!profile.fullName || profile.fullName.trim().length < 2) {
    redirect("/app/setup");
  }

  const universityIds = await getListItems(supabase, listId);
  if (universityIds.length === 0) {
    return { profile, results: [], needsRecalculate: false };
  }

  const [universities, snapshots] = await Promise.all([
    getUniversitiesByIds(supabase, universityIds),
    getLatestSnapshots(supabase, userId, universityIds),
  ]);

  const toInsert: Parameters<typeof insertSnapshots>[2] = [];
  const results: ResultEntry[] = [];
  let needsRecalculate = false;

  for (const university of universities) {
    const snapshot = snapshots.get(university.id);
    if (snapshot) {
      results.push({ university, result: snapshot.result, rankData: null });
      if (isSnapshotStale(snapshot, updatedAt)) needsRecalculate = true;
      continue;
    }

    const result = calculateFitResult(profile, university);
    results.push({ university, result, rankData: null });
    toInsert.push({ universityId: university.id, profile, profileUpdatedAt: updatedAt, university, result });
  }

  await insertSnapshots(supabase, userId, toInsert);

  return { profile, results, needsRecalculate };
}
