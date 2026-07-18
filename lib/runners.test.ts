import { describe, it, expect } from "vitest";
import { getAllRunnerProfiles, getRunnerProfile } from "./runners";

describe("getAllRunnerProfiles", () => {
  it("merges a runner's bio with their aggregated race results", () => {
    const profiles = getAllRunnerProfiles();
    const jane = profiles.find((p) => p.id === "jane-doe");
    expect(jane?.bio).toContain("Narrow Path Runners");
    expect(jane?.races.length).toBe(2);
  });

  it("includes runners who have results but no bio file", () => {
    const profiles = getAllRunnerProfiles();
    const sam = profiles.find((p) => p.id === "sam-lee");
    expect(sam?.name).toBe("Sam Lee");
    expect(sam?.bio).toBeUndefined();
    expect(sam?.races.length).toBe(2);
  });
});

describe("getRunnerProfile", () => {
  it("returns undefined for an unknown runner", () => {
    expect(getRunnerProfile("nobody")).toBeUndefined();
  });
});
