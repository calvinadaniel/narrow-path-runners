/**
 * Import Narrow Path Runners finishers from NYRR into content/races/*.json
 *
 * Usage:
 *   npx tsx scripts/import-nyrr.ts <eventCode> [teamName]
 *   npx tsx scripts/import-nyrr.ts all [year...] [teamName]
 *
 * Examples:
 *   npx tsx scripts/import-nyrr.ts M2025
 *   npx tsx scripts/import-nyrr.ts all
 *   npx tsx scripts/import-nyrr.ts all 2025 2026
 */
import fs from "fs";
import path from "path";
import type { Race, RaceResult } from "../lib/types";
import {
  cleanVenue,
  formatDistance,
  formatNyrrTime,
  runnerIdFromName,
  slugify,
} from "./import-nyrr-helpers";

const API = "https://rmsprodapi.nyrr.org/api/v2";
const PAGE_SIZE = 50;
const DEFAULT_TEAM = "Narrow Path Runners";
const DEFAULT_YEARS = [2025, 2026];
const OUT_DIR = path.join(process.cwd(), "content", "races");

type NyrrFinisher = {
  firstName: string;
  lastName: string;
  overallTime: string;
  overallPlace: number;
};

type NyrrEventSummary = {
  eventName: string;
  eventCode: string;
  startDateTime: string;
  distanceName: string;
  distanceUnitCode: string;
  venue: string;
};

type NyrrEventDetails = { eventDetails: NyrrEventSummary | null };

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: "https://results.nyrr.org",
      Referer: "https://results.nyrr.org/",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${url} → ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function teamFinisherCount(
  eventCode: string,
  teamName: string
): Promise<number> {
  const data = await post<{ totalItems: number }>(
    `${API}/runners/finishers-filter`,
    { eventCode, pageIndex: 1, pageSize: 1, teamName }
  );
  return data.totalItems ?? 0;
}

async function fetchAllFinishers(
  eventCode: string,
  teamName: string
): Promise<NyrrFinisher[]> {
  const items: NyrrFinisher[] = [];
  let pageIndex = 1;
  let total = Infinity;

  while (items.length < total) {
    const data = await post<{ totalItems: number; items: NyrrFinisher[] }>(
      `${API}/runners/finishers-filter`,
      { eventCode, pageIndex, pageSize: PAGE_SIZE, teamName }
    );
    total = data.totalItems;
    if (!data.items.length) break;
    items.push(...data.items);
    pageIndex += 1;
    await sleep(150);
  }

  return items;
}

async function listEventsForYear(year: number): Promise<NyrrEventSummary[]> {
  const items: NyrrEventSummary[] = [];
  let pageIndex = 1;
  let total = Infinity;
  while (items.length < total) {
    const data = await post<{ totalItems: number; items: NyrrEventSummary[] }>(
      `${API}/events/search`,
      { year, pageIndex, pageSize: 50 }
    );
    total = data.totalItems;
    if (!data.items?.length) break;
    items.push(...data.items);
    pageIndex += 1;
    await sleep(100);
  }
  return items;
}

function writeRace(event: NyrrEventSummary, finishers: NyrrFinisher[]): string {
  const date = event.startDateTime.slice(0, 10);
  const id = `${date}-${slugify(event.eventName)}`;
  const results: RaceResult[] = finishers
    .map((f) => ({
      runnerId: runnerIdFromName(f.firstName, f.lastName),
      runnerName: `${f.firstName} ${f.lastName}`,
      time: formatNyrrTime(f.overallTime),
      placement: f.overallPlace ?? null,
    }))
    .sort((a, b) => (a.placement ?? Infinity) - (b.placement ?? Infinity));

  const race: Race = {
    id,
    name: event.eventName,
    date,
    location: cleanVenue(event.venue || ""),
    distance: formatDistance(event.distanceUnitCode, event.distanceName),
    results,
    photos: [],
  };

  const outPath = path.join(OUT_DIR, `${id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(race, null, 2) + "\n");
  return outPath;
}

async function importEvent(eventCode: string, teamName: string) {
  console.log(`Fetching event ${eventCode}…`);
  const { eventDetails } = await post<NyrrEventDetails>(
    `${API}/events/details`,
    { eventCode }
  );
  if (!eventDetails) {
    console.error(`No event details for ${eventCode}`);
    process.exit(1);
  }

  console.log(`Fetching "${teamName}" finishers…`);
  const finishers = await fetchAllFinishers(eventCode, teamName);
  if (finishers.length === 0) {
    console.error(`No finishers for "${teamName}" in ${eventCode}.`);
    process.exit(1);
  }

  const outPath = writeRace(eventDetails, finishers);
  console.log(`Wrote ${finishers.length} results → ${outPath}`);
}

async function importAll(years: number[], teamName: string) {
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const year of years) {
    console.log(`\n=== ${year}: listing events ===`);
    const events = await listEventsForYear(year);
    console.log(`${events.length} events`);

    for (const event of events) {
      process.stdout.write(`  ${event.eventCode} ${event.eventName}… `);
      try {
        const count = await teamFinisherCount(event.eventCode, teamName);
        if (count === 0) {
          console.log("0");
          skipped.push(event.eventCode);
          await sleep(80);
          continue;
        }
        console.log(`${count} NPR — importing`);
        const finishers = await fetchAllFinishers(event.eventCode, teamName);
        // details may be richer; fall back to search summary
        const { eventDetails } = await post<NyrrEventDetails>(
          `${API}/events/details`,
          { eventCode: event.eventCode }
        );
        const meta = eventDetails ?? event;
        const outPath = writeRace(meta, finishers);
        console.log(`    → ${finishers.length} @ ${path.basename(outPath)}`);
        imported.push(event.eventCode);
        await sleep(150);
      } catch (err) {
        console.log(`error: ${(err as Error).message}`);
        await sleep(300);
      }
    }
  }

  console.log(
    `\nDone. Imported ${imported.length} races: ${imported.join(", ") || "(none)"}`
  );
  console.log(`Skipped ${skipped.length} with 0 NPR finishers.`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage:\n  npx tsx scripts/import-nyrr.ts <eventCode> [teamName]\n  npx tsx scripts/import-nyrr.ts all [year...] "
    );
    process.exit(1);
  }

  if (arg === "all") {
    const rest = process.argv.slice(3);
    const years = rest.filter((a) => /^\d{4}$/.test(a)).map(Number);
    const teamName =
      rest.find((a) => !/^\d{4}$/.test(a)) ?? DEFAULT_TEAM;
    await importAll(years.length ? years : DEFAULT_YEARS, teamName);
    return;
  }

  const teamName = process.argv[3] ?? DEFAULT_TEAM;
  await importEvent(arg, teamName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
