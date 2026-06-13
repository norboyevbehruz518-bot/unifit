import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { normalizeGpa } from "@/lib/fit-engine/normalize";
import { COUNTRY_OPTIONS } from "@/lib/profile-wizard/countries";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import type { StepErrors } from "@/lib/profile-wizard/validation";

const GPA_SCALE_OPTIONS = [
  { value: "4.0", label: "4.0 scale" },
  { value: "5.0-uz", label: "5.0 (Uzbekistan)" },
  { value: "percentage", label: "Percentage" },
];

const ENGLISH_TEST_OPTIONS = [
  { value: "ielts", label: "IELTS" },
  { value: "toefl", label: "TOEFL" },
  { value: "none", label: "Haven't taken one yet" },
];

export interface StepProps {
  draft: ProfileDraft;
  errors: StepErrors;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

export function Step1Academics({ draft, errors, onChange }: StepProps) {
  const gpaValue = Number(draft.gpaValue);
  const showConversion =
    draft.gpaScale !== "4.0" && draft.gpaValue !== "" && !Number.isNaN(gpaValue) && gpaValue > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Academics</h2>
        <p className="mt-1 text-small text-stone-500">
          The basics that shape which schools are realistic. Test scores are optional —
          most applicants from Uzbekistan apply test-optional, and that&apos;s completely fine.
        </p>
      </div>

      <Select
        label="Citizenship"
        options={COUNTRY_OPTIONS}
        placeholder="Select your country…"
        value={draft.citizenship}
        onChange={(e) => onChange({ citizenship: e.target.value })}
        error={errors.citizenship}
        hint="International vs. domestic changes which schools and aid are realistic — this is the first thing we check."
      />

      <SegmentedControl
        label="GPA scale"
        options={GPA_SCALE_OPTIONS}
        value={draft.gpaScale}
        onChange={(value) => onChange({ gpaScale: value as ProfileDraft["gpaScale"] })}
      />

      <Input
        label={
          draft.gpaScale === "percentage"
            ? "Your GPA (as a percentage)"
            : draft.gpaScale === "5.0-uz"
              ? "Your GPA (out of 5.0)"
              : "Your GPA (out of 4.0)"
        }
        type="number"
        inputMode="decimal"
        step="0.01"
        value={draft.gpaValue}
        onChange={(e) => onChange({ gpaValue: e.target.value })}
        error={errors.gpaValue}
        hint={
          showConversion
            ? `≈ ${normalizeGpa(gpaValue, draft.gpaScale).toFixed(2)} on a 4.0 scale — we'll use this to compare you fairly across schools.`
            : undefined
        }
      />

      <Input
        label="SAT total (optional)"
        type="number"
        inputMode="numeric"
        min={400}
        max={1600}
        value={draft.satTotal}
        onChange={(e) => onChange({ satTotal: e.target.value })}
        error={errors.satTotal}
        hint="Haven't taken it? Leave this blank — plenty of strong applications skip the SAT entirely."
      />

      <Input
        label="ACT composite (optional)"
        type="number"
        inputMode="numeric"
        min={1}
        max={36}
        value={draft.actComposite}
        onChange={(e) => onChange({ actComposite: e.target.value })}
        error={errors.actComposite}
        hint="Same here — only fill this in if you've already taken it."
      />

      <SegmentedControl
        label="English proficiency test"
        options={ENGLISH_TEST_OPTIONS}
        value={draft.englishTest}
        onChange={(value) => {
          if (value === "none") {
            onChange({ englishTest: "none", englishScore: "" });
          } else {
            onChange({ englishTest: value as ProfileDraft["englishTest"] });
          }
        }}
      />

      {draft.englishTest !== "none" && (
        <Input
          label={draft.englishTest === "ielts" ? "IELTS score" : "TOEFL score"}
          type="number"
          inputMode="decimal"
          step={draft.englishTest === "ielts" ? "0.5" : "1"}
          min={0}
          max={draft.englishTest === "ielts" ? 9 : 120}
          value={draft.englishScore}
          onChange={(e) => onChange({ englishScore: e.target.value })}
          error={errors.englishScore}
        />
      )}
    </div>
  );
}
