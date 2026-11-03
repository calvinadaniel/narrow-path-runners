import { notFound } from "next/navigation";
import MarathonHeader from "@/components/MarathonHeader";
import MarathonReplay from "@/components/MarathonReplay";
import { getMarathonCourse, getMarathonReplay, getNycBasemap } from "@/lib/marathon";

export const metadata = {
  title: "Race Replay — Narrow Path Runners",
  description:
    "Replay where Narrow Path Runners were on the NYC Marathon course, rebuilt from official split times.",
};

// 12:30 pm to 1:00 pm on race day, Sunday Nov 1 2026. Daylight saving had
// ended that morning, so New York was on EST (UTC-5).
const FROM = Date.UTC(2026, 10, 1, 17, 30) / 1000;
const TO = FROM + 30 * 60;

export default function ReplayPage() {
  const course = getMarathonCourse();
  const replay = getMarathonReplay();
  const basemap = getNycBasemap();
  if (!course || !replay) notFound();

  return (
    <>
      <MarathonHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="page-title text-2xl sm:text-3xl">Race Replay</h1>
        <p className="text-sm text-brand-ink/60 mt-1 mb-6">
          12:30 to 1:00 pm, rebuilt from official split times. Between timing mats, runners are
          placed at an even pace, so positions are estimates.
        </p>
        <MarathonReplay course={course} replay={replay} from={FROM} to={TO} basemap={basemap} />
      </main>
    </>
  );
}
