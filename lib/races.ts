import fs from "fs";
import path from "path";
import type { Race } from "./types";

const RACES_DIR = path.join(process.cwd(), "content", "races");

export function getAllRaces(): Race[] {
  const files = fs.readdirSync(RACES_DIR).filter((f) => f.endsWith(".json"));
  const races = files.map((file) => {
    const raw = fs.readFileSync(path.join(RACES_DIR, file), "utf-8");
    return JSON.parse(raw) as Race;
  });
  return races.sort((a, b) => b.date.localeCompare(a.date));
}

export function getRaceById(id: string): Race | undefined {
  return getAllRaces().find((race) => race.id === id);
}
