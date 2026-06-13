import { RadioCardGroup } from "@/components/ui/RadioCardGroup";
import { Slider } from "@/components/ui/Slider";
import type { AidNeedLevel } from "@/types/domain";
import type { StepProps } from "./Step1Academics";

const BUDGET_MIN = 5000;
const BUDGET_MAX = 100000;

const AID_OPTIONS: { value: AidNeedLevel; label: string; description: string }[] = [
  {
    value: "none",
    label: "I can cover the full cost myself",
    description: "We'll focus on schools where the sticker price fits your budget.",
  },
  {
    value: "partial",
    label: "I'll need some financial aid",
    description: "We'll look for schools that offer meaningful aid to international students.",
  },
  {
    value: "full",
    label: "I need close to a full ride to attend",
    description: "We'll prioritize schools known for generous need-based aid.",
  },
];

function formatBudget(value: number): string {
  return value >= BUDGET_MAX
    ? `$${BUDGET_MAX.toLocaleString("en-US")}+ / year`
    : `$${value.toLocaleString("en-US")} / year`;
}

export function Step3Money({ draft, onChange }: StepProps) {
  const fullScholarship = draft.fullScholarship;

  function handleBudgetChange(value: number) {
    onChange({ annualBudgetUsd: value });
  }

  function handleScholarshipToggle(checked: boolean) {
    if (checked) {
      onChange({ fullScholarship: true, annualBudgetUsd: 0, aidNeedLevel: "full" });
    } else {
      onChange({ fullScholarship: false, annualBudgetUsd: BUDGET_MIN, aidNeedLevel: "partial" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Money</h2>
        <p className="mt-1 text-small text-stone-500">
          This stays between you and us — it just helps us point you toward schools that won&apos;t
          stretch your family, and away from ones that will.
        </p>
      </div>

      <Slider
        label="What can your family realistically pay per year?"
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={1000}
        value={fullScholarship ? BUDGET_MIN : draft.annualBudgetUsd}
        onChange={handleBudgetChange}
        formatValue={fullScholarship ? () => "$0 / year" : formatBudget}
        anchors={[
          { value: 5000, label: "$5k" },
          { value: 20000, label: "$20k" },
          { value: 40000, label: "$40k" },
          { value: 60000, label: "$60k" },
          { value: 80000, label: "$80k" },
          { value: 100000, label: "$100k+" },
        ]}
        disabled={fullScholarship}
      />

      <label className="flex items-start gap-3 rounded-lg border border-stone-300 bg-white p-3">
        <input
          type="checkbox"
          checked={fullScholarship}
          onChange={(e) => handleScholarshipToggle(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-ink-600)]"
        />
        <span className="text-body text-stone-900">
          I can&apos;t contribute anything — I need a full scholarship
        </span>
      </label>

      {!fullScholarship && (
        <RadioCardGroup
          label="Financial aid need"
          name="aid-need-level"
          value={draft.aidNeedLevel}
          onChange={(value) => onChange({ aidNeedLevel: value as AidNeedLevel })}
          options={AID_OPTIONS}
        />
      )}
    </div>
  );
}
