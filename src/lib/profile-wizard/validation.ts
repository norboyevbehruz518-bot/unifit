import type { ProfileDraft } from "./draft";

export type StepErrors = Record<string, string>;

export function validateStep0(draft: ProfileDraft): StepErrors {
  const errors: StepErrors = {};

  const name = draft.fullName.trim();
  if (!name) {
    errors.fullName = "Please enter your full name (first and last name).";
  } else if (name.length > 60) {
    errors.fullName = "Name must be 60 characters or fewer.";
  } else if (!/^[a-zA-ZÀ-öø-ÿ\s\-']+$/.test(name)) {
    errors.fullName = "Name should only contain letters, spaces, hyphens, and apostrophes.";
  } else {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.some((w) => w.length < 2)) {
      errors.fullName = "Please enter your full name (first and last name).";
    }
  }

  if (!draft.birthYear) {
    errors.birthYear = "Please select your year of birth.";
  }

  return errors;
}

const GPA_MAX: Record<ProfileDraft["gpaScale"], number> = {
  "4.0": 4,
  "5.0-uz": 5,
  percentage: 100,
};

export function validateStep1(draft: ProfileDraft): StepErrors {
  const errors: StepErrors = {};

  if (!draft.citizenship) {
    errors.citizenship = "Let us know your citizenship — it changes which schools are realistic.";
  }

  const gpaValue = Number(draft.gpaValue);
  const gpaMax = GPA_MAX[draft.gpaScale];
  if (!draft.gpaValue || Number.isNaN(gpaValue)) {
    errors.gpaValue = "Enter your GPA so we can place you accurately.";
  } else if (gpaValue <= 0 || gpaValue > gpaMax) {
    errors.gpaValue = `That doesn't look right for a ${draft.gpaScale === "percentage" ? "percentage" : draft.gpaScale} scale — enter a number between 0 and ${gpaMax}.`;
  }

  if (draft.satTotal) {
    const sat = Number(draft.satTotal);
    if (Number.isNaN(sat) || sat < 400 || sat > 1600) {
      errors.satTotal = "SAT total should be between 400 and 1600.";
    }
  }

  if (draft.actComposite) {
    const act = Number(draft.actComposite);
    if (Number.isNaN(act) || act < 1 || act > 36) {
      errors.actComposite = "ACT composite should be between 1 and 36.";
    }
  }

  if (draft.englishTest !== "none") {
    const score = Number(draft.englishScore);
    const max = draft.englishTest === "ielts" ? 9 : 120;
    if (!draft.englishScore || Number.isNaN(score)) {
      errors.englishScore = `Enter your ${draft.englishTest.toUpperCase()} score, or switch to "Haven't taken one yet" above.`;
    } else if (score < 0 || score > max) {
      errors.englishScore = `${draft.englishTest.toUpperCase()} scores run from 0 to ${max}.`;
    }
  }

  return errors;
}

export function validateStep2(draft: ProfileDraft): StepErrors {
  const errors: StepErrors = {};
  if (draft.intendedMajors.length === 0) {
    errors.intendedMajors = "Pick at least one — even a best guess helps us find good matches.";
  }
  return errors;
}

export function validateStep3(): StepErrors {
  // Slider and aid-level always have valid defaults; nothing to enforce.
  return {};
}

export function validateStep4(): StepErrors {
  // Every rubric question defaults to its lowest (still valid) answer.
  return {};
}

export function validateStep(step: number, draft: ProfileDraft): StepErrors {
  switch (step) {
    case 0:
      return validateStep0(draft);
    case 1:
      return validateStep1(draft);
    case 2:
      return validateStep2(draft);
    case 3:
      return validateStep3();
    case 4:
      return validateStep4();
    default:
      return {};
  }
}
