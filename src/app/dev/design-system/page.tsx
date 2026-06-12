import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Select } from "@/components/ui/Select";

export const metadata = { title: "Design System — UniFit" };

const inkSwatches = [
  ["ink-50", "bg-ink-50"],
  ["ink-100", "bg-ink-100"],
  ["ink-300", "bg-ink-300"],
  ["ink-600", "bg-ink-600"],
  ["ink-700", "bg-ink-700"],
  ["ink-900", "bg-ink-900"],
] as const;

const categorySwatches = [
  ["reach-100", "bg-reach-100"],
  ["reach-600", "bg-reach-600"],
  ["reach-700", "bg-reach-700"],
  ["target-100", "bg-target-100"],
  ["target-600", "bg-target-600"],
  ["target-700", "bg-target-700"],
  ["safety-100", "bg-safety-100"],
  ["safety-600", "bg-safety-600"],
  ["safety-700", "bg-safety-700"],
] as const;

const neutralSwatches = [
  ["stone-50", "bg-stone-50"],
  ["stone-100", "bg-stone-100"],
  ["stone-200", "bg-stone-200"],
  ["stone-300", "bg-stone-300"],
  ["stone-500", "bg-stone-500"],
  ["stone-700", "bg-stone-700"],
  ["stone-900", "bg-stone-900"],
] as const;

const sampleMajors = [
  { value: "cs", label: "Computer Science" },
  { value: "business", label: "Business" },
  { value: "engineering", label: "Engineering" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-stone-200 pb-2 text-h2 font-semibold text-stone-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-16 lg:px-12">
      <header>
        <h1 className="text-display font-semibold text-ink-900">
          UniFit Design System
        </h1>
        <p className="mt-3 max-w-prose text-body text-stone-500">
          Living style guide. Brand rule: a calm advisor — one accent, warm
          neutrals, generous space, and category colors that are never red.
        </p>
      </header>

      <Section title="Color tokens">
        <div className="flex flex-col gap-6">
          {(
            [
              ["Ink (accent)", inkSwatches],
              ["Categories: Reach / Target / Safety", categorySwatches],
              ["Neutrals (stone)", neutralSwatches],
            ] as const
          ).map(([group, swatches]) => (
            <div key={group}>
              <h3 className="mb-3 text-h3 font-semibold text-stone-700">
                {group}
              </h3>
              <div className="flex flex-wrap gap-3">
                {swatches.map(([name, cls]) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className={`h-14 w-20 rounded-md border border-stone-200 ${cls}`}
                    />
                    <span className="text-caption text-stone-500">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <div className="flex flex-col gap-4">
          <p className="text-display font-semibold">Display 36 — one message per page</p>
          <p className="text-h1 font-semibold">Heading 1 — 30px page titles</p>
          <p className="text-h2 font-semibold">Heading 2 — 22px section heads</p>
          <p className="text-h3 font-semibold">Heading 3 — 17px card titles</p>
          <p className="max-w-prose text-body">
            Body 16px / 1.6 — the default voice. Generous line-height is what
            makes long explanations feel calm instead of dense. Most of what a
            student reads is set in this style.
          </p>
          <p className="text-small text-stone-500">
            Small 14px — secondary information, hints, metadata.
          </p>
          <p className="text-caption font-medium tracking-wide text-stone-500 uppercase">
            Caption 12.5px — labels and badges
          </p>
          <p className="tnum text-body">
            Tabular numbers: 1380 / 1450 / 62 — columns never wobble.
          </p>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg">
              Large primary
            </Button>
            <Button variant="secondary" size="lg">
              Large secondary
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled>
              Disabled primary
            </Button>
            <Button variant="secondary" disabled>
              Disabled secondary
            </Button>
            <Button variant="ghost" disabled>
              Disabled ghost
            </Button>
          </div>
          <p className="text-small text-stone-500">
            Tab to any button to see the shared ink focus ring.
          </p>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid max-w-xl grid-cols-1 gap-6">
          <Input label="SAT total" placeholder="e.g. 1380" hint="Optional — leave empty if you haven't taken it yet." />
          <Input
            label="Annual family budget (USD)"
            defaultValue="120000"
            error="That's higher than any US cost of attendance — double-check the number."
          />
          <Input label="Disabled field" placeholder="Not editable" disabled />
        </div>
      </Section>

      <Section title="Select">
        <div className="grid max-w-xl grid-cols-1 gap-6">
          <Select
            label="First-choice major"
            options={sampleMajors}
            placeholder="Choose a major…"
            hint="You can pick up to three, in order of preference."
          />
          <Select
            label="With error"
            options={sampleMajors}
            placeholder="Choose…"
            error="Pick at least one major to continue."
          />
          <Select label="Disabled" options={sampleMajors} disabled />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card title="Card with title">
            <p className="text-body text-stone-700">
              Default padding (24px). Borders over shadows; the one shadow is
              barely there.
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-body text-stone-700">
              Large padding (32px), no title — for hero content.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="reach">Reach</Badge>
          <Badge tone="target">Target</Badge>
          <Badge tone="safety">Safety</Badge>
          <Badge tone="neutral">Medium confidence</Badge>
          <Badge tone="ink">New</Badge>
        </div>
      </Section>

      <Section title="ProgressBar">
        <div className="flex max-w-xl flex-col gap-6">
          <ProgressBar value={33} label="Profile completion" showLabel />
          <ProgressBar value={80} label="Step 4 of 5" showLabel />
          <ProgressBar value={100} label="Done" showLabel />
        </div>
      </Section>

      <Section title="ScoreBar">
        <Card className="max-w-xl">
          <div className="flex flex-col gap-5">
            <ScoreBar label="Academic fit" value={72} display="65–78" />
            <ScoreBar label="Practical fit" value={88} tone="target" />
            <ScoreBar label="Profile fit" value={45} display="38–52" tone="safety" />
            <ScoreBar label="Reach example" value={30} display="24–37" tone="reach" />
          </div>
        </Card>
        <p className="max-w-prose text-small text-stone-500">
          ScoreBar accepts a display string so ranges (&ldquo;65–78&rdquo;) can be shown
          instead of fake-precise points — the honest-uncertainty rule, built
          into the primitive.
        </p>
      </Section>
    </main>
  );
}
