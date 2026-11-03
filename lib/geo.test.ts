import { describe, it, expect } from "vitest";
import {
  clipRing,
  pointInRing,
  ringArea,
  ringBounds,
  ringCentroid,
  simplifyPath,
  simplifyRing,
  windowsOverlap,
  type Ring,
} from "./geo";

// A 2 x 2 square at lat 0-2, lng 0-2, as [lat, lng].
const square: Ring = [
  [0, 0],
  [0, 2],
  [2, 2],
  [2, 0],
];

describe("ringArea and ringCentroid", () => {
  it("measures a square and finds its middle", () => {
    expect(Math.abs(ringArea(square))).toBe(4);
    expect(ringCentroid(square)).toEqual([1, 1]);
  });
});

describe("simplifyPath", () => {
  it("drops points that sit on the line and keeps real corners", () => {
    const path: [number, number][] = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ];
    expect(simplifyPath(path, 0.01)).toEqual([
      [0, 0],
      [0, 2],
      [1, 2],
    ]);
  });

  it("keeps detail larger than the tolerance", () => {
    const path: [number, number][] = [
      [0, 0],
      [0.5, 1],
      [0, 2],
    ];
    expect(simplifyPath(path, 0.1)).toHaveLength(3);
    expect(simplifyPath(path, 1)).toHaveLength(2);
  });
});

describe("simplifyRing", () => {
  it("removes a repeated closing point and straight-line vertices", () => {
    const ring: Ring = [
      [0, 0],
      [0, 1],
      [0, 2],
      [2, 2],
      [2, 0],
      [0, 0],
    ];
    const out = simplifyRing(ring, 0.01);
    expect(out).toHaveLength(4);
    expect(Math.abs(ringArea(out))).toBe(4);
  });
});

describe("clipRing", () => {
  it("cuts a polygon to the window", () => {
    const clipped = clipRing(square, { south: 0, west: 0, north: 2, east: 1 });
    expect(Math.abs(ringArea(clipped))).toBeCloseTo(2);
    expect(ringBounds(clipped).east).toBe(1);
  });

  it("keeps a polygon that is entirely inside and drops one entirely outside", () => {
    expect(clipRing(square, { south: -1, west: -1, north: 3, east: 3 })).toHaveLength(4);
    expect(clipRing(square, { south: 5, west: 5, north: 6, east: 6 })).toEqual([]);
  });
});

describe("pointInRing and windowsOverlap", () => {
  it("tells inside from outside", () => {
    expect(pointInRing([1, 1], square)).toBe(true);
    expect(pointInRing([3, 1], square)).toBe(false);
  });

  it("detects overlapping and separate windows", () => {
    const w = { south: 0, west: 0, north: 1, east: 1 };
    expect(windowsOverlap(w, { south: 0.5, west: 0.5, north: 2, east: 2 })).toBe(true);
    expect(windowsOverlap(w, { south: 2, west: 2, north: 3, east: 3 })).toBe(false);
  });
});
