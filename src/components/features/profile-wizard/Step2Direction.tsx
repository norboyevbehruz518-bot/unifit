import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { MAJOR_GROUPS } from "@/lib/profile-wizard/major-groups";
import type { StepProps } from "./Step1Academics";

export function Step2Direction({ draft, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Direction</h2>
        <p className="mt-1 text-small text-stone-500">
          What do you want to study? Pick up to three — your first pick matters most, but the
          others widen your options.
        </p>
      </div>

      <SearchableMultiSelect
        label="Fields of study"
        groups={MAJOR_GROUPS}
        value={draft.intendedMajors}
        onChange={(value) => onChange({ intendedMajors: value })}
        max={3}
        searchPlaceholder="Search fields…"
        hint="Not sure yet? Pick your best guesses — you can change this anytime."
        error={errors.intendedMajors}
      />
    </div>
  );
}
