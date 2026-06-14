"use server";

import { redirect } from "next/navigation";
import { getOrCreateDefaultList, setListItems } from "@/lib/data/lists";
import { createClient } from "@/lib/supabase/server";

/** Replaces the signed-in user's list with `universityIds`, then routes to results. */
export async function saveUniversitySelection(universityIds: string[]): Promise<void> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const listId = await getOrCreateDefaultList(supabase, userData.user.id);
  await setListItems(supabase, listId, universityIds);

  redirect("/app/results");
}
