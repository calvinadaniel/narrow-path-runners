import { describe, it, expect } from "vitest";
import { ringsPath } from "./basemap";
import { makeProjection, MAP_VIEW, type Course } from "./course";

const course: Course = {
  event: "TEST",
  miles: 10,
  line: [
    [40.0, -74.0, 0],
    [40.1, -73.9, 10],
  ],
  points: [],
};
const proj = makeProjection(course, MAP_VIEW.width, MAP_VIEW.height, MAP_VIEW.pad, MAP_VIEW.margin);

describe("ringsPath", () => {
  it("writes one closed subpath per ring", () => {
    const d = ringsPath(
      [
        [
          [40.0, -74.0],
          [40.05, -74.0],
          [40.05, -73.95],
        ],
        [
          [40.02, -73.99],
          [40.03, -73.99],
          [40.03, -73.98],
        ],
      ],
      proj
    );
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(d.match(/L/g)).toHaveLength(4);
  });

  it("returns an empty path for no rings", () => {
    expect(ringsPath([], proj)).toBe("");
  });

  it("keeps the shapes inside the drawing box for points near the route", () => {
    const d = ringsPath([[[40.05, -73.95]]], proj);
    const [x, y] = d.replace(/[MZ]/g, "").trim().split(" ").map(Number);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(MAP_VIEW.width);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(MAP_VIEW.height);
  });
});
