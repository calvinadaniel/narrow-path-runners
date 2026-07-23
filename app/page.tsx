import Image from "next/image";
import Link from "next/link";
import { getAllRaces } from "@/lib/races";
import { getAllRunnerProfiles } from "@/lib/runners";
import { getAboutContent } from "@/lib/about";
import StravaCta from "@/components/StravaCta";

export default function HomePage() {
  const races = getAllRaces().slice(0, 3);
  const runners = getAllRunnerProfiles().slice(0, 4);
  // first paragraph of about, strip markdown heading
  const aboutBlurb = getAboutContent()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .slice(0, 1)
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  return (
    <>
      <section
        id="hero"
        className="px-4 sm:px-6 py-12 sm:py-24 text-center max-w-3xl mx-auto"
      >
        <div className="hero-content">
          <Image
            src="/logo.png"
            alt="Narrow Path Runners logo"
            width={320}
            height={257}
            className="mx-auto h-auto w-[min(280px,70vw)]"
            priority
          />
          <h1 className="page-title text-2xl sm:text-4xl md:text-5xl mt-8 sm:mt-10 uppercase tracking-tight leading-[1.05] px-1">
            Find your run with the pack.
          </h1>
          <Link
            href="#events"
            className="runs-btn inline-block mt-6 sm:mt-8 bg-brand-red text-white font-black text-sm px-6 sm:px-8 py-3 tracking-wider hover:bg-brand-orange transition-colors"
          >
            UPCOMING RUNS
          </Link>
        </div>
      </section>

      <main className="px-4 sm:px-6 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <div className="content-grid grid gap-8 sm:gap-10 sm:grid-cols-3">
          <div id="who-we-are" className="info-block text-left scroll-mt-24">
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-green pb-2">
              Who We Are
            </h2>
            <p className="text-sm font-normal text-brand-ink/70 leading-relaxed mb-4">
              {aboutBlurb ||
                "A NYC running club built on community, consistency, and showing up for each other — rain or shine."}
            </p>
            <Link href="/about" className="page-link text-sm font-black">
              [Read more]
            </Link>
          </div>

          <div id="team" className="info-block text-left scroll-mt-24">
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-orange pb-2">
              Our Team
            </h2>
            <ul className="text-sm font-normal text-brand-ink/70 space-y-1 mb-4">
              {runners.map((r) => (
                <li key={r.id}>
                  <Link href={`/roster/${r.id}`} className="page-link font-bold">
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/roster" className="page-link text-sm font-black">
              [Full roster]
            </Link>
          </div>

          <div id="events" className="info-block text-left scroll-mt-24">
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-red pb-2">
              Events Calendar
            </h2>
            <ul className="text-sm font-normal text-brand-ink/70 space-y-2 mb-4">
              {races.map((race) => (
                <li key={race.id}>
                  <Link
                    href={`/results/${race.id}`}
                    className="page-link font-bold"
                  >
                    {race.name}
                  </Link>
                  <p className="text-xs text-brand-ink/40">
                    {race.date} · {race.distance}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/results" className="page-link text-sm font-black">
              [All events]
            </Link>
          </div>
        </div>

        <section id="join" className="mt-16 text-center scroll-mt-24">
          <h2 className="page-title text-xl mb-4">Join the Pack</h2>
          <StravaCta />
        </section>
      </main>
    </>
  );
}
