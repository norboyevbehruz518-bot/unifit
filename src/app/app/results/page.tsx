import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionNeededCard } from "@/components/features/results/ActionNeededCard";
import { ListBalanceHero } from "@/components/features/results/ListBalanceHero";
import { RecalculateButton } from "@/components/features/results/RecalculateButton";
import { ResultsList, type CategorizedResult } from "@/components/features/results/ResultsList";
import { analyzeListBalance } from "@/lib/fit-engine";
import { getAlumniUniversityIds } from "@/lib/data/alumni";
import { getOrComputeResults } from "@/lib/results/get-results";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your fit results — UniFit" };

export default async function ResultsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const [view, alumniUniIds] = await Promise.all([
    getOrComputeResults(supabase, userData.user.id),
    getAlumniUniversityIds(supabase),
  ]);
  if (!view) {
    redirect("/app/setup");
  }

  if (view.results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-h1 font-semibold text-stone-900">No universities yet</h1>
        <p className="max-w-md text-body text-stone-500">
          Pick up to 12 universities and we&apos;ll calculate your fit for each one — academics,
          affordability, and how strong your profile is for that school.
        </p>
        <Link
          href="/app/universities"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-600 px-6 text-body font-medium text-white transition-colors hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
        >
          Choose universities
        </Link>
      </div>
    );
  }

  const balance = analyzeListBalance(view.results.map((r) => r.result.category));
  const gated = view.results.filter((r) => r.result.category === null);
  const categorized = view.results.filter(
    (r): r is CategorizedResult => r.result.category !== null,
  );
  const hasLowConfidence = view.results.some((r) => r.result.dataConfidence === "low");

  const fullName = view.profile.fullName?.trim() ?? "";
  const firstName = fullName.split(" ")[0] ?? fullName;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 font-semibold text-stone-900">{firstName}&apos;s fit results</h1>
      <ListBalanceHero balance={balance} />

      {view.needsRecalculate && <RecalculateButton />}

      {hasLowConfidence && (
        <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-small text-stone-600">
          Some of these scores rely on estimated or missing data — treat them as a starting point,
          not a guarantee.
        </p>
      )}

      {categorized.length > 0 && <ResultsList results={categorized} alumniUniversityIds={alumniUniIds} />}

      {gated.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2 font-semibold text-stone-900">Action needed ({gated.length})</h2>
          <div className="flex flex-col gap-3">
            {gated.map(({ university, result }) => (
              <ActionNeededCard key={university.id} university={university} result={result} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
