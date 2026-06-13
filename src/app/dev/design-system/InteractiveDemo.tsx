"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { RadioCardGroup } from "@/components/ui/RadioCardGroup";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { StepProgress } from "@/components/ui/StepProgress";

const majorGroups = [
  {
    label: "STEM",
    options: [
      { value: "computer-science", label: "Computer Science" },
      { value: "engineering", label: "Engineering" },
      { value: "mathematics", label: "Mathematics" },
    ],
  },
  {
    label: "Business & Social Sciences",
    options: [
      { value: "business", label: "Business" },
      { value: "economics", label: "Economics" },
      { value: "psychology", label: "Psychology" },
    ],
  },
];

export function InteractiveDemo() {
  const [gpaScale, setGpaScale] = useState("4.0");
  const [aidLevel, setAidLevel] = useState("partial");
  const [majors, setMajors] = useState<string[]>(["computer-science"]);
  const [budget, setBudget] = useState(45000);
  const [step, setStep] = useState(2);

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-xl">
        <StepProgress current={step} total={5} label="Direction" />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="text-small text-ink-600 hover:underline"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(5, s + 1))}
            className="text-small text-ink-600 hover:underline"
          >
            Continue
          </button>
        </div>
      </div>

      <div className="max-w-xl">
        <SegmentedControl
          label="GPA scale"
          options={[
            { value: "4.0", label: "4.0" },
            { value: "5.0-uz", label: "5.0 (Uzbekistan)" },
            { value: "percentage", label: "Percentage" },
          ]}
          value={gpaScale}
          onChange={setGpaScale}
          hint={`Selected: ${gpaScale}`}
        />
      </div>

      <div className="max-w-xl">
        <Slider
          label="What can your family realistically pay per year?"
          min={5000}
          max={100000}
          step={1000}
          value={budget}
          onChange={setBudget}
          formatValue={(v) => (v >= 100000 ? "$100,000+ / year" : `$${v.toLocaleString("en-US")} / year`)}
          anchors={[
            { value: 5000, label: "$5k" },
            { value: 20000, label: "$20k" },
            { value: 40000, label: "$40k" },
            { value: 60000, label: "$60k" },
            { value: 80000, label: "$80k" },
            { value: 100000, label: "$100k+" },
          ]}
        />
      </div>

      <div className="max-w-xl">
        <RadioCardGroup
          label="Financial aid need"
          name="aid-level-demo"
          value={aidLevel}
          onChange={setAidLevel}
          options={[
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
          ]}
        />
      </div>

      <div className="max-w-xl">
        <SearchableMultiSelect
          label="What do you want to study? (up to 3)"
          groups={majorGroups}
          value={majors}
          onChange={setMajors}
          max={3}
          searchPlaceholder="Search majors…"
          hint="Not sure yet? Pick your best guesses — you can change this anytime."
        />
      </div>

      <Card title="Live state" className="max-w-xl">
        <pre className="overflow-x-auto text-small text-stone-700">
          {JSON.stringify({ step, gpaScale, budget, aidLevel, majors }, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
