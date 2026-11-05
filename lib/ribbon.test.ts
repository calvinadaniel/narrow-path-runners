import { describe, it, expect } from "vitest";
import { boroughSegments, routeShape } from "./ribbon";
import type { Basemap } from "./basemap";
import type { Course } from "./course";

// A 10 mile course running north along one longitude.
const course: Course = {
  event: "TEST",
  miles: 10,
  line: [
    [40.0, -74.0, 0],
    [40.2, -74.0, 10],
  ],
  points: [],
};

const box = (name: string, south: number, north: number) => ({
  name,
  rings: [
    [
      [south, -74.05],
      [south, -73.95],
      [north, -73.95],
      [north, -74.05],
    ] as [number, number][],
  ],
  label: { lat: (south + north) / 2, lng: -74, angle: 0 },
});

const basemap = (boroughs: ReturnType<typeof box>[]): Basemap => ({
  window: { south: 39.9, west: -74.1, north: 40.3, east: -73.9 },
  land: [],
  boroughs,
  parks: [],
  attribution: "",
});

describe("boroughSegments", () => {
  it("splits the course where it crosses from one borough into the next", () => {
    const segs = boroughSegments(course, basemap([box("A", 39.9, 40.1), box("B", 40.1, 40.3)]));
    expect(segs.map((s) => s.borough)).toEqual(["A", "B"]);
    expect(segs[0].from).toBe(0);
    expect(segs[0].to).toBeCloseTo(5, 0);
    expect(segs[1].from).toBeCloseTo(5, 0);
    expect(segs[1].to).toBe(10);
  });

  it("lets a borough appear twice when the course returns to it", () => {
    const segs = boroughSegments(
      course,
      basemap([box("A", 39.9, 40.06), box("B", 40.06, 40.14), box("A", 40.14, 40.3)])
    );
    expect(segs.map((s) => s.borough)).toEqual(["A", "B", "A"]);
  });

  it("joins a stretch shorter than the minimum to the one before it", () => {
    // B is only 0.01 degrees (about 0.5 mile on this 10 mile course) wide, so a 1 mile minimum absorbs it
    const segs = boroughSegments(
      course,
      basemap([box("A", 39.9, 40.09), box("B", 40.09, 40.1), box("C", 40.1, 40.3)]),
      0.1,
      1
    );
    expect(segs.map((s) => s.borough)).toEqual(["A", "C"]);
  });

  it("gives a point over water the nearest borough", () => {
    // a gap between the boroughs, like a river
    const segs = boroughSegments(course, basemap([box("A", 39.9, 40.09), box("B", 40.11, 40.3)]));
    expect(segs.map((s) => s.borough)).toEqual(["A", "B"]);
  });

  it("covers the whole course with no gaps", () => {
    const segs = boroughSegments(course, basemap([box("A", 39.9, 40.1), box("B", 40.1, 40.3)]));
    for (let i = 1; i < segs.length; i++) expect(segs[i].from).toBeCloseTo(segs[i - 1].to, 5);
    expect(segs[segs.length - 1].to).toBe(10);
  });
});

describe("routeShape", () => {
  // heads north and drifts east, like the real course
  const drift: Course = {
    ...course,
    line: [
      [40.0, -74.0, 0],
      [40.1, -73.97, 5],
      [40.2, -73.9, 10],
    ],
  };
  const shape = routeShape(drift, 100, 6);

  it("draws one move then lines, with the start at the bottom and the end at the top", () => {
    expect(shape.d).toMatch(/^M[\d.]+ [\d.]+( L[\d.]+ [\d.]+)+$/);
    expect(shape.start.y).toBeGreaterThan(shape.end.y);
  });

  it("fits the box and leaves padding around it", () => {
    const [x, y, w, h] = shape.viewBox.split(" ").map(Number);
    expect(x).toBe(-6);
    expect(y).toBe(-6);
    expect(w).toBeCloseTo(112);
    expect(h).toBeGreaterThan(112); // a north-south course is taller than wide
  });
});
