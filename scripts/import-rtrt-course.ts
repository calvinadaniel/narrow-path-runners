/**
 * Save the marathon course (route line and timing points) from RTRT into
 * content/marathon-course.json so the map doesn't depend on RTRT's map call.
 *
 * Usage:
 *   npx tsx scripts/import-rtrt-course.ts
 */
import fs from "fs";
import path from "path";
import { fetchCourse } from "../lib/rtrt";

const OUT = path.join(process.cwd(), "content", "marathon-course.json");

async function main() {
  const course = await fetchCourse();
  fs.writeFileSync(OUT, JSON.stringify(course) + "\n");
  console.log(
    `Wrote ${course.line.length} line points and ${course.points.length} timing points ` +
      `(${course.miles} mi) → ${OUT}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
