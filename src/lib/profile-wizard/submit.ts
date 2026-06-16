import { createClient } from "@/lib/supabase/client";
import type { ProfileDraft } from "./draft";

/** Maps the wizard draft onto the `profiles` table's columns. */
function toProfileRow(userId: string, draft: ProfileDraft) {
  return {
    id: userId,
    gpa_value: Number(draft.gpaValue),
    gpa_scale: draft.gpaScale,
    sat_total: draft.satTotal ? Number(draft.satTotal) : null,
    act_composite: draft.actComposite ? Number(draft.actComposite) : null,
    english_test: draft.englishTest,
    english_score: draft.englishTest === "none" ? null : Number(draft.englishScore),
    intended_majors: draft.intendedMajors,
    annual_budget_usd: draft.annualBudgetUsd,
    aid_need_level: draft.aidNeedLevel,
    rubric_leadership: draft.rubric.leadership,
    rubric_awards: draft.rubric.awards,
    rubric_commitment: draft.rubric.commitment,
    rubric_focus: draft.rubric.focus,
    citizenship: draft.citizenship,
    ap_scores: draft.apScores.length > 0 ? draft.apScores : null,
  };
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/** Saves the profile draft for the signed-in user. */
export async function submitProfile(draft: ProfileDraft): Promise<SubmitResult> {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: "Your session expired — please log in again and retry." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(toProfileRow(userData.user.id, draft), { onConflict: "id" });

  if (error) {
    return {
      ok: false,
      error: "Something went wrong saving your profile. Please try again in a moment.",
    };
  }

  return { ok: true };
}
