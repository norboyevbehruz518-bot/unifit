import { redirect } from "next/navigation";
import { UniversitySelectionForm } from "@/components/features/university-picker/UniversitySelectionForm";
import { getCachedUniversities } from "@/lib/data/universities";
import { getProfile } from "@/lib/data/profile";
import { getListItems, getOrCreateDefaultList } from "@/lib/data/lists";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choose universities — UniFit" };

export default async function UniversitiesPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const [profile, universities, listId] = await Promise.all([
    getProfile(supabase, userData.user.id),
    getCachedUniversities(),
    getOrCreateDefaultList(supabase, userData.user.id),
  ]);

  if (!profile) {
    redirect("/app/setup");
  }

  const selectedIds = await getListItems(supabase, listId);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-h1 font-semibold text-stone-900">Choose your universities</h1>
        <p className="mt-1 text-body text-stone-500">
          Pick up to 12 schools. We&apos;ll calculate your fit for each one.
        </p>
      </div>
      <UniversitySelectionForm universities={universities} initialSelectedIds={selectedIds} />
    </div>
  );
}
