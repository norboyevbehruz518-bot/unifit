import { Input } from "@/components/ui/Input";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import type { StepErrors } from "@/lib/profile-wizard/validation";

export interface StepProps {
  draft: ProfileDraft;
  errors: StepErrors;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

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

      <Input
        label="Your age"
        type="number"
        inputMode="numeric"
        min={13}
        max={25}
        placeholder="e.g. 18"
        value={draft.age}
        onChange={(e) => onChange({ age: e.target.value })}
        error={errors.age}
        hint="UniFit is for students aged 13–25."
      />
    </div>
  );
}
