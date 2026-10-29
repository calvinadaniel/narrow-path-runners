/**
 * Client for the RTRT (rtrt.me) API behind the TCS NYC Marathon live tracker.
 * Auth is a public app id plus a random 20-hex token the client makes up.
 * Request and response shapes come from capturing the official tracker.
 */
import { randomBytes } from "crypto";
import type { MarathonRunnerStatus } from "./types";

export const RTRT_API = "https://api.rtrt.me";
export const RTRT_APP_ID = "4d7a9ceb0be65b3cc4948ee9";
export const RTRT_EVENT = "NYRR-NY2026";

/** Pids per splits request; a runner has ~35 splits and the cap is `max`. */
const SPLITS_CHUNK = 20;
const SPLITS_MAX = 2000;

export interface RtrtProfile {
  pid: string;
  bib: string;
  fname: string;
  lname: string;
  name: string;
  team?: string;
  [key: string]: unknown;
}

export interface RtrtSplit {
  pid: string;
  point: string;
  label?: string;
  time?: string;
  netTime?: string;
  epochTime?: string;
  paceAvg?: string;
  etfp?: string;
  etnp?: string;
  isFinish?: string;
  [key: string]: unknown;
}

interface RtrtLoc {
  lpn?: string;
  epc?: string;
  emiles?: string;
  paceAvg?: string;
  closed?: string;
  wavestart?: string;
  pending?: Record<string, { countdown?: string; wavestart?: string }>;
}

interface RtrtResponse<T> {
  list?: T[];
  error?: { type: string; msg: string };
  info?: {
    first?: string;
    last?: string;
    total?: string;
    loc?: Record<string, RtrtLoc>;
  };
}

export class RtrtError extends Error {
  constructor(
    message: string,
    readonly type?: string
  ) {
    super(message);
  }
}

export function makeToken(): string {
  // Uppercase like the tracker's Math.uuid(20,16); RTRT 403s lowercase tokens.
  return randomBytes(10).toString("hex").toUpperCase();
}

/** Registers a token the way the tracker does at startup (GET publicconf). */
async function registerToken(token: string): Promise<void> {
  const qs = new URLSearchParams({
    appid: RTRT_APP_ID,
    token,
    app: "0",
    version: "8.3.0",
    secure: "1",
    tracker_ver: "3",
    web: "1",
  });
  const res = await fetch(`${RTRT_API}/publicconf?${qs}`, {
    headers: { Origin: "https://app.rtrt.me", Referer: "https://app.rtrt.me/" },
    cache: "no-store",
  });
  if (!res.ok) throw new RtrtError(`publicconf → HTTP ${res.status}`);
}

// One registered token per process, reused until RTRT rejects it.
let session: Promise<string> | null = null;

function getSession(): Promise<string> {
  if (!session) {
    const token = makeToken();
    session = registerToken(token).then(
      () => token,
      (err) => {
        session = null;
        throw err;
      }
    );
  }
  return session;
}

async function rtrtPost<T>(
  path: string,
  params: Record<string, string | number>,
  retry = true
): Promise<RtrtResponse<T>> {
  const token = await getSession();
  const body = new URLSearchParams({
    appid: RTRT_APP_ID,
    token,
    source: "webtracker",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  });
  const res = await fetch(`${RTRT_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Origin: "https://app.rtrt.me",
      Referer: "https://app.rtrt.me/",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new RtrtError(`${path} → HTTP ${res.status}`);
  const data = (await res.json()) as RtrtResponse<T>;
  if (data.error?.type === "not_authorized" && retry) {
    session = null; // token expired or was never registered; start over once
    return rtrtPost<T>(path, params, false);
  }
  // "no_results" just means nothing yet (e.g. pre-race); anything else is real.
  if (data.error && data.error.type !== "no_results") {
    throw new RtrtError(`${path} → ${data.error.msg}`, data.error.type);
  }
  return data;
}

/** One page of the whole field. `start` is 1-based. */
export async function fetchProfilesPage(
  start: number,
  max: number
): Promise<{ profiles: RtrtProfile[]; last: number; total: number }> {
  const data = await rtrtPost<RtrtProfile>(
    `/events/${RTRT_EVENT}/profiles`,
    { start, max, total: 1 }
  );
  return {
    profiles: data.list ?? [],
    last: Number(data.info?.last ?? 0),
    total: Number(data.info?.total ?? 0),
  };
}

async function fetchSplitsRaw(pids: string[]) {
  return rtrtPost<RtrtSplit>(
    `/events/${RTRT_EVENT}/profiles/${pids.join(",")}/splits`,
    { max: SPLITS_MAX, loc: 1, etimes: 1, units: "standard" }
  );
}

/** Live status for a set of runners, batching pids and falling back per pid. */
export async function fetchRunnerStatuses(
  runners: { pid: string; bib?: string; name: string }[]
): Promise<MarathonRunnerStatus[]> {
  const byPid = new Map(runners.map((r) => [r.pid, r]));
  const out: MarathonRunnerStatus[] = [];

  for (let i = 0; i < runners.length; i += SPLITS_CHUNK) {
    const chunk = runners.slice(i, i + SPLITS_CHUNK).map((r) => r.pid);
    let responses: RtrtResponse<RtrtSplit>[];
    try {
      responses = [await fetchSplitsRaw(chunk)];
    } catch {
      // The comma batch is only verified for one pid; retry one at a time.
      responses = await Promise.all(chunk.map((p) => fetchSplitsRaw([p])));
    }
    for (const pid of chunk) {
      const r = byPid.get(pid)!;
      out.push(buildStatus(r, responses));
    }
  }
  return out;
}

/** Pick one runner's splits and loc out of one or more responses. */
function buildStatus(
  runner: { pid: string; bib?: string; name: string },
  responses: RtrtResponse<RtrtSplit>[]
): MarathonRunnerStatus {
  const splits = responses.flatMap((r) =>
    (r.list ?? []).filter((s) => s.pid === runner.pid)
  );
  const loc = responses.map((r) => r.info?.loc?.[runner.pid]).find(Boolean);
  return parseRunnerStatus(runner, splits, loc);
}

/** "01:56:17.49" -> "1:56:17". Drops fractions and a leading zero hour digit. */
export function formatElapsed(time: string | undefined): string | undefined {
  if (!time) return undefined;
  const clean = time.split(".")[0].replace(/^0(\d:)/, "$1");
  return clean;
}

/** "14M~02:04:12~11:52 am" -> the point, its elapsed time and clock time. */
export function parseEstimate(
  value: string | undefined
): { point: string; elapsed: string; clock: string } | undefined {
  if (!value) return undefined;
  const [point, elapsed, clock] = value.split("~");
  if (!point || !elapsed) return undefined;
  return { point, elapsed: formatElapsed(elapsed)!, clock: clock ?? "" };
}

/** "FINISH~04:14:01~2:02 pm" -> projected finish elapsed and clock time. */
export function parseProjection(
  etfp: string | undefined
): { elapsed: string; clock: string } | undefined {
  const e = parseEstimate(etfp);
  return e && { elapsed: e.elapsed, clock: e.clock };
}

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseRunnerStatus(
  runner: { pid: string; bib?: string; name: string },
  splits: RtrtSplit[],
  loc: RtrtLoc | undefined
): MarathonRunnerStatus {
  const base = {
    pid: runner.pid,
    bib: runner.bib,
    name: runner.name,
    waveStart: num(loc?.wavestart ?? loc?.pending?.marathon?.wavestart),
  };

  const finish = splits.find((s) => s.isFinish === "1" || s.point === "FINISH");
  // The newest reading wins; list order isn't guaranteed across batched pids.
  const latest = [...splits].sort(
    (a, b) => (num(b.epochTime) ?? 0) - (num(a.epochTime) ?? 0)
  )[0];

  if (finish) {
    return {
      ...base,
      state: "finished",
      lastPoint: "FINISH",
      lastLabel: finish.label ?? "Finish",
      netTime: formatElapsed(finish.netTime ?? finish.time),
      paceAvg: finish.paceAvg ?? loc?.paceAvg,
      percentComplete: 100,
    };
  }

  // Only START logged (or nothing): still at the line / not yet crossing.
  const started = splits.some((s) => s.point !== "START");
  if (!latest || (!started && loc?.pending)) {
    return {
      ...base,
      state: "not_started",
      countdownSeconds: num(loc?.pending?.marathon?.countdown),
    };
  }

  const projection = parseProjection(latest.etfp);
  const next = parseEstimate(latest.etnp);
  return {
    ...base,
    state: "running",
    lastPoint: latest.point,
    lastLabel: latest.label ?? latest.point,
    netTime: formatElapsed(latest.netTime ?? latest.time),
    paceAvg: latest.paceAvg ?? loc?.paceAvg,
    percentComplete: num(loc?.epc),
    miles: num(loc?.emiles),
    projectedFinish: projection?.elapsed,
    projectedClock: projection?.clock,
    nextPoint: next?.point,
    nextElapsed: next?.elapsed,
    nextClock: next?.clock,
  };
}
