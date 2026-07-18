import type { RacePhoto } from "@/lib/types";

export default function PhotoGrid({ photos }: { photos: RacePhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-gray-600">No photos yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.caption ?? ""}
          className="rounded aspect-square object-cover"
        />
      ))}
    </div>
  );
}
