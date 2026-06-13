import { RadioCardGroup } from "@/components/ui/RadioCardGroup";
import type { ProfileRubric } from "@/types/domain";
import type { StepProps } from "./Step1Academics";

interface RubricQuestion {
  key: keyof ProfileRubric;
  question: string;
  options: { label: string; description: string }[];
}

const RUBRIC_QUESTIONS: RubricQuestion[] = [
  {
    key: "leadership",
    question:
      "What's the highest level of responsibility you've taken on in any activity — club, team, project, job, or volunteering?",
    options: [
      {
        label: "Not yet",
        description: "No organized activities so far — completely normal this early on.",
      },
      {
        label: "Active member or participant",
        description: "e.g. member of a club, sports team, or volunteer group.",
      },
      {
        label: "Officer, captain, or organizer",
        description: "e.g. club officer, team captain, or you organized a one-off event.",
      },
      {
        label: "Founder, president, or team lead",
        description: "e.g. you started something or led a group with real responsibility for others.",
      },
    ],
  },
  {
    key: "awards",
    question:
      "What's the highest level you've placed or won at — a competition, olympiad, or award?",
    options: [
      {
        label: "None yet",
        description: "Plenty of strong applicants are in the same boat.",
      },
      {
        label: "School level",
        description: "e.g. won or placed in a school competition, contest, or award.",
      },
      {
        label: "Regional or national-qualifier level",
        description: "e.g. placed at a regional olympiad or qualified for a national round.",
      },
      {
        label: "National level",
        description: "e.g. placed in a national competition or republic olympiad.",
      },
      {
        label: "International level",
        description: "e.g. placed in an international olympiad or competition.",
      },
    ],
  },
  {
    key: "commitment",
    question:
      "How long have you stuck with your single longest-running activity outside of class?",
    options: [
      { label: "Less than 1 year", description: "Still getting started — that's fine." },
      { label: "1–2 years", description: "A steady run with one activity." },
      { label: "2–3 years", description: "A real, sustained commitment." },
      {
        label: "3+ years",
        description: "Long-term persistence in one thing says a lot to admissions readers.",
      },
    ],
  },
  {
    key: "focus",
    question: "How do your activities connect to what you want to study?",
    options: [
      {
        label: "Few activities, not related to my major",
        description: "Having any activities at all still counts for something.",
      },
      {
        label: "Several different things, none deeply connected",
        description: "A well-rounded mix, even without a clear theme yet.",
      },
      {
        label: "Active in several areas, at least one connects",
        description: "Some of what you do already points toward your major.",
      },
      {
        label: "Mostly one area, directly tied to my major",
        description: "A clear \"spike\" — most of your time goes into one connected area.",
      },
    ],
  },
];

export function Step4ProfileStrength({ draft, onChange }: StepProps) {
  function setLevel(key: keyof ProfileRubric, level: number) {
    onChange({ rubric: { ...draft.rubric, [key]: level } });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold text-stone-900">Profile strength</h2>
        <p className="mt-1 text-small text-stone-500">
          Four quick questions about your activities and experience. There&apos;s no wrong answer —
          this just helps us read your record the way an admissions officer would.
        </p>
      </div>

      {RUBRIC_QUESTIONS.map((q) => (
        <RadioCardGroup
          key={q.key}
          label={q.question}
          name={`rubric-${q.key}`}
          value={String(draft.rubric[q.key])}
          onChange={(value) => setLevel(q.key, Number(value))}
          options={q.options.map((o, level) => ({
            value: String(level),
            label: o.label,
            description: o.description,
          }))}
        />
      ))}
    </div>
  );
}
