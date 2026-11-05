import type { Basemap } from "./basemap";
import { positionAt, type Course } from "./course";
import { pointInRing } from "./geo";

export interface BoroughSegment {
  borough: string;
  /** Miles along the course where the segment starts and ends. */
  from: number;
  to: number;
}

/**
 * The borough the course is in at a point. Bridges and shoreline run over water,
 * so a point inside no borough takes the nearest borough's.
 */
function boroughAt(basemap: Basemap, lat: number, lng: number): string {
  for (const b of basemap.boroughs) {
    if (b.rings.some((ring) => pointInRing([lat, lng], ring))) return b.name;
  }
  const lngScale = Math.cos((lat * Math.PI) / 180);
  let best = "";
  let bestDist = Infinity;
  for (const b of basemap.boroughs) {
    for (const ring of b.rings) {
      for (const [a, o] of ring) {
        const d = Math.hypot(a - lat, (o - lng) * lngScale);
        if (d < bestDist) {
          bestDist = d;
          best = b.name;
        }
      }
    }
  }
  return best;
}

/**
 * The course split into borough stretches, in order. A borough can appear more
 * than once (Manhattan twice). Stretches shorter than `minLength` miles, such as
 * a bridge approach clipping the next borough, join the stretch before them.
 */
export function boroughSegments(
  course: Course,
  basemap: Basemap,
  step = 0.1,
  minLength = 0.4
): BoroughSegment[] {
  const runs: BoroughSegment[] = [];
  for (let m = 0; m < course.miles; m += step) {
    const { lat, lng } = positionAt(course, m);
    const borough = boroughAt(basemap, lat, lng);
    const last = runs[runs.length - 1];
    if (last && last.borough === borough) last.to = m + step;
    else runs.push({ borough, from: m, to: m + step });
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].to - runs[i].from < minLength) {
        runs[i - 1].to = runs[i].to;
        runs.splice(i, 1);
        changed = true;
        break;
      }
    }
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].borough === runs[i - 1].borough) {
        runs[i - 1].to = runs[i].to;
        runs.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  if (runs.length) runs[runs.length - 1].to = course.miles;
  return runs;
}

export interface RouteShape {
  /** SVG path for the whole course. */
  d: string;
  viewBox: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/** The course as one line that fits a box `width` wide, with `pad` around it. */
export function routeShape(course: Course, width = 100, pad = 6): RouteShape {
  const lats = course.line.map((v) => v[0]);
  const lngs = course.line.map((v) => v[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Longitude degrees shrink with latitude, so scale them to match.
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = width / ((maxLng - minLng) * lngScale || 1);
  const height = (maxLat - minLat) * scale;
  const pts = course.line.map(([lat, lng]) => ({
    x: (lng - minLng) * lngScale * scale,
    y: (maxLat - lat) * scale,
  }));
  return {
    d: "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L"),
    viewBox: `${-pad} ${-pad} ${(width + 2 * pad).toFixed(1)} ${(height + 2 * pad).toFixed(1)}`,
    start: pts[0],
    end: pts[pts.length - 1],
  };
}
