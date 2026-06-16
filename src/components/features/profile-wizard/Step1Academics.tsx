"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { normalizeGpa } from "@/lib/fit-engine/normalize";
import { COUNTRY_OPTIONS } from "@/lib/profile-wizard/countries";
import type { ProfileDraft } from "@/lib/profile-wizard/draft";
import type { ApScore } from "@/types/domain";
import type { StepErrors } from "@/lib/profile-wizard/validation";

const AP_SUBJECTS = [
  "Art History",
  "Biology",
  "Calculus AB",
  "Calculus BC",
  "Chemistry",
  "Chinese Language & Culture",
  "Comparative Government & Politics",
  "Computer Science A",
  "Computer Science Principles",
  "English Language & Composition",
  "English Literature & Composition",
  "Environmental Science",
  "European History",
  "French Language & Culture",
  "German Language & Culture",
  "Human Geography",
  "Italian Language & Culture",
  "Japanese Language & Culture",
  "Latin",
  "Macroeconomics",
  "Microeconomics",
  "Music Theory",
  "Physics 1",
  "Physics 2",
  "Physics C: Electricity & Magnetism",
  "Physics C: Mechanics",
  "Psychology",
  "Research",
  "Seminar",
  "Spanish Language & Culture",
  "Spanish Literature & Culture",
  "Statistics",
  "Studio Art: 2-D Design",
  "Studio Art: 3-D Design",
  "Studio Art: Drawing",
  "US Government & Politics",
  "US History",
  "World History: Modern",
];

const AP_MAX = 8;

interface ApSectionProps {
  apScores: ApScore[];
  onChange: (scores: ApScore[]) => void;
}

function ApSection({ apScores, onChange }: ApSectionProps) {
  const [query, setQuery] = useState("");
  const [pendingSubject, setPendingSubject] = useState("");
  const [pendingScore, setPendingScore] = useState<number>(4);

  const usedSubjects = new Set(apScores.map((a) => a.subject));
  const atMax = apScores.length >= AP_MAX;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSubjects = AP_SUBJECTS.filter(
    (s) =>
      !usedSubjects.has(s) &&
      (normalizedQuery === "" || s.toLowerCase().includes(normalizedQuery)),
  );

  function addExam() {
    if (!pendingSubject || atMax) return;
    onChange([...apScores, { subject: pendingSubject, score: pendingScore }]);
    setPendingSubject("");
    setQuery("");
    setPendingScore(4);
  }

  function removeExam(subject: string) {
    onChange(apScores.filter((a) => a.subject !== subject));
  }

  function updateScore(subject: string, score: number) {
    onChange(apScores.map((a) => (a.subject === subject ? { ...a, score } : a)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-small font-medium text-stone-700">AP exams (optional)</p>
        <p className="mt-0.5 text-small text-stone-500">
          AP scores signal academic depth — add any you&apos;ve taken or plan to take. Up to 8 exams.
        </p>
      </div>

      {apScores.length > 0 && (
        <ul className="flex flex-col gap-2">
          {apScores.map((a) => (
            <li key={a.subject} className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
              <span className="flex-1 text-small font-medium text-stone-900">{a.subject}</span>
              <div className="flex items-center gap-2">
                <span className="text-caption text-stone-500">Score</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateScore(a.subject, n)}
                      className={cn(
                        "h-7 w-7 rounded text-small font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
                        a.score === n
                          ? "bg-ink-700 text-white"
                          : "border border-stone-300 bg-white text-stone-700 hover:bg-ink-50",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExam(a.subject)}
                className="text-stone-400 hover:text-reach-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                aria-label={`Remove ${a.subject}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!atMax && (
        <div className="flex flex-col gap-2 rounded-md border border-stone-200 p-3">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPendingSubject("");
            }}
            placeholder="Search AP subjects…"
            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-small text-stone-900 placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          />

          {query && filteredSubjects.length > 0 && !pendingSubject && (
            <ul className="max-h-40 overflow-y-auto rounded-md border border-stone-200">
              {filteredSubjects.slice(0, 12).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSubject(s);
                      setQuery(s);
                    }}
                    className="w-full px-3 py-1.5 text-left text-small text-stone-900 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pendingSubject && (
            <div className="flex items-center gap-3">
              <span className="flex-1 text-small text-stone-700">{pendingSubject}</span>
              <span className="text-caption text-stone-500">Score</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPendingScore(n)}
                    className={cn(
                      "h-7 w-7 rounded text-small font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
                      pendingScore === n
                        ? "bg-ink-700 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:bg-ink-50",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={addExam}
                className="rounded-md bg-ink-700 px-3 py-1.5 text-small font-semibold text-white hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {atMax && (
        <p className="text-small text-stone-500">Maximum 8 AP exams — remove one to swap.</p>
      )}
    </div>
  );
}

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

      <ApSection
        apScores={draft.apScores}
        onChange={(scores) => onChange({ apScores: scores })}
      />
    </div>
  );
}
