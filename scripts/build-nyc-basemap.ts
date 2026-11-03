/**
 * Build content/nyc-basemap.json: the land and water picture behind the course.
 * Shapes are cut to what the map shows, simplified, and saved so the page
 * never calls a map service.
 *
 * Sources (download them first; none is committed):
 *   boroughs  NYC Dept. of City Planning borough boundaries, clipped to the
 *             shoreline, as GeoJSON. For example
 *             https://raw.githubusercontent.com/dwillis/nyc-maps/master/boroughs.geojson
 *   nj, ny    Census ZIP code outlines for the land around the city. For example
 *             https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nj_new_jersey_zip_codes_geo.min.json
 *             https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ny_new_york_zip_codes_geo.min.json
 *
 * Usage:
 *   npx tsx scripts/build-nyc-basemap.ts <boroughs.geojson> <nj-zips.json> <ny-zips.json>
 */
import fs from "fs";
import path from "path";
import type { Basemap } from "../lib/basemap";
import { MAP_VIEW, makeProjection, type Course } from "../lib/course";
import {
  clipRing,
  pointInRing,
  ringArea,
  ringBounds,
  ringCentroid,
  simplifyRing,
  windowsOverlap,
  type Ring,
  type Window,
} from "../lib/geo";

const COURSE = path.join(process.cwd(), "content", "marathon-course.json");
const OUT = path.join(process.cwd(), "content", "nyc-basemap.json");

const BOROUGH_TOLERANCE = 0.00025; // about 28 m
const LAND_TOLERANCE = 0.0004;
const MIN_AREA = 3e-8; // square degrees; drops specks smaller than a few city blocks
const SLACK = 0.004;

/** Borough names sit at the middle of their visible shape unless that's crowded or cut off. */
const LABEL_AT: Record<string, [number, number]> = {
  "Staten Island": [40.583, -74.093], // the visible part is a sliver at the left edge
  Manhattan: [40.735, -73.998], // downtown, clear of the route and Central Park
};

/** Central Park, drawn by hand from its street corners (59th/8th Ave to 110th/5th Ave). */
const CENTRAL_PARK: Ring = [
  [40.7678, -73.9816],
  [40.7644, -73.9731],
  [40.7968, -73.9494],
  [40.8003, -73.9581],
];

type Geometry = { type: string; coordinates: unknown };
type Feature = { properties: Record<string, unknown>; geometry: Geometry };

/** GeoJSON [lng, lat] polygons as [lat, lng] rings: one array of rings per polygon. */
function polygonsOf(g: Geometry): Ring[][] {
  const raw =
    g.type === "MultiPolygon"
      ? (g.coordinates as number[][][][])
      : [g.coordinates as number[][][]];
  return raw.map((poly) => poly.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number])));
}

function readFeatures(file: string): Feature[] {
  return (JSON.parse(fs.readFileSync(file, "utf-8")) as { features: Feature[] }).features;
}

function round5(ring: Ring): Ring {
  return ring.map(([a, b]) => [Math.round(a * 1e5) / 1e5, Math.round(b * 1e5) / 1e5]);
}

function prepare(ring: Ring, window: Window, tolerance: number): Ring | null {
  const clipped = clipRing(ring, window);
  if (clipped.length < 3) return null;
  const simple = simplifyRing(clipped, tolerance);
  if (simple.length < 3 || Math.abs(ringArea(simple)) < MIN_AREA) return null;
  return round5(simple);
}

function main() {
  const [boroughsFile, njFile, nyFile] = process.argv.slice(2);
  if (!boroughsFile || !njFile || !nyFile) {
    console.error("Usage: npx tsx scripts/build-nyc-basemap.ts <boroughs.geojson> <nj-zips.json> <ny-zips.json>");
    process.exit(1);
  }

  // The window the map shows, from the same projection the map uses.
  const course = JSON.parse(fs.readFileSync(COURSE, "utf-8")) as Course;
  const proj = makeProjection(course, MAP_VIEW.width, MAP_VIEW.height, MAP_VIEW.pad, MAP_VIEW.margin);
  const tl = proj.unproject(0, 0);
  const br = proj.unproject(MAP_VIEW.width, MAP_VIEW.height);
  const window: Window = {
    north: tl.lat + SLACK,
    west: tl.lng - SLACK,
    south: br.lat - SLACK,
    east: br.lng + SLACK,
  };

  // Boroughs.
  const boroughFeatures = readFeatures(boroughsFile);
  const outerRings: Ring[] = []; // unclipped, to tell city ZIP codes from the rest
  const boroughs: Basemap["boroughs"] = boroughFeatures.map((f) => {
    const name = String(f.properties.BoroName);
    const rings: Ring[] = [];
    let biggest: { area: number; ring: Ring } | null = null;
    for (const poly of polygonsOf(f.geometry)) {
      outerRings.push(poly[0]);
      poly.forEach((ring, i) => {
        const r = prepare(ring, window, BOROUGH_TOLERANCE);
        if (!r) return;
        rings.push(r);
        const area = Math.abs(ringArea(r));
        if (i === 0 && (!biggest || area > biggest.area)) biggest = { area, ring: r };
      });
    }
    const [lat, lng] =
      LABEL_AT[name] ?? (biggest ? ringCentroid((biggest as { ring: Ring }).ring) : [0, 0]);
    return {
      name,
      rings,
      label: { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, angle: name === "Manhattan" ? -62 : 0 },
    };
  });

  // Land around the city: ZIP codes in view that are not inside a borough.
  const land: Ring[] = [];
  for (const file of [njFile, nyFile]) {
    for (const f of readFeatures(file)) {
      for (const poly of polygonsOf(f.geometry)) {
        const outer = poly[0];
        if (!windowsOverlap(ringBounds(outer), window)) continue;
        const [clat, clng] = ringCentroid(outer);
        if (outerRings.some((b) => pointInRing([clat, clng], b))) continue;
        const r = prepare(outer, window, LAND_TOLERANCE);
        if (!r) continue;
        // One winding for every shape so overlaps never cancel out.
        land.push(ringArea(r) < 0 ? r.reverse() : r);
      }
    }
  }

  const basemap: Basemap = {
    window,
    land,
    boroughs,
    parks: [{ name: "Central Park", ring: CENTRAL_PARK }],
    attribution:
      "Map: NYC Dept. of City Planning, U.S. Census Bureau. Course: TCS New York City Marathon.",
  };
  const json = JSON.stringify(basemap);
  fs.writeFileSync(OUT, json + "\n");

  const count = (rings: Ring[]) => rings.reduce((n, r) => n + r.length, 0);
  console.log(`Window: ${JSON.stringify(window)}`);
  for (const b of boroughs) console.log(`  ${b.name}: ${b.rings.length} rings, ${count(b.rings)} points, label ${JSON.stringify(b.label)}`);
  console.log(`  Surrounding land: ${land.length} shapes, ${count(land)} points`);
  console.log(`Wrote ${(json.length / 1024).toFixed(0)} KB → ${OUT}`);
}

main();
