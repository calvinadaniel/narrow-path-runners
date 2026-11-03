import { describe, it, expect } from "vitest";
import {
  parseCourse,
  positionAt,
  pointMiles,
  milesFor,
  makeProjection,
  linePath,
  clusterDots,
  type Course,
} from "./course";
import type { MarathonRunnerStatus } from "./types";

// A short fake course: 10 miles, heading north then east.
const course: Course = {
  event: "TEST",
  miles: 10,
  line: [
    [40.0, -74.0, 0],
    [40.1, -74.0, 5],
    [40.1, -73.9, 10],
  ],
  points: [
    { name: "5M", label: "5mi", miles: 5, lat: 40.1, lng: -74.0 },
    { name: "HALF", label: "Half", miles: 6.55, lat: 40.1, lng: -73.97 },
  ],
};

const runner = (over: Partial<MarathonRunnerStatus>): MarathonRunnerStatus => ({
  pid: "A",
  name: "Ann",
  state: "running",
  ...over,
});

describe("parseCourse", () => {
  const raw = {
    list: [
      {
        layers: {
          courses: [
            {
              miles: 26.2187575,
              polymap: [
                { lat: 40.601871, lng: -74.061352, distance: { mi: 0 } },
                { lat: 40.61, lng: -74.05, distance: { mi: 1.0000004 } },
              ],
              timingPoints: [
                { name: "3M", label: "4.8K/3mi", miles: 3, loc: { lat: 40.626198, lng: -74.026877 } },
              ],
            },
          ],
        },
      },
    ],
  };

  it("keeps the route line and timing points, rounded", () => {
    const c = parseCourse("NYRR-NY2026", raw);
    expect(c.miles).toBe(26.218758);
    expect(c.line).toEqual([
      [40.601871, -74.061352, 0],
      [40.61, -74.05, 1],
    ]);
    expect(c.points).toEqual([
      { name: "3M", label: "4.8K/3mi", miles: 3, lat: 40.626198, lng: -74.026877 },
    ]);
  });

  it("rejects a response with no course line", () => {
    expect(() => parseCourse("X", { list: [] })).toThrow(/no course line/);
  });
});

describe("positionAt", () => {
  it("interpolates between route points by distance", () => {
    expect(positionAt(course, 2.5)).toEqual({ lat: 40.05, lng: -74.0 });
    expect(positionAt(course, 7.5).lat).toBeCloseTo(40.1);
    expect(positionAt(course, 7.5).lng).toBeCloseTo(-73.95);
  });

  it("clamps to the start and the finish", () => {
    expect(positionAt(course, -3)).toEqual({ lat: 40.0, lng: -74.0 });
    expect(positionAt(course, 99)).toEqual({ lat: 40.1, lng: -73.9 });
  });

  it("returns the exact vertex at a vertex distance", () => {
    expect(positionAt(course, 5)).toEqual({ lat: 40.1, lng: -74.0 });
  });
});

describe("pointMiles and milesFor", () => {
  it("looks up timing points, with start and finish built in", () => {
    expect(pointMiles(course, "HALF")).toBe(6.55);
    expect(pointMiles(course, "START")).toBe(0);
    expect(pointMiles(course, "FINISH")).toBe(10);
    expect(pointMiles(course, "NOPE")).toBeUndefined();
    expect(pointMiles(course, undefined)).toBeUndefined();
  });

  it("puts finished runners at the finish and unstarted at the start", () => {
    expect(milesFor(runner({ state: "finished" }), course)).toBe(10);
    expect(milesFor(runner({ state: "not_started" }), course)).toBe(0);
  });

  it("prefers RTRT's estimate, then the last mat, clamped to the course", () => {
    expect(milesFor(runner({ miles: 7.2, lastPoint: "5M" }), course)).toBe(7.2);
    expect(milesFor(runner({ lastPoint: "5M" }), course)).toBe(5);
    expect(milesFor(runner({ miles: 40 }), course)).toBe(10);
    expect(milesFor(runner({}), course)).toBe(0);
  });
});

describe("makeProjection and linePath", () => {
  const proj = makeProjection(course, 600, 800, 50);

  it("fits the course inside the padded box", () => {
    for (const [lat, lng] of course.line) {
      const { x, y } = proj.project(lat, lng);
      expect(x).toBeGreaterThanOrEqual(50 - 0.001);
      expect(x).toBeLessThanOrEqual(550 + 0.001);
      expect(y).toBeGreaterThanOrEqual(50 - 0.001);
      expect(y).toBeLessThanOrEqual(750 + 0.001);
    }
  });

  it("puts north at the top and east to the right", () => {
    const south = proj.project(40.0, -74.0);
    const north = proj.project(40.1, -74.0);
    const east = proj.project(40.1, -73.9);
    expect(north.y).toBeLessThan(south.y);
    expect(east.x).toBeGreaterThan(north.x);
  });

  it("maps a screen point back to the same place", () => {
    const { x, y } = proj.project(40.07, -73.95);
    const back = proj.unproject(x, y);
    expect(back.lat).toBeCloseTo(40.07, 6);
    expect(back.lng).toBeCloseTo(-73.95, 6);
  });

  it("keeps a margin of surroundings around the route", () => {
    const wide = makeProjection(course, 600, 800, 50, { lat: 0.05, lng: 0.05 });
    const edge = wide.project(40.0, -74.0);
    const tight = proj.project(40.0, -74.0);
    expect(edge.y).toBeLessThan(tight.y); // the route shrank toward the middle
    expect(wide.project(40.1, -73.9).x).toBeLessThan(proj.project(40.1, -73.9).x);
  });

  it("draws one move then lines", () => {
    expect(linePath(course, proj)).toMatch(/^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+$/);
  });
});

describe("clusterDots", () => {
  const dot = (id: string, x: number, y: number) => ({ id, x, y, item: id });

  it("groups nearby dots and leaves distant ones alone", () => {
    const clusters = clusterDots([dot("a", 0, 0), dot("b", 5, 0), dot("c", 100, 0)], 10);
    expect(clusters.map((c) => c.members.map((m) => m.id))).toEqual([["a", "b"], ["c"]]);
  });

  it("always merges dots at the same spot, however far we zoom", () => {
    const clusters = clusterDots([dot("a", 7, 7), dot("b", 7, 7), dot("c", 7, 7)], 0.01);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].members).toHaveLength(3);
  });

  it("moves a cluster to the middle of its members", () => {
    const [c] = clusterDots([dot("a", 0, 0), dot("b", 6, 0)], 10);
    expect(c.x).toBe(3);
  });
});
