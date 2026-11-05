import Link from "next/link";
import { notFound } from "next/navigation";
import MarathonHeader from "@/components/MarathonHeader";
import MarathonReplay from "@/components/MarathonReplay";
import { getMarathonCourse, getMarathonReplay, getNycBasemap } from "@/lib/marathon";
import { replayWindow } from "@/lib/replay";

export const metadata = {
  title: "Race Replay — Narrow Path Runners",
  description:
    "Replay where Narrow Path Runners were on the NYC Marathon course through the whole race, rebuilt from official split times.",
};

export default function ReplayPage() {
  const course = getMarathonCourse();
  const replay = getMarathonReplay();
  const basemap = getNycBasemap();
  if (!course || !replay) notFound();
  const { from, to } = replayWindow(replay);

  return (
    <>
      <MarathonHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <p className="text-sm font-black mb-3">
          <Link href="/marathon" className="page-link">
            ← Back to the tracker
          </Link>
        </p>
        <h1 className="page-title text-2xl sm:text-3xl">Race Replay</h1>
        <p className="text-sm text-brand-ink/60 mt-1 mb-6">
          The whole race, from the first member over the start to the last finisher, rebuilt from
          official split times. Between timing mats, runners are placed at an even pace, so
          positions are estimates.
        </p>
        <MarathonReplay course={course} replay={replay} from={from} to={to} basemap={basemap} />
      </main>
    </>
  );
}
