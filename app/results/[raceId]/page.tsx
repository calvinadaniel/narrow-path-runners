import { notFound } from "next/navigation";
import { getAllRaces, getRaceById } from "@/lib/races";
import ResultsTable from "@/components/ResultsTable";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ raceId: race.id }));
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;
  const race = getRaceById(raceId);
  if (!race) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="page-title text-2xl sm:text-3xl font-bold break-words">
        {race.name}
      </h1>
      <p className="text-brand-ink/50 mb-6 text-sm sm:text-base break-words">
        {race.date} · {race.location} · {race.distance}
      </p>
      <ResultsTable results={race.results} />
      {race.photos.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {race.photos.map((photo) => (
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.caption ?? race.name}
              className="rounded-xl border-2 border-brand-ink/10 w-full h-auto"
            />
          ))}
        </div>
      )}    </main>
  );
}
