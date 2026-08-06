import Image from "next/image";
import Link from "next/link";
import { getAllRaces } from "@/lib/races";

export default function ResultsIndexPage() {
  const races = getAllRaces();
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <h1 className="page-title text-2xl sm:text-3xl">Race Results</h1>
        <Image
          src="/results-sticker.png"
          alt=""
          width={96}
          height={96}
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0"
          aria-hidden
        />
      </div>
      <ul className="space-y-4">
        {races.map((race) => (
          <li key={race.id} className="card-vintage p-4">
            <Link
              href={`/results/${race.id}`}
              className="page-link text-lg sm:text-xl font-black break-words"
            >
              {race.name}
            </Link>
            <p className="text-sm text-brand-ink/50 mt-1 break-words">
              {race.date} · {race.location} · {race.distance}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
