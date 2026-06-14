import type { createClient as createServerClient } from "@/lib/supabase/server";
import { ALGORITHM_VERSION } from "@/lib/fit-engine";
import type { FitResult, StudentProfile, University } from "@/types/domain";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

/**
 * `profile_input` is stored as the profile plus the source row's
 * `updated_at`, so we can tell whether the profile has changed since this
 * snapshot was frozen without a separate column (DOMAIN.md fit_snapshots
 * are append-only jsonb by design).
 */
export interface SnapshotProfileInput extends StudentProfile {
  _profileUpdatedAt: string;
}

export interface FitSnapshot {
  universityId: string;
  algorithmVersion: string;
  profileUpdatedAt: string;
  result: FitResult;
  computedAt: string;
}

interface SnapshotRow {
  university_id: string;
  algorithm_version: string;
  profile_input: SnapshotProfileInput;
  result: FitResult;
  computed_at: string;
}

/**
 * Loads the latest snapshot per university for this user (the index is
 * ordered `computed_at desc`, so the first row per `university_id` wins).
 */
export async function getLatestSnapshots(
  supabase: SupabaseClient,
  userId: string,
  universityIds: string[],
): Promise<Map<string, FitSnapshot>> {
  if (universityIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("fit_snapshots")
    .select("university_id, algorithm_version, profile_input, result, computed_at")
    .eq("user_id", userId)
    .in("university_id", universityIds)
    .order("computed_at", { ascending: false });

  if (error) throw error;

  const latest = new Map<string, FitSnapshot>();
  for (const row of data as unknown as SnapshotRow[]) {
    if (latest.has(row.university_id)) continue;
    latest.set(row.university_id, {
      universityId: row.university_id,
      algorithmVersion: row.algorithm_version,
      profileUpdatedAt: row.profile_input._profileUpdatedAt,
      result: row.result,
      computedAt: row.computed_at,
    });
  }
  return latest;
}

export interface NewSnapshot {
  universityId: string;
  profile: StudentProfile;
  profileUpdatedAt: string;
  university: University;
  result: FitResult;
}

/** Inserts new (frozen) snapshot rows — append-only, never updates existing rows. */
export async function insertSnapshots(
  supabase: SupabaseClient,
  userId: string,
  snapshots: NewSnapshot[],
): Promise<void> {
  if (snapshots.length === 0) return;

  const { error } = await supabase.from("fit_snapshots").insert(
    snapshots.map((s) => ({
      user_id: userId,
      university_id: s.universityId,
      algorithm_version: ALGORITHM_VERSION,
      profile_input: { ...s.profile, _profileUpdatedAt: s.profileUpdatedAt } satisfies SnapshotProfileInput,
      university_input: s.university,
      result: s.result,
    })),
  );

  if (error) throw error;
}

/** True when this snapshot was computed by an older algorithm or a stale profile. */
export function isSnapshotStale(snapshot: FitSnapshot, profileUpdatedAt: string): boolean {
  return (
    snapshot.algorithmVersion !== ALGORITHM_VERSION || snapshot.profileUpdatedAt !== profileUpdatedAt
  );
}
