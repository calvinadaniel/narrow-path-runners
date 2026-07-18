import { describe, it, expect } from "vitest";
import { getAllRaces, getRaceById } from "./races";

describe("getAllRaces", () => {
  it("returns races sorted by date descending", () => {
    const races = getAllRaces();
    expect(races.length).toBeGreaterThanOrEqual(2);
    expect(races[0].id).toBe("2026-07-04-firecracker-10k");
    expect(races[1].id).toBe("2026-06-14-summit-trail-5k");
  });
});

describe("getRaceById", () => {
  it("returns the matching race", () => {
    const race = getRaceById("2026-06-14-summit-trail-5k");
    expect(race?.name).toBe("Summit Trail 5K");
  });

  it("returns undefined for an unknown id", () => {
    expect(getRaceById("does-not-exist")).toBeUndefined();
  });
});
