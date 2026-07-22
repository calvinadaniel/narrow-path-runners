import { describe, it, expect } from "vitest";
import { getAllRaces, getRaceById } from "./races";

describe("getAllRaces", () => {
  it("returns races sorted by date descending", () => {
    const races = getAllRaces();
    expect(races.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < races.length; i++) {
      expect(races[i - 1].date >= races[i].date).toBe(true);
    }
  });

  it("includes imported NYRR races", () => {
    const races = getAllRaces();
    expect(races.some((r) => /marathon|half/i.test(r.name))).toBe(true);
  });
});

describe("getRaceById", () => {
  it("returns a matching race", () => {
    const race = getAllRaces()[0];
    expect(getRaceById(race.id)?.name).toBe(race.name);
  });

  it("returns undefined for an unknown id", () => {
    expect(getRaceById("does-not-exist")).toBeUndefined();
  });
});
