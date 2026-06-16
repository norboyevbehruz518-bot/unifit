"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateFitResult } from "@/lib/fit-engine";
import { getListItems, getOrCreateDefaultList } from "@/lib/data/lists";
import { getProfile } from "@/lib/data/profile";
import { getUniversitiesByIds } from "@/lib/data/universities";
import { insertSnapshots, type NewSnapshot } from "@/lib/data/snapshots";
import { createClient } from "@/lib/supabase/server";

/** Recomputes and freezes a fresh snapshot for every university on the user's list. */
export async function recalculateResults(): Promise<void> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }
  const userId = userData.user.id;

  const [profileWithMeta, listId] = await Promise.all([
    getProfile(supabase, userId),
    getOrCreateDefaultList(supabase, userId),
  ]);
  if (!profileWithMeta) {
    redirect("/app/setup");
  }
  const { profile, updatedAt } = profileWithMeta;

  const universityIds = await getListItems(supabase, listId);
  const universities = await getUniversitiesByIds(supabase, universityIds);

  const snapshots: NewSnapshot[] = universities.map((university) => ({
    universityId: university.id,
    profile,
    profileUpdatedAt: updatedAt,
    university,
    result: calculateFitResult(profile, university),
  }));

  await insertSnapshots(supabase, userId, snapshots);
  revalidatePath("/app/results");
}
