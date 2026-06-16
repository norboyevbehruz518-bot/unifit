import { EMPTY_DRAFT, type ProfileDraft } from "./draft";

const STORAGE_KEY = "unifit:profile-draft";

export interface StoredWizardState {
  step: number;
  draft: ProfileDraft;
}

const EMPTY_STATE: StoredWizardState = { step: 0, draft: EMPTY_DRAFT };

export function loadWizardState(): StoredWizardState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredWizardState>;
    return {
      step: parsed.step ?? 0,
      draft: { ...EMPTY_DRAFT, ...parsed.draft },
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveWizardState(state: StoredWizardState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearWizardState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
