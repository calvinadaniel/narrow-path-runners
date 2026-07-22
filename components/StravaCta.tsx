import Image from "next/image";
import { stravaClubUrl } from "@/lib/site";

export default function StravaCta({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <a
        href={stravaClubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-brand-orange text-white font-black text-xs px-4 py-2 tracking-wider hover:bg-brand-red transition-colors"
      >
        Follow on Strava
      </a>
    );
  }

  return (
    <a
      href={stravaClubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-lg mx-auto rounded-xl overflow-hidden border-2 border-brand-ink/10 hover:border-brand-orange transition-colors shadow-md"
    >
      <Image
        src="/strava-banner.png"
        alt="Join Narrow Path Runners on Strava"
        width={1200}
        height={630}
        className="w-full h-auto"
      />
    </a>
  );
}
