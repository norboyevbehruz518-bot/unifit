import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import type { StepErrors } from "@/lib/profile-wizard/validation";

export interface StepProps {
  draft: ProfileDraft;
  errors: StepErrors;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const BIRTH_YEAR_OPTIONS = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => {
  const year = 2015 - i;
  return { value: String(year), label: String(year) };
});

export function Step0Identity({ draft, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Let&apos;s get started</h2>
        <p className="mt-1 text-small text-stone-500">
          This personalises your experience and appears in your ranking.
        </p>
      </div>

      <Input
        label="Your full name"
        type="text"
        placeholder="e.g. Jasur Toshmatov"
        autoComplete="name"
        value={draft.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        error={errors.fullName}
      />

      <Select
        label="Year of birth"
        placeholder="Select your birth year"
        options={BIRTH_YEAR_OPTIONS}
        value={draft.birthYear}
        onChange={(e) => onChange({ birthYear: e.target.value })}
        error={errors.birthYear}
        hint="Used to personalise your experience"
      />
    </div>
  );
}
