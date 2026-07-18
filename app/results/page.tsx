import Link from "next/link";
import { getAllRaces } from "@/lib/races";

export default function ResultsIndexPage() {
  const races = getAllRaces();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Race Results</h1>
      <ul className="space-y-4">
        {races.map((race) => (
          <li key={race.id}>
            <Link href={`/results/${race.id}`} className="text-xl hover:underline">
              {race.name}
            </Link>
            <p className="text-sm text-gray-600">
              {race.date} · {race.location} · {race.distance}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
