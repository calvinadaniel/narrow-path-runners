import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllRunnerProfiles, getRunnerProfile } from "@/lib/runners";

export function generateStaticParams() {
  return getAllRunnerProfiles().map((profile) => ({ runnerId: profile.id }));
}

export default async function RunnerProfilePage({
  params,
}: {
  params: Promise<{ runnerId: string }>;
}) {
  const { runnerId } = await params;
  const profile = getRunnerProfile(runnerId);
  if (!profile) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="page-title text-2xl sm:text-3xl break-words">{profile.name}</h1>
      {profile.bio && <div className="mt-4 space-y-4"><MDXRemote source={profile.bio} /></div>}
      <h2 className="text-xl font-black text-brand-green mt-8 mb-4">Race History</h2>
      <ul className="space-y-2">
        {profile.races.map(({ race, result }) => (
          <li key={race.id}>
            <Link href={`/results/${race.id}`} className="page-link font-bold">
              {race.name}
            </Link>{" "}
            — {result.time} (#{result.placement ?? "—"})
            {result.personalRecord && (
              <span className="ml-2 text-xs font-black text-brand-orange">
                PR
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
