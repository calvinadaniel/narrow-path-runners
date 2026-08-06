import Image from "next/image";
import Link from "next/link";
import { getAllRaces } from "@/lib/races";
import { getAllRunnerProfiles } from "@/lib/runners";
import { getAboutContent } from "@/lib/about";

const ctaClass =
  "inline-block bg-brand-red text-white font-black text-sm px-5 sm:px-6 py-2.5 tracking-wider hover:bg-brand-orange transition-colors";

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
        className="relative w-full min-h-[min(78vh,720px)] flex items-end sm:items-center justify-center overflow-hidden text-center"
      >
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
          aria-hidden
        />
        {/* soft center wash so the transparent logo reads on the sunset */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(247,243,235,0.72)_0%,rgba(247,243,235,0.28)_42%,transparent_68%)]"
          aria-hidden
        />
        {/* fade into page cream */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent via-brand-cream/70 to-brand-cream"
          aria-hidden
        />
        <div className="hero-content relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
          <Image
            src="/npr-logo.png"
            alt="Narrow Path Runners logo"
            width={320}
            height={333}
            className="mx-auto h-auto w-[min(300px,72vw)] drop-shadow-[0_2px_18px_rgba(247,243,235,0.55)]"
            priority
          />
          <h1 className="page-title text-2xl sm:text-4xl md:text-5xl mt-8 sm:mt-10 uppercase tracking-tight leading-[1.05] px-1">
            Find your run with the pack.
          </h1>
          <Link
            href="/results"
            className={`runs-btn ${ctaClass} mt-6 sm:mt-8`}
          >
            UPCOMING RUNS
          </Link>
        </div>
      </section>

      <main className="px-4 sm:px-6 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <div className="content-grid grid gap-6 sm:gap-8 sm:grid-cols-3 items-stretch">
          <div
            id="who-we-are"
            className="info-block card-vintage flex flex-col h-full p-5 sm:p-6 text-left scroll-mt-24"
          >
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-green pb-2">
              Who We Are
            </h2>
            <p className="text-sm font-normal text-brand-ink/70 leading-relaxed mb-5 flex-1">
              {aboutBlurb ||
                "A NYC running club built on community, consistency, and showing up for each other — rain or shine."}
            </p>
            <Link href="/about" className={`${ctaClass} mt-auto self-start`}>
              ABOUT US
            </Link>
          </div>

          <div
            id="team"
            className="info-block card-vintage flex flex-col h-full p-5 sm:p-6 text-left scroll-mt-24"
          >
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-orange pb-2">
              Our Team
            </h2>
            <ul className="text-sm font-normal text-brand-ink/70 space-y-1 mb-5 flex-1">
              {runners.map((r) => (
                <li key={r.id}>
                  <Link href={`/roster/${r.id}`} className="page-link font-bold">
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/roster" className={`${ctaClass} mt-auto self-start`}>
              FULL ROSTER
            </Link>
          </div>

          <div
            id="events"
            className="info-block card-vintage flex flex-col h-full p-5 sm:p-6 text-left scroll-mt-24"
          >
            <h2 className="page-title text-xl mb-3 border-b-2 border-brand-red pb-2">
              Events Calendar
            </h2>
            <ul className="text-sm font-normal text-brand-ink/70 space-y-2 mb-5 flex-1">
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
            <Link href="/results" className={`${ctaClass} mt-auto self-start`}>
              ALL EVENTS
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
