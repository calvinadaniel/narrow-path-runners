import fs from "fs";
import path from "path";
import type { Basemap } from "./basemap";
import type { Course } from "./course";
import type { Replay } from "./replay";
import { fetchRunnerStatuses } from "./rtrt";
import type { MarathonRoster, MarathonSnapshot } from "./types";

const ROSTER_FILE = path.join(process.cwd(), "content", "marathon-2026.json");
const COURSE_FILE = path.join(process.cwd(), "content", "marathon-course.json");
const BASEMAP_FILE = path.join(process.cwd(), "content", "nyc-basemap.json");
const REPLAY_FILE = path.join(process.cwd(), "content", "marathon-replay-2026.json");

export function getMarathonRoster(): MarathonRoster {
  const raw = fs.readFileSync(ROSTER_FILE, "utf-8");
  const roster = JSON.parse(raw) as MarathonRoster;
  return {
    ...roster,
    runners: [...roster.runners].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** The saved course for the map, or undefined if it hasn't been imported. */
export function getMarathonCourse(): Course | undefined {
  if (!fs.existsSync(COURSE_FILE)) return undefined;
  return JSON.parse(fs.readFileSync(COURSE_FILE, "utf-8")) as Course;
}

/** The saved New York base map, or undefined if it hasn't been built. */
export function getNycBasemap(): Basemap | undefined {
  if (!fs.existsSync(BASEMAP_FILE)) return undefined;
  return JSON.parse(fs.readFileSync(BASEMAP_FILE, "utf-8")) as Basemap;
}

/** Saved split times for the race replay, or undefined if not imported. */
export function getMarathonReplay(): Replay | undefined {
  if (!fs.existsSync(REPLAY_FILE)) return undefined;
  return JSON.parse(fs.readFileSync(REPLAY_FILE, "utf-8")) as Replay;
}

/** Fresh enough to serve without asking RTRT again. */
const FRESH_MS = 25_000;
let cached: MarathonSnapshot | null = null;

/**
 * Live status for the whole club. Keeps one in-memory copy so a crowd of
 * viewers shares a single upstream call; on failure it serves the last good
 * copy flagged `stale` rather than erroring.
 */
export async function getMarathonSnapshot(): Promise<MarathonSnapshot> {
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) return cached;
  try {
    const { runners } = getMarathonRoster();
    const statuses = await fetchRunnerStatuses(runners);
    cached = { fetchedAt: Date.now(), runners: statuses };
    return cached;
  } catch (err) {
    if (cached) return { ...cached, stale: true };
    throw err;
  }
}
