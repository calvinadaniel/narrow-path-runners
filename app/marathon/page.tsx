import MarathonTracker from "@/components/MarathonTracker";
import { getMarathonRoster } from "@/lib/marathon";

export const metadata = {
  title: "NYC Marathon Tracker — Narrow Path Runners",
  description:
    "Follow Narrow Path Runners live in the TCS New York City Marathon.",
};

export default function MarathonPage() {
  const roster = getMarathonRoster();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="page-title text-2xl sm:text-3xl">NYC Marathon</h1>
      <p className="text-sm text-brand-ink/60 mt-1 mb-6">
        TCS New York City Marathon · Sunday, November 1 · updates every 30
        seconds
      </p>
      <MarathonTracker roster={roster.runners} profileIds={[]} />
    </main>
  );
}
