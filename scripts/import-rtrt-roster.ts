/**
 * Build content/marathon-2026.json by scanning the whole RTRT field for
 * runners whose team is Narrow Path Runners. The tracker has no team filter,
 * so this pages through every profile and matches on the `team` field.
 *
 * Usage:
 *   npx tsx scripts/import-rtrt-roster.ts [teamText]
 */
import fs from "fs";
import path from "path";
import type { MarathonRoster, MarathonRosterEntry } from "../lib/types";
import { fetchProfilesPage, makeToken, RTRT_EVENT } from "../lib/rtrt";
import { runnerIdFromName } from "./import-nyrr-helpers";

const TEAM_MATCH = (process.argv[2] ?? "narrow path runners").toLowerCase();
const PAGE_SIZE = 500;
const OUT = path.join(process.cwd(), "content", "marathon-2026.json");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const token = makeToken();
  const found = new Map<string, MarathonRosterEntry>();
  const teamNames = new Set<string>();
  let start = 1;
  let total = Infinity;

  while (start <= total) {
    const page = await fetchProfilesPage(start, PAGE_SIZE, token);
    total = page.total;
    if (!page.profiles.length) break;

    for (const p of page.profiles) {
      if (!p.team || !p.team.toLowerCase().includes(TEAM_MATCH)) continue;
      teamNames.add(p.team);
      found.set(p.pid, {
        pid: p.pid,
        bib: p.bib_display ? String(p.bib_display) : p.bib,
        name: p.name,
        runnerId: runnerIdFromName(p.fname, p.lname),
      });
    }

    process.stdout.write(`\r${page.last}/${total} scanned, ${found.size} found`);
    // Advance by what the API actually returned, in case it caps `max`.
    start = page.last + 1;
    await sleep(150);
  }
  console.log();

  if (found.size === 0) {
    console.error(`No runners matched team text "${TEAM_MATCH}". Nothing written.`);
    process.exit(1);
  }

  const roster: MarathonRoster = {
    event: RTRT_EVENT,
    updated: new Date().toISOString().slice(0, 10),
    runners: [...found.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
  fs.writeFileSync(OUT, JSON.stringify(roster, null, 2) + "\n");

  console.log(`Team names matched: ${[...teamNames].join(" | ")}`);
  console.log(`Wrote ${roster.runners.length} runners → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
