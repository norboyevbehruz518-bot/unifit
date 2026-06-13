"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import { loadWizardState, saveWizardState } from "@/lib/profile-wizard/storage";
import { validateStep, type StepErrors } from "@/lib/profile-wizard/validation";
import { Step1Academics } from "./Step1Academics";
import { Step2Direction } from "./Step2Direction";

const TOTAL_STEPS = 5;
const STEP_LABELS = ["Academics", "Direction", "Money", "Profile strength", "Review"];

const subscribeNever = () => () => {};

/** True once the client has hydrated — used to avoid SSR/localStorage mismatches. */
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function ProfileWizard() {
  const hydrated = useHydrated();
  const [step, setStep] = useState(() => loadWizardState().step);
  const [draft, setDraft] = useState<ProfileDraft>(() => loadWizardState().draft);
  const [errors, setErrors] = useState<StepErrors>({});

  useEffect(() => {
    if (!hydrated) return;
    saveWizardState({ step, draft });
  }, [hydrated, step, draft]);

  function updateDraft(patch: Partial<ProfileDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  function handleContinue() {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  if (!hydrated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={step} total={TOTAL_STEPS} label={STEP_LABELS[step - 1] ?? ""} />

      <Card padding="lg">
        {step === 1 && <Step1Academics draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 2 && <Step2Direction draft={draft} errors={errors} onChange={updateDraft} />}
        {step >= 3 && (
          <p className="text-body text-stone-500">
            Step {step} is on its way — for now, use Back to review what you&apos;ve entered.
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS && <Button onClick={handleContinue}>Continue</Button>}
      </div>
    </div>
  );
}
