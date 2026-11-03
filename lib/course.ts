import type { MarathonRunnerStatus } from "./types";

/** [lat, lng, cumulative miles] */
export type CourseVertex = [number, number, number];

export interface CoursePoint {
  name: string;
  label: string;
  miles: number;
  lat: number;
  lng: number;
}

export interface Course {
  event: string;
  miles: number;
  line: CourseVertex[];
  points: CoursePoint[];
}

/** The slice of RTRT's `/events/{event}/map` response that we use. */
interface RawCourse {
  miles?: number;
  polymap?: { lat: number; lng: number; distance: { mi: number } }[];
  timingPoints?: {
    name: string;
    label?: string;
    miles: number;
    loc: { lat: number; lng: number };
  }[];
}

export function parseCourse(
  event: string,
  raw: { list?: { layers?: { courses?: RawCourse[] } }[] }
): Course {
  const course = raw.list?.[0]?.layers?.courses?.[0];
  if (!course?.polymap?.length || !course.miles) {
    throw new Error("Map response has no course line");
  }
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    event,
    miles: round(course.miles),
    line: course.polymap.map((p) => [round(p.lat), round(p.lng), round(p.distance.mi)]),
    points: (course.timingPoints ?? []).map((t) => ({
      name: t.name,
      label: t.label ?? t.name,
      miles: round(t.miles),
      lat: round(t.loc.lat),
      lng: round(t.loc.lng),
    })),
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Latitude/longitude at a distance along the course, clamped to its ends. */
export function positionAt(
  course: Course,
  miles: number
): { lat: number; lng: number } {
  const { line } = course;
  const m = clamp(miles, 0, course.miles);
  let lo = 0;
  let hi = line.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line[mid][2] <= m) lo = mid;
    else hi = mid;
  }
  const [lat0, lng0, m0] = line[lo];
  const [lat1, lng1, m1] = line[hi];
  const t = m1 === m0 ? 0 : clamp((m - m0) / (m1 - m0), 0, 1);
  return { lat: lat0 + (lat1 - lat0) * t, lng: lng0 + (lng1 - lng0) * t };
}

/** Distance along the course of a timing point, by its RTRT name. */
export function pointMiles(course: Course, name: string | undefined): number | undefined {
  if (!name) return undefined;
  if (name === "START") return 0;
  if (name === "FINISH") return course.miles;
  return course.points.find((p) => p.name === name)?.miles;
}

/**
 * Where a runner is on the course, in miles. Prefers RTRT's own estimate
 * (`miles`), then the last timing mat they crossed.
 */
export function milesFor(s: MarathonRunnerStatus, course: Course): number {
  if (s.state === "finished") return course.miles;
  if (s.state === "not_started") return 0;
  if (s.miles !== undefined) return clamp(s.miles, 0, course.miles);
  return pointMiles(course, s.lastPoint) ?? 0;
}

/** The map's drawing box, shared by the map component and the basemap build. */
export const MAP_VIEW = {
  width: 600,
  height: 800,
  pad: 8,
  /** Extra degrees of surroundings kept around the route. */
  margin: { lat: 0.03, lng: 0.05 },
} as const;

export interface Projection {
  width: number;
  height: number;
  project: (lat: number, lng: number) => { x: number; y: number };
  unproject: (x: number, y: number) => { lat: number; lng: number };
}

/** Fit the course (plus a margin of surroundings) into a box, keeping its true shape. */
export function makeProjection(
  course: Course,
  width: number,
  height: number,
  pad: number,
  margin: { lat: number; lng: number } = { lat: 0, lng: 0 }
): Projection {
  const lats = course.line.map((v) => v[0]);
  const lngs = course.line.map((v) => v[1]);
  const minLat = Math.min(...lats) - margin.lat;
  const maxLat = Math.max(...lats) + margin.lat;
  const minLng = Math.min(...lngs) - margin.lng;
  const maxLng = Math.max(...lngs) + margin.lng;
  // Longitude degrees shrink with latitude, so scale them to match.
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLng - minLng) * lngScale || 1;
  const spanY = maxLat - minLat || 1;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return {
    width,
    height,
    project: (lat, lng) => ({
      x: offX + (lng - minLng) * lngScale * scale,
      y: offY + (maxLat - lat) * scale,
    }),
    unproject: (x, y) => ({
      lat: maxLat - (y - offY) / scale,
      lng: minLng + (x - offX) / (lngScale * scale),
    }),
  };
}

export function linePath(course: Course, proj: Projection): string {
  return course.line
    .map(([lat, lng], i) => {
      const { x, y } = proj.project(lat, lng);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export interface Dot<T> {
  id: string;
  x: number;
  y: number;
  item: T;
}

export interface Cluster<T> {
  x: number;
  y: number;
  members: Dot<T>[];
}

/** Group dots closer than `radius` so overlapping runners show as one badge. */
export function clusterDots<T>(dots: Dot<T>[], radius: number): Cluster<T>[] {
  const clusters: Cluster<T>[] = [];
  for (const d of dots) {
    const hit = clusters.find((c) => Math.hypot(c.x - d.x, c.y - d.y) <= radius);
    if (hit) {
      hit.members.push(d);
      const n = hit.members.length;
      hit.x += (d.x - hit.x) / n;
      hit.y += (d.y - hit.y) / n;
    } else {
      clusters.push({ x: d.x, y: d.y, members: [d] });
    }
  }
  return clusters;
}
