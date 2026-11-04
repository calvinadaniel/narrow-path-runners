import { describe, it, expect } from "vitest";
import { graticule, ringsPath, windowProjection } from "./basemap";
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

describe("windowProjection", () => {
  const win = { south: 40.5, west: -74.2, north: 40.9, east: -73.8 };
  const proj = windowProjection(win, 1000);

  it("puts the window corners at the corners of the box", () => {
    const nw = proj.project(win.north, win.west);
    const se = proj.project(win.south, win.east);
    expect(nw.x).toBeCloseTo(0);
    expect(nw.y).toBeCloseTo(0);
    expect(se.x).toBeCloseTo(1000);
    expect(se.y).toBeCloseTo(proj.height);
  });

  it("keeps the true shape: taller than wide because longitude degrees are shorter", () => {
    // 0.4 degrees of latitude vs 0.4 degrees of longitude at 40.7 N
    expect(proj.height).toBeGreaterThan(1000);
    expect(proj.height / 1000).toBeCloseTo(1 / Math.cos((40.7 * Math.PI) / 180), 1);
  });

  it("maps a screen point back to the same place", () => {
    const { x, y } = proj.project(40.7, -74.0);
    const back = proj.unproject(x, y);
    expect(back.lat).toBeCloseTo(40.7, 6);
    expect(back.lng).toBeCloseTo(-74.0, 6);
  });
});

describe("graticule", () => {
  const win = { south: 40.565, west: -74.134, north: 40.8515, east: -73.8508 };

  it("lists the lines inside the window, evenly spaced", () => {
    const { lats, lngs } = graticule(win, 0.05);
    expect(lats).toEqual([40.6, 40.65, 40.7, 40.75, 40.8, 40.85]);
    expect(lngs).toEqual([-74.1, -74.05, -74, -73.95, -73.9]);
  });

  it("leaves out lines outside the window", () => {
    const { lats } = graticule({ south: 40.62, west: -74, north: 40.68, east: -73.9 }, 0.05);
    expect(lats).toEqual([40.65]);
  });
});
