import { describe, it, expect } from "vitest";
import { getAllRunnerProfiles, getRunnerProfile } from "./runners";

describe("getAllRunnerProfiles", () => {
  it("aggregates runners from race results", () => {
    const profiles = getAllRunnerProfiles();
    expect(profiles.length).toBeGreaterThan(10);
    const calvin = profiles.find((p) => p.id === "calvin-daniel");
    expect(calvin?.name).toBe("Calvin Daniel");
    expect(calvin!.races.length).toBeGreaterThanOrEqual(1);
  });

  it("sorts profiles by name", () => {
    const profiles = getAllRunnerProfiles();
    const names = profiles.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("getRunnerProfile", () => {
  it("returns undefined for an unknown runner", () => {
    expect(getRunnerProfile("nobody")).toBeUndefined();
  });
});
