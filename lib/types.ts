export interface RaceResult {
  runnerId: string;
  runnerName: string;
  time: string;
  placement: number | null;
  personalRecord?: boolean;
}

export interface RacePhoto {
  url: string;
  caption?: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  distance: string;
  results: RaceResult[];
  photos: RacePhoto[];
}

export interface RunnerBio {
  id: string;
  name: string;
  photo?: string;
  bio: string;
}

export interface RunnerRaceEntry {
  race: Race;
  result: RaceResult;
}

export interface MarathonRosterEntry {
  pid: string;
  bib?: string;
  name: string;
  runnerId?: string;
}

export interface MarathonRoster {
  event: string;
  updated: string | null;
  runners: MarathonRosterEntry[];
}

export type MarathonRunnerState = "not_started" | "running" | "finished";

export interface MarathonRunnerStatus {
  pid: string;
  bib?: string;
  name: string;
  state: MarathonRunnerState;
  /** Epoch seconds of this runner's wave start, if known. */
  waveStart?: number;
  countdownSeconds?: number;
  lastPoint?: string;
  lastLabel?: string;
  /** Elapsed net time at the last point (or the finish), like "1:56:17". */
  netTime?: string;
  paceAvg?: string;
  percentComplete?: number;
  miles?: number;
  projectedFinish?: string;
  projectedClock?: string;
  /** Estimated next checkpoint, e.g. point "14M" at "2:04:12" / "11:52 am". */
  nextPoint?: string;
  nextElapsed?: string;
  nextClock?: string;
}

export interface MarathonSnapshot {
  fetchedAt: number;
  stale?: boolean;
  runners: MarathonRunnerStatus[];
}

export interface RunnerProfile {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  races: RunnerRaceEntry[];
}
