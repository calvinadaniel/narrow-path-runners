import Link from "next/link";
import type { RunnerProfile } from "@/lib/types";

export default function RunnerCard({ profile }: { profile: RunnerProfile }) {
  return (
    <Link
      href={`/roster/${profile.id}`}
      className="block p-4 card-vintage"
    >
      <h2 className="font-semibold text-lg">{profile.name}</h2>
      <p className="text-sm text-gray-600">
        {profile.races.length} race{profile.races.length === 1 ? "" : "s"} logged
      </p>
    </Link>
  );
}
