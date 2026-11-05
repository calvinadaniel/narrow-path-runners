import Link from "next/link";
import MarathonHeader from "@/components/MarathonHeader";
import MarathonTracker from "@/components/MarathonTracker";
import { getMarathonCourse, getMarathonRoster, getNycBasemap } from "@/lib/marathon";
import { getRaceHistory } from "@/lib/raceHistory";

export const metadata = {
  title: "NYC Marathon Tracker — Narrow Path Runners",
  description:
    "Follow Narrow Path Runners live in the TCS New York City Marathon.",
};

export default function MarathonPage() {
  const roster = getMarathonRoster();
  const course = getMarathonCourse();
  const basemap = getNycBasemap();
  const raceHistory = getRaceHistory(
    roster.runners.flatMap((r) => (r.runnerId ? [r.runnerId] : []))
  );
  return (
    <>
      <MarathonHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="page-title text-2xl sm:text-3xl">Narrow Path Runners</h1>
        <p className="text-sm text-brand-ink/60 mt-1">
          Live tracking · updates every 30 seconds
        </p>
        <p className="text-sm font-black mt-2 mb-6">
          <Link href="/marathon/replay" className="page-link">
            Watch the full race replay →
          </Link>
        </p>
        <MarathonTracker
          roster={roster.runners}
          profileIds={[]}
          course={course}
          basemap={basemap}
          raceHistory={raceHistory}
        />
      </main>
    </>
  );
}
