/**
 * Save every runner's timing-mat crossings from RTRT into
 * content/marathon-replay-2026.json so the replay page can rebuild where each
 * member was at any moment of the race. Needs content/marathon-course.json
 * (npm run import-rtrt-course) and content/marathon-2026.json first.
 *
 * Usage:
 *   npx tsx scripts/import-rtrt-replay.ts
 */
import fs from "fs";
import path from "path";
import type { Course } from "../lib/course";
import { pointMiles } from "../lib/course";
import { getMarathonRoster } from "../lib/marathon";
import { buildReplay } from "../lib/replay";
import { fetchSplits, RTRT_EVENT } from "../lib/rtrt";

const COURSE = path.join(process.cwd(), "content", "marathon-course.json");
const OUT = path.join(process.cwd(), "content", "marathon-replay-2026.json");

async function main() {
  const course = JSON.parse(fs.readFileSync(COURSE, "utf-8")) as Course;
  const { runners } = getMarathonRoster();

  const splits = await fetchSplits(runners.map((r) => r.pid));
  const unplaced = new Set(
    splits.filter((s) => pointMiles(course, s.point) === undefined).map((s) => s.point)
  );
  if (unplaced.size) {
    console.warn(`Mats not found on the course (skipped): ${[...unplaced].join(", ")}`);
  }

  const replay = buildReplay(RTRT_EVENT, runners, splits, course);
  fs.writeFileSync(OUT, JSON.stringify(replay) + "\n");

  const withMarks = replay.runners.filter((r) => r.marks.length > 0).length;
  const total = replay.runners.reduce((n, r) => n + r.marks.length, 0);
  console.log(
    `${splits.length} splits → ${total} marks for ${withMarks}/${runners.length} runners → ${OUT}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
