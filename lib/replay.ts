import { pointMiles, type Course } from "./course";
import type { RtrtSplit } from "./rtrt";
import type { MarathonRunnerStatus } from "./types";

/** [clock time (epoch seconds), miles along the course, RTRT label, average pace] */
export type Mark = [number, number, string, string];

export interface ReplayRunner {
  pid: string;
  name: string;
  bib?: string;
  /** Timing-mat crossings in time order; the first is the start mat. */
  marks: Mark[];
}

export interface Replay {
  event: string;
  runners: ReplayRunner[];
}

/**
 * Compact a runner's raw splits into time-ordered marks on the course. Mats we
 * can't place on the course are dropped, and so is any reading that would put
 * the runner behind where they already were.
 */
export function buildMarks(splits: RtrtSplit[], course: Course): Mark[] {
  const placed = splits
    .map((s) => ({ s, epoch: Number(s.epochTime), miles: pointMiles(course, s.point) }))
    .filter((p) => Number.isFinite(p.epoch) && p.miles !== undefined)
    .sort((a, b) => a.epoch - b.epoch);

  const marks: Mark[] = [];
  for (const { s, epoch, miles } of placed) {
    const prev = marks[marks.length - 1];
    if (prev && miles! < prev[1]) continue;
    marks.push([Math.round(epoch), Math.round(miles! * 1000) / 1000, s.label ?? s.point, s.paceAvg ?? ""]);
  }
  return marks;
}

export function buildReplay(
  event: string,
  runners: { pid: string; name: string; bib?: string }[],
  splits: RtrtSplit[],
  course: Course
): Replay {
  return {
    event,
    runners: runners.map((r) => ({
      pid: r.pid,
      name: r.name,
      bib: r.bib,
      marks: buildMarks(
        splits.filter((s) => s.pid === r.pid),
        course
      ),
    })),
  };
}

/** 4521 seconds -> "1:15:21" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Epoch seconds -> "12:30:00 PM EST" in New York time. */
export function formatClock(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

/**
 * Where a runner was at a moment in the race. Between two mats the runner is
 * placed by their share of the elapsed time, so dots glide instead of jumping.
 */
export function statusAt(
  runner: ReplayRunner,
  t: number,
  course: Course
): MarathonRunnerStatus {
  const base = { pid: runner.pid, bib: runner.bib, name: runner.name };
  const { marks } = runner;
  if (marks.length === 0 || t < marks[0][0]) {
    return { ...base, state: "not_started" };
  }

  const startEpoch = marks[0][0];
  const last = marks[marks.length - 1];
  if (t >= last[0]) {
    if (last[1] >= course.miles - 0.01) {
      return {
        ...base,
        state: "finished",
        netTime: formatDuration(last[0] - startEpoch),
        paceAvg: last[3] || undefined,
        percentComplete: 100,
      };
    }
    // Their last reading: still out there, with no later mat to place them.
    return running(base, last[1], last[2], last[3], t - startEpoch, course);
  }

  // Latest mat at or before t.
  let lo = 0;
  let hi = marks.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (marks[mid][0] <= t) lo = mid;
    else hi = mid;
  }
  const [e0, m0, label, pace] = marks[lo];
  const [e1, m1] = marks[lo + 1];
  const miles = m0 + (m1 - m0) * ((t - e0) / (e1 - e0));
  return running(base, miles, label, pace, t - startEpoch, course);
}

function running(
  base: { pid: string; bib?: string; name: string },
  miles: number,
  label: string,
  pace: string,
  elapsed: number,
  course: Course
): MarathonRunnerStatus {
  return {
    ...base,
    state: "running",
    miles,
    lastLabel: label,
    netTime: formatDuration(elapsed),
    paceAvg: pace || undefined,
    percentComplete: Math.min(100, (miles / course.miles) * 100),
  };
}
