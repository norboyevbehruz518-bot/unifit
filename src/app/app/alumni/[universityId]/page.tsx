import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getAlumniForUniversity } from "@/lib/data/alumni";
import { getUniversitiesByIds } from "@/lib/data/universities";
import { createClient } from "@/lib/supabase/server";
import type { Alumni } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = await params;
  return { title: `Alumni — UniFit` };
}

const FLAGS: Record<string, string> = {
  Uzbekistan: "🇺🇿",
};

function countryFlag(country: string): string {
  return FLAGS[country] ?? "🌍";
}

function hasScholarship(scholarship: string | null): boolean {
  return !!scholarship && scholarship.toLowerCase() !== "none";
}

function AlumniCard({ alumni }: { alumni: Alumni }) {
  return (
    <Card>
      {/* Name + flag */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-h3 font-semibold text-stone-900">
            {alumni.fullName}{" "}
            <span aria-label={alumni.country}>{countryFlag(alumni.country)}</span>
          </h3>
          <p className="mt-0.5 text-small text-stone-500">
            {alumni.major} · {alumni.yearAdmitted}
          </p>
        </div>
      </div>

      {/* Scholarship badge */}
      {hasScholarship(alumni.scholarship) && (
        <div className="mt-3">
          <Badge tone="safety">{alumni.scholarship}</Badge>
        </div>
      )}

      {/* Bio */}
      {alumni.bio && (
        <p className="mt-3 text-small italic text-stone-600">&ldquo;{alumni.bio}&rdquo;</p>
      )}

      {/* Extracurriculars */}
      {alumni.extracurriculars.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-caption font-medium uppercase tracking-wide text-stone-400">
            Activities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {alumni.extracurriculars.map((ec) => (
              <span
                key={ec}
                className="rounded-md bg-stone-100 px-2 py-1 text-caption text-stone-700"
              >
                {ec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Honors */}
      {alumni.honors.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-caption font-medium uppercase tracking-wide text-stone-400">
            Honors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {alumni.honors.map((h) => (
              <span
                key={h}
                className="rounded-md bg-stone-100 px-2 py-1 text-caption text-stone-700"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn */}
      {alumni.linkedinUrl && (
        <div className="mt-4">
          <a
            href={`https://${alumni.linkedinUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-small font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            LinkedIn ↗
          </a>
        </div>
      )}
    </Card>
  );
}

export default async function AlumniPage({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const [alumniList, universities] = await Promise.all([
    getAlumniForUniversity(supabase, universityId),
    getUniversitiesByIds(supabase, [universityId]),
  ]);

  const university = universities[0];
  const universityName = university?.name ?? universityId;

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
        <h1 className="text-h1 font-semibold text-stone-900">Alumni at {universityName}</h1>
        <p className="text-body text-stone-500">Students who got in — and what it took</p>
      </div>

      {/* Alumni cards */}
      {alumniList.length === 0 ? (
        <p className="text-body text-stone-500">No alumni listed yet for this university.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {alumniList.map((a) => (
            <AlumniCard key={a.id} alumni={a} />
          ))}
        </div>
      )}
    </div>
  );
}
