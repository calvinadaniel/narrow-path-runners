import Link from "next/link";
import { getAllRaces } from "@/lib/races";

export default function ResultsIndexPage() {
  const races = getAllRaces();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="page-title text-3xl mb-6">Race Results</h1>
      <ul className="space-y-4">
        {races.map((race) => (
          <li key={race.id} className="card-vintage p-4">
            <Link href={`/results/${race.id}`} className="page-link text-xl font-black">
              {race.name}
            </Link>
            <p className="text-sm text-brand-ink/50 mt-1">
              {race.date} · {race.location} · {race.distance}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
