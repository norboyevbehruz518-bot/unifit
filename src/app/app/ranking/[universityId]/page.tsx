import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getNearbyCompetitors, getRank } from "@/lib/ranking/getRank";
import { getLatestSnapshots } from "@/lib/data/snapshots";
import { getUniversitiesByIds } from "@/lib/data/universities";
import { getProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = await params;
  return { title: `Applicant ranking — UniFit` };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const [profileWithMeta, snapshots, universities] = await Promise.all([
    getProfile(supabase, userData.user.id),
    getLatestSnapshots(supabase, userData.user.id, [universityId]),
    getUniversitiesByIds(supabase, [universityId]),
  ]);

  const snapshot = snapshots.get(universityId);
  const university = universities[0];
  if (!snapshot || !university) redirect("/app/results");

  const academicFit = snapshot.result.academicFit;
  const studentName = profileWithMeta?.profile.fullName ?? "You";
  const firstName = studentName.split(" ")[0] ?? studentName;

  // Get rank first, then fetch nearby competitors using the real rank
  const rankData = await getRank(universityId, academicFit);
  const rank = rankData?.rank ?? 1;
  const total = rankData?.total ?? 0;

  const { competitors, actualAbove } = await getNearbyCompetitors(universityId, rank, 5);

  // Stitch student row into the competitor list at the correct position
  type DisplayRow =
    | { kind: "competitor"; rank: number; name: string; academicFit: number }
    | { kind: "student"; rank: number; name: string; academicFit: number };

  const rows: DisplayRow[] = [];
  for (let i = 0; i < competitors.length; i++) {
    if (i === actualAbove) {
      rows.push({ kind: "student", rank, name: firstName, academicFit });
    }
    rows.push({
      kind: "competitor",
      rank: competitors[i]!.rank,
      name: competitors[i]!.name,
      academicFit: competitors[i]!.academicFit,
    });
  }
  // Edge case: student is at or past the end (near bottom of board)
  if (actualAbove >= competitors.length) {
    rows.push({ kind: "student", rank, name: firstName, academicFit });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex flex-col gap-1">
        <Link
          href="/app/results"
          className="w-fit text-small font-medium text-stone-500 hover:text-stone-700"
        >
          ← Results
        </Link>
        <h1 className="text-h1 font-semibold text-stone-900">{university.name}</h1>
        <p className="text-body text-stone-500">Applicant ranking</p>
      </div>

      {/* Hero card */}
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        {rankData ? (
          <>
            <span className="tnum text-[3.5rem] font-bold leading-none text-stone-900">
              #{rank.toLocaleString()}
            </span>
            <p className="text-body text-stone-500">
              of {total.toLocaleString()} students targeting this university
            </p>
            <p className="mt-2 text-small text-stone-400">
              Your academic score:{" "}
              <span className="font-semibold text-stone-700">{Math.round(academicFit)}</span>
            </p>
          </>
        ) : (
          <p className="text-body text-stone-500">Ranking data unavailable</p>
        )}
      </Card>

      {/* Competitor table */}
      {rows.length > 0 && (
        <Card padding="md" className="overflow-x-auto p-0">
          <table className="w-full min-w-[18rem]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-4 py-3 text-left text-caption font-medium text-stone-400">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-caption font-medium text-stone-400">
                  Name
                </th>
                <th className="px-4 py-3 text-right text-caption font-medium text-stone-400">
                  Academic score
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isStudent = row.kind === "student";
                return (
                  <tr
                    key={i}
                    className={
                      isStudent
                        ? "bg-ink-50"
                        : i > 0
                          ? "border-t border-stone-100 hover:bg-stone-50"
                          : "hover:bg-stone-50"
                    }
                  >
                    <td
                      className={`px-4 py-3 text-small tnum ${
                        isStudent
                          ? "border-t border-ink-100 font-semibold text-ink-700"
                          : "text-stone-400"
                      }`}
                    >
                      {row.rank}
                    </td>
                    <td
                      className={`px-4 py-3 text-small ${
                        isStudent
                          ? "border-t border-ink-100 font-semibold text-ink-800"
                          : "text-stone-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {row.name}
                        {isStudent && <Badge tone="ink">You</Badge>}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-small tnum ${
                        isStudent
                          ? "border-t border-ink-100 font-semibold text-ink-700"
                          : "text-stone-700"
                      }`}
                    >
                      {Math.round(row.academicFit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-center text-caption text-stone-400">
        Rankings compare your academic fit score against virtual applicant profiles.
      </p>
    </div>
  );
}
