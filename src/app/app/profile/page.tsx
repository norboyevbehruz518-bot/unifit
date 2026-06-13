import Link from "next/link";
import { redirect } from "next/navigation";
import { RUBRIC_QUESTIONS } from "@/components/features/profile-wizard/Step4ProfileStrength";
import { SummaryRow } from "@/components/features/profile-wizard/SummaryRow";
import { Card } from "@/components/ui/Card";
import { normalizeGpa } from "@/lib/fit-engine/normalize";
import { COUNTRY_OPTIONS } from "@/lib/profile-wizard/countries";
import { AID_LEVEL_LABELS, formatBudget, GPA_SCALE_LABELS } from "@/lib/profile-wizard/format";
import { majorLabel } from "@/lib/profile-wizard/major-groups";
import { createClient } from "@/lib/supabase/server";
import type { AidNeedLevel, EnglishTest, GpaScale, ProfileRubric } from "@/types/domain";

export const metadata = { title: "Your profile — UniFit" };

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/app/setup");
  }

  const gpaScale = profile.gpa_scale as GpaScale;
  const gpaValue = Number(profile.gpa_value);
  const gpaConversion =
    gpaScale !== "4.0"
      ? ` (≈ ${normalizeGpa(gpaValue, gpaScale).toFixed(2)} on a 4.0 scale)`
      : "";
  const countryLabel =
    COUNTRY_OPTIONS.find((c) => c.value === profile.citizenship)?.label ?? profile.citizenship;
  const englishTest = profile.english_test as EnglishTest;
  const aidNeedLevel = profile.aid_need_level as AidNeedLevel;
  const rubric: ProfileRubric = {
    leadership: profile.rubric_leadership,
    awards: profile.rubric_awards,
    commitment: profile.rubric_commitment,
    focus: profile.rubric_focus,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 font-semibold text-stone-900">Your profile</h1>
        <Link
          href="/app/setup"
          className="text-small font-medium text-ink-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
        >
          Edit
        </Link>
      </div>

      <Card title="Academics">
        <div className="flex flex-col gap-1.5">
          <SummaryRow label="Citizenship" value={countryLabel} />
          <SummaryRow
            label="GPA"
            value={`${profile.gpa_value} (${GPA_SCALE_LABELS[gpaScale]})${gpaConversion}`}
          />
          {profile.sat_total && <SummaryRow label="SAT total" value={String(profile.sat_total)} />}
          {profile.act_composite && (
            <SummaryRow label="ACT composite" value={String(profile.act_composite)} />
          )}
          <SummaryRow
            label="English test"
            value={
              englishTest === "none"
                ? "Not taken yet"
                : `${englishTest.toUpperCase()} ${profile.english_score}`
            }
          />
        </div>
      </Card>

      <Card title="Direction">
        <div className="flex flex-col gap-1.5">
          {(profile.intended_majors as string[]).map((id, i) => (
            <SummaryRow key={id} label={`${i + 1}.`} value={majorLabel(id)} />
          ))}
        </div>
      </Card>

      <Card title="Money">
        <div className="flex flex-col gap-1.5">
          <SummaryRow label="Family budget" value={formatBudget(profile.annual_budget_usd)} />
          <SummaryRow label="Aid need" value={AID_LEVEL_LABELS[aidNeedLevel]} />
        </div>
      </Card>

      <Card title="Profile strength">
        <div className="flex flex-col gap-1.5">
          {RUBRIC_QUESTIONS.map((q) => (
            <SummaryRow key={q.key} label={q.title} value={q.options[rubric[q.key]]?.label ?? ""} />
          ))}
        </div>
      </Card>
    </div>
  );
}
