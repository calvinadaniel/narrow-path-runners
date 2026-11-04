import type { RaceEntry } from "@/lib/raceHistory";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-03-15" -> "Mar 15", without going through a time zone. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** A runner's other races of the year: date, race, distance and finish time. */
export default function RunnerRaces({ races }: { races: RaceEntry[] }) {
  if (races.length === 0) {
    return (
      <p className="text-xs text-brand-ink/50 mt-3 pt-3 border-t border-brand-ink/10">
        No other 2026 NYRR races on record
      </p>
    );
  }
  return (
    <details className="mt-3 pt-3 border-t border-brand-ink/10">
      <summary className="cursor-pointer text-sm font-black">
        Other 2026 NYRR races ({races.length})
      </summary>
      <ul className="mt-3 space-y-2">
        {races.map((r) => (
          <li key={r.raceId} className="flex items-baseline justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="break-words">{r.name}</p>
              <p className="text-xs text-brand-ink/50">
                {shortDate(r.date)} · {r.distance}
              </p>
            </div>
            <span className="font-black tabular-nums shrink-0">{r.time}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
