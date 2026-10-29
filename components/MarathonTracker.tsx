"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  MarathonRosterEntry,
  MarathonRunnerStatus,
  MarathonSnapshot,
} from "@/lib/types";

const POLL_MS = 30_000;

const ORDER = { running: 0, finished: 1, not_started: 2 } as const;

export function sortStatuses(
  statuses: MarathonRunnerStatus[]
): MarathonRunnerStatus[] {
  return [...statuses].sort((a, b) => {
    if (a.state !== b.state) return ORDER[a.state] - ORDER[b.state];
    if (a.state === "running") {
      return (b.percentComplete ?? 0) - (a.percentComplete ?? 0);
    }
    if (a.state === "finished") {
      return (a.netTime ?? "").localeCompare(b.netTime ?? "", undefined, {
        numeric: true,
      });
    }
    return a.name.localeCompare(b.name);
  });
}

function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatStart(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function StatusLine({ s }: { s: MarathonRunnerStatus }) {
  if (s.state === "finished") {
    return (
      <p className="text-sm font-black text-brand-green">
        Finished · {s.netTime}
      </p>
    );
  }
  if (s.state === "running") {
    return (
      <div className="text-sm space-y-0.5">
        <p className="font-black text-brand-red">
          {s.lastLabel} · {s.netTime}
        </p>
        <p className="text-brand-ink/60">
          {s.paceAvg ? `Avg ${s.paceAvg}` : null}
          {s.projectedFinish
            ? `${s.paceAvg ? " · " : ""}Projected ${s.projectedFinish}`
            : null}
        </p>
      </div>
    );
  }
  return (
    <p className="text-sm text-brand-ink/60">
      {s.waveStart ? `Starts ${formatStart(s.waveStart)}` : "Not started"}
      {s.countdownSeconds
        ? ` · in ${formatCountdown(s.countdownSeconds)}`
        : null}
    </p>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-2 rounded-full bg-brand-ink/10 overflow-hidden mt-2"
      role="progressbar"
      aria-label="Race progress"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full bg-brand-red" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default function MarathonTracker({
  roster,
  profileIds,
}: {
  roster: MarathonRosterEntry[];
  /** runnerIds that have a profile page to link to. */
  profileIds: string[];
}) {
  const [snapshot, setSnapshot] = useState<MarathonSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (roster.length === 0) return;
    let cancelled = false;

    async function load() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/marathon");
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as MarathonSnapshot;
        if (!cancelled) {
          setSnapshot(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [roster.length]);

  if (roster.length === 0) {
    return (
      <p className="card-vintage p-4 text-sm">
        We haven&apos;t confirmed who&apos;s running yet. Check back soon.
      </p>
    );
  }

  const linkable = new Set(profileIds);
  const statuses = snapshot ? sortStatuses(snapshot.runners) : null;
  const items: (MarathonRunnerStatus | MarathonRosterEntry)[] =
    statuses ?? roster;

  return (
    <div>
      <p className="text-sm text-brand-ink/60 mb-4" aria-live="polite">
        {failed && !snapshot
          ? "Live tracking is unavailable right now. We'll keep trying."
          : snapshot
            ? `Updated ${new Date(snapshot.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}${snapshot.stale || failed ? " · showing last good update" : ""}`
            : "Loading live results…"}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const entry = roster.find((r) => r.pid === item.pid);
          const status = "state" in item ? item : null;
          const runnerId = entry?.runnerId;
          return (
            <li key={item.pid} className="card-vintage p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-black text-lg break-words">
                  {runnerId && linkable.has(runnerId) ? (
                    <Link href={`/roster/${runnerId}`} className="page-link">
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </h2>
                {item.bib ? (
                  <span className="text-xs text-brand-ink/50 shrink-0">
                    Bib {item.bib}
                  </span>
                ) : null}
              </div>
              {status ? (
                <>
                  <StatusLine s={status} />
                  {status.state === "running" &&
                  status.percentComplete !== undefined ? (
                    <ProgressBar percent={status.percentComplete} />
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
