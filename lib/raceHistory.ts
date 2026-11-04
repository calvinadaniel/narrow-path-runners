import { getAllRaces } from "./races";
import type { Race } from "./types";

/** Race day of the 2026 TCS NYC Marathon. The cards list the races around it. */
export const MARATHON_DATE = "2026-11-01";

export interface RaceEntry {
  raceId: string;
  name: string;
  date: string;
  distance: string;
  time: string;
}

/**
 * Each runner's results from one year's races, newest first. Pass `excludeDate`
 * to leave out a race day, such as the marathon the cards sit beside.
 */
export function raceHistory(
  races: Race[],
  runnerIds: string[],
  opts: { year: number; excludeDate?: string }
): Record<string, RaceEntry[]> {
  const wanted = new Set(runnerIds);
  const out: Record<string, RaceEntry[]> = Object.fromEntries(runnerIds.map((id) => [id, []]));
  const prefix = `${opts.year}-`;

  for (const race of races) {
    if (!race.date.startsWith(prefix) || race.date === opts.excludeDate) continue;
    for (const result of race.results) {
      if (!wanted.has(result.runnerId)) continue;
      out[result.runnerId].push({
        raceId: race.id,
        // "2026 NYRR Al Gordon 5K" reads better as "NYRR Al Gordon 5K" under a 2026 heading.
        name: race.name.replace(new RegExp(`^${opts.year}\\s+`), ""),
        date: race.date,
        distance: race.distance,
        time: result.time,
      });
    }
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
  }
  return out;
}

/** The saved 2026 results for these runners, other than the marathon itself. */
export function getRaceHistory(runnerIds: string[]): Record<string, RaceEntry[]> {
  return raceHistory(getAllRaces(), runnerIds, { year: 2026, excludeDate: MARATHON_DATE });
}
