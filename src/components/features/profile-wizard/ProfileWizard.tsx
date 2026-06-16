"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import { clearWizardState, loadWizardState, saveWizardState } from "@/lib/profile-wizard/storage";
import { submitProfile } from "@/lib/profile-wizard/submit";
import { validateStep, type StepErrors } from "@/lib/profile-wizard/validation";
import { Step0Identity } from "./Step0Identity";
import { Step1Academics } from "./Step1Academics";
import { Step2Direction } from "./Step2Direction";
import { Step3Money } from "./Step3Money";
import { Step4ProfileStrength } from "./Step4ProfileStrength";
import { Step5Review } from "./Step5Review";

const FIRST_STEP = 0;
const TOTAL_STEPS = 6;
const STEP_LABELS = ["About you", "Academics", "Direction", "Money", "Profile strength", "Review"];

const subscribeNever = () => () => {};

/** True once the client has hydrated — used to avoid SSR/localStorage mismatches. */
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function ProfileWizard() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [step, setStep] = useState(() => Math.max(FIRST_STEP, loadWizardState().step));
  const [draft, setDraft] = useState<ProfileDraft>(() => loadWizardState().draft);
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    saveWizardState({ step, draft });
  }, [hydrated, step, draft]);

  function updateDraft(patch: Partial<ProfileDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(FIRST_STEP, s - 1));
  }

  function handleContinue() {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }

  function handleEdit(targetStep: number) {
    setErrors({});
    setStep(targetStep);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitProfile(draft);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error ?? "Something went wrong saving your profile.");
      return;
    }

    clearWizardState();
    router.push("/app/universities");
  }

  if (!hydrated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress current={step + 1} total={TOTAL_STEPS} label={STEP_LABELS[step] ?? ""} />

      <Card padding="lg">
        {step === 0 && <Step0Identity draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 1 && <Step1Academics draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 2 && <Step2Direction draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 3 && <Step3Money draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 4 && <Step4ProfileStrength draft={draft} errors={errors} onChange={updateDraft} />}
        {step === 5 && (
          <Step5Review
            draft={draft}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </Card>

      <div className="flex items-center justify-between">
        {step > FIRST_STEP ? (
          <Button variant="secondary" onClick={handleBack} disabled={submitting}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS - 1 && <Button onClick={handleContinue}>Continue</Button>}
      </div>
    </div>
  );
}
