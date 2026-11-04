import { describe, it, expect } from "vitest";
import { raceHistory } from "./raceHistory";
import type { Race } from "./types";

const race = (id: string, name: string, date: string, distance: string, results: [string, string][]): Race => ({
  id,
  name,
  date,
  location: "New York City",
  distance,
  photos: [],
  results: results.map(([runnerId, time], i) => ({
    runnerId,
    runnerName: runnerId,
    time,
    placement: i + 1,
  })),
});

const races: Race[] = [
  race("a", "2026 NYRR Al Gordon 5K", "2026-02-28", "5K", [["ann", "30:09"], ["bob", "25:00"]]),
  race("b", "2026 United Airlines NYC Half", "2026-03-15", "Half Marathon", [["ann", "1:55:10"]]),
  race("c", "2025 Jersey City 5K", "2025-10-05", "5K", [["ann", "29:00"]]),
  race("d", "2026 TCS New York City Marathon", "2026-11-01", "Marathon", [["ann", "4:10:00"], ["bob", "3:50:00"]]),
  race("e", "2026 Mastercard New York Mini 10K", "2026-06-06", "10K", [["bob", "50:00"]]),
];

describe("raceHistory", () => {
  const out = raceHistory(races, ["ann", "bob", "cy"], { year: 2026, excludeDate: "2026-11-01" });

  it("lists a runner's races from the year, newest first", () => {
    expect(out.ann.map((r) => r.raceId)).toEqual(["b", "a"]);
    expect(out.bob.map((r) => r.raceId)).toEqual(["e", "a"]);
  });

  it("leaves out other years and the excluded race day", () => {
    expect(out.ann.some((r) => r.raceId === "c")).toBe(false);
    expect(out.ann.some((r) => r.raceId === "d")).toBe(false);
  });

  it("keeps the time and distance and drops the year from the name", () => {
    expect(out.ann[1]).toEqual({
      raceId: "a",
      name: "NYRR Al Gordon 5K",
      date: "2026-02-28",
      distance: "5K",
      time: "30:09",
    });
  });

  it("gives every requested runner a list, even with no races", () => {
    expect(out.cy).toEqual([]);
  });

  it("includes the excluded day when nothing is excluded", () => {
    const all = raceHistory(races, ["ann"], { year: 2026 });
    expect(all.ann.map((r) => r.raceId)).toEqual(["d", "b", "a"]);
  });
});
