import Link from "next/link";
import { getAllRaces } from "@/lib/races";
import { getGroupRunPhotos } from "@/lib/gallery";
import PhotoGrid from "@/components/PhotoGrid";

export default function GalleryPage() {
  const races = getAllRaces().filter((race) => race.photos.length > 0);
  const groupRunPhotos = getGroupRunPhotos();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <h1 className="page-title text-2xl sm:text-3xl mb-6">Gallery</h1>

      <section>
        <h2 className="text-xl font-black text-brand-green mb-4">Group Runs</h2>
        <PhotoGrid photos={groupRunPhotos} />
      </section>

      {races.map((race) => (
        <section key={race.id}>
          <h2 className="text-xl font-black text-brand-green mb-4">
            <Link href={`/results/${race.id}`} className="page-link">
              {race.name}
            </Link>
          </h2>
          <PhotoGrid photos={race.photos} />
        </section>
      ))}
    </main>
  );
}
