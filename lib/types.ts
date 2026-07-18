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

export interface RunnerProfile {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  races: RunnerRaceEntry[];
}
