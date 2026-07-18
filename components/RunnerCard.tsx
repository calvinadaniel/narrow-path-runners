import Link from "next/link";
import type { RunnerProfile } from "@/lib/types";

export default function RunnerCard({ profile }: { profile: RunnerProfile }) {
  return (
    <Link
      href={`/roster/${profile.id}`}
      className="block p-4 rounded border border-brand-forest/20 hover:border-brand-terracotta transition"
    >
      <h2 className="font-semibold text-lg">{profile.name}</h2>
      <p className="text-sm text-gray-600">
        {profile.races.length} race{profile.races.length === 1 ? "" : "s"} logged
      </p>
    </Link>
  );
}
