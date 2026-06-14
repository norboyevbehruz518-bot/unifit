import type { createClient as createServerClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

export const MAX_LIST_SIZE = 12;

/** Returns the user's default list, creating one ("My list") if none exists yet. */
export async function getOrCreateDefaultList(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return (existing as { id: string }).id;

  const { data: created, error: insertError } = await supabase
    .from("saved_lists")
    .insert({ user_id: userId, name: "My list" })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return (created as { id: string }).id;
}

/** Returns the university ids on a list, in the order they were added. */
export async function getListItems(supabase: SupabaseClient, listId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("list_items")
    .select("university_id")
    .eq("list_id", listId)
    .order("added_at", { ascending: true });

  if (error) throw error;
  return (data as { university_id: string }[]).map((row) => row.university_id);
}

/**
 * Replaces a list's contents with exactly `universityIds` (order preserved via
 * `added_at`). Caps at `MAX_LIST_SIZE`.
 */
export async function setListItems(
  supabase: SupabaseClient,
  listId: string,
  universityIds: string[],
): Promise<void> {
  if (universityIds.length > MAX_LIST_SIZE) {
    throw new Error(`A list can have at most ${MAX_LIST_SIZE} universities.`);
  }

  const { error: deleteError } = await supabase.from("list_items").delete().eq("list_id", listId);
  if (deleteError) throw deleteError;

  if (universityIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("list_items")
    .insert(universityIds.map((universityId) => ({ list_id: listId, university_id: universityId })));

  if (insertError) throw insertError;
}
