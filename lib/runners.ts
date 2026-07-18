import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllRaces } from "./races";
import type { RunnerBio, RunnerProfile } from "./types";

const RUNNERS_DIR = path.join(process.cwd(), "content", "runners");

export function getAllRunnerBios(): RunnerBio[] {
  if (!fs.existsSync(RUNNERS_DIR)) return [];
  const files = fs.readdirSync(RUNNERS_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(RUNNERS_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      id: data.id as string,
      name: data.name as string,
      photo: data.photo as string | undefined,
      bio: content.trim(),
    };
  });
}

export function getRunnerBio(id: string): RunnerBio | undefined {
  return getAllRunnerBios().find((bio) => bio.id === id);
}

export function getAllRunnerProfiles(): RunnerProfile[] {
  const races = getAllRaces();
  const bios = getAllRunnerBios();
  const profileMap = new Map<string, RunnerProfile>();

  for (const bio of bios) {
    profileMap.set(bio.id, {
      id: bio.id,
      name: bio.name,
      photo: bio.photo,
      bio: bio.bio,
      races: [],
    });
  }

  for (const race of races) {
    for (const result of race.results) {
      const existing = profileMap.get(result.runnerId);
      if (existing) {
        existing.races.push({ race, result });
      } else {
        profileMap.set(result.runnerId, {
          id: result.runnerId,
          name: result.runnerName,
          races: [{ race, result }],
        });
      }
    }
  }

  return Array.from(profileMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getRunnerProfile(id: string): RunnerProfile | undefined {
  return getAllRunnerProfiles().find((profile) => profile.id === id);
}
