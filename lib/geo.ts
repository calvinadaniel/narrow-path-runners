/** Small polygon helpers for building the basemap. Points are [lat, lng]. */
export type Pt = [number, number];
export type Ring = Pt[];

export interface Window {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Signed shoelace area in square degrees (sign follows winding). */
export function ringArea(ring: Ring): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [y1, x1] = ring[i];
    const [y2, x2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function perpDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[1] - a[1], p[0] - a[0]);
  return Math.abs(dx * (a[0] - p[0]) - (a[1] - p[1]) * dy) / len;
}

/** Douglas-Peucker simplification of an open path; keeps both end points. */
export function simplifyPath(points: Pt[], tolerance: number): Pt[] {
  if (points.length <= 2) return points;
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop()!;
    let far = -1;
    let farDist = tolerance;
    for (let i = lo + 1; i < hi; i++) {
      const d = perpDistance(points[i], points[lo], points[hi]);
      if (d > farDist) {
        far = i;
        farDist = d;
      }
    }
    if (far !== -1) {
      keep[far] = true;
      stack.push([lo, far], [far, hi]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplify a closed ring; returns it open (no repeated first point). */
export function simplifyRing(ring: Ring, tolerance: number): Ring {
  const open =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;
  // Split at the point farthest from the first so both halves are well formed.
  let far = 0;
  let farDist = -1;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > farDist) {
      far = i;
      farDist = d;
    }
  }
  if (far === 0) return open;
  const a = simplifyPath(open.slice(0, far + 1), tolerance);
  const b = simplifyPath([...open.slice(far), open[0]], tolerance);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

/** Sutherland-Hodgman: clip a ring to a lat/lng window. */
export function clipRing(ring: Ring, w: Window): Ring {
  type Edge = { inside: (p: Pt) => boolean; cross: (a: Pt, b: Pt) => Pt };
  const edges: Edge[] = [
    {
      inside: (p) => p[0] >= w.south,
      cross: (a, b) => [w.south, a[1] + ((b[1] - a[1]) * (w.south - a[0])) / (b[0] - a[0])],
    },
    {
      inside: (p) => p[0] <= w.north,
      cross: (a, b) => [w.north, a[1] + ((b[1] - a[1]) * (w.north - a[0])) / (b[0] - a[0])],
    },
    {
      inside: (p) => p[1] >= w.west,
      cross: (a, b) => [a[0] + ((b[0] - a[0]) * (w.west - a[1])) / (b[1] - a[1]), w.west],
    },
    {
      inside: (p) => p[1] <= w.east,
      cross: (a, b) => [a[0] + ((b[0] - a[0]) * (w.east - a[1])) / (b[1] - a[1]), w.east],
    },
  ];
  let out = ring;
  for (const e of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (e.inside(cur)) {
        if (!e.inside(prev)) out.push(e.cross(prev, cur));
        out.push(cur);
      } else if (e.inside(prev)) {
        out.push(e.cross(prev, cur));
      }
    }
    if (out.length === 0) return [];
  }
  return out;
}

export function ringBounds(ring: Ring): Window {
  let south = Infinity;
  let north = -Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const [lat, lng] of ring) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  return { south, west, north, east };
}

export function windowsOverlap(a: Window, b: Window): boolean {
  return a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south;
}

/** Ray casting point-in-polygon. */
export function pointInRing(p: Pt, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > p[0] !== yj > p[0] && p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Area-weighted centre of a ring. */
export function ringCentroid(ring: Ring): Pt {
  let a = 0;
  let cy = 0;
  let cx = 0;
  for (let i = 0; i < ring.length; i++) {
    const [y1, x1] = ring[i];
    const [y2, x2] = ring[(i + 1) % ring.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (a === 0) return ring[0];
  return [cy / (3 * a), cx / (3 * a)];
}
