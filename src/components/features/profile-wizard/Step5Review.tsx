import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { normalizeGpa } from "@/lib/fit-engine/normalize";
import { COUNTRY_OPTIONS } from "@/lib/profile-wizard/countries";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import { AID_LEVEL_LABELS, formatBudget, GPA_SCALE_LABELS } from "@/lib/profile-wizard/format";
import { majorLabel } from "@/lib/profile-wizard/major-groups";
import { RUBRIC_QUESTIONS } from "./Step4ProfileStrength";
import { SummaryRow } from "./SummaryRow";

interface SummaryCardProps {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}

function SummaryCard({ title, step, onEdit, children }: SummaryCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-stone-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-small font-medium text-ink-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
        >
          Edit
        </button>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Card>
  );
}

export interface Step5Props {
  draft: ProfileDraft;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}

export function Step5Review({ draft, onEdit, onSubmit, submitting, submitError }: Step5Props) {
  const gpaValue = Number(draft.gpaValue);
  const gpaConversion =
    draft.gpaScale !== "4.0" && !Number.isNaN(gpaValue)
      ? ` (≈ ${normalizeGpa(gpaValue, draft.gpaScale).toFixed(2)} on a 4.0 scale)`
      : "";

  const countryLabel =
    COUNTRY_OPTIONS.find((c) => c.value === draft.citizenship)?.label ?? draft.citizenship;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Review</h2>
        <p className="mt-1 text-small text-stone-500">
          Here&apos;s everything you told us. Anything look off? Hit Edit on that section — once
          it&apos;s right, save and we&apos;ll start matching you with schools.
        </p>
      </div>

      <SummaryCard title="About you" step={0} onEdit={onEdit}>
        <SummaryRow label="Name" value={draft.fullName} />
        <SummaryRow label="Birth year" value={draft.birthYear} />
      </SummaryCard>

      <SummaryCard title="Academics" step={1} onEdit={onEdit}>
        <SummaryRow label="Citizenship" value={countryLabel} />
        <SummaryRow
          label="GPA"
          value={`${draft.gpaValue} (${GPA_SCALE_LABELS[draft.gpaScale]})${gpaConversion}`}
        />
        {draft.satTotal && <SummaryRow label="SAT total" value={draft.satTotal} />}
        {draft.actComposite && <SummaryRow label="ACT composite" value={draft.actComposite} />}
        <SummaryRow
          label="English test"
          value={
            draft.englishTest === "none"
              ? "Not taken yet"
              : `${draft.englishTest.toUpperCase()} ${draft.englishScore}`
          }
        />
      </SummaryCard>

      <SummaryCard title="Direction" step={2} onEdit={onEdit}>
        {draft.intendedMajors.map((id, i) => (
          <SummaryRow key={id} label={`${i + 1}.`} value={majorLabel(id)} />
        ))}
      </SummaryCard>

      <SummaryCard title="Money" step={3} onEdit={onEdit}>
        <SummaryRow label="Family budget" value={formatBudget(draft.annualBudgetUsd)} />
        <SummaryRow label="Aid need" value={AID_LEVEL_LABELS[draft.aidNeedLevel]} />
      </SummaryCard>

      <SummaryCard title="Profile strength" step={4} onEdit={onEdit}>
        {RUBRIC_QUESTIONS.map((q) => (
          <SummaryRow key={q.key} label={q.title} value={q.options[draft.rubric[q.key]]?.label ?? ""} />
        ))}
      </SummaryCard>

      {submitError && (
        <p className="text-small font-medium text-reach-700" role="alert">
          {submitError}
        </p>
      )}

      <Button size="lg" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Saving…" : "Save my profile"}
      </Button>
    </div>
  );
}
