import fs from "fs";
import path from "path";
import { fetchRunnerStatuses } from "./rtrt";
import type { MarathonRoster, MarathonSnapshot } from "./types";

const ROSTER_FILE = path.join(process.cwd(), "content", "marathon-2026.json");

export function getMarathonRoster(): MarathonRoster {
  const raw = fs.readFileSync(ROSTER_FILE, "utf-8");
  const roster = JSON.parse(raw) as MarathonRoster;
  return {
    ...roster,
    runners: [...roster.runners].sort((a, b) => a.name.localeCompare(b.name)),
  };
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
