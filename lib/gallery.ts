import fs from "fs";
import path from "path";
import type { RacePhoto } from "./types";

const GROUP_RUNS_FILE = path.join(process.cwd(), "content", "gallery", "group-runs.json");

export function getGroupRunPhotos(): RacePhoto[] {
  if (!fs.existsSync(GROUP_RUNS_FILE)) return [];
  const raw = fs.readFileSync(GROUP_RUNS_FILE, "utf-8");
  const data = JSON.parse(raw) as { photos: RacePhoto[] };
  return data.photos;
}
