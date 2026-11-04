import type { Projection } from "./course";
import type { Ring, Window } from "./geo";

export interface Borough {
  name: string;
  /** Outline rings (outer rings and holes); draw with the even-odd rule. */
  rings: Ring[];
  /** Where to write the borough's name, and the angle to write it at. */
  label: { lat: number; lng: number; angle: number };
}

export interface Basemap {
  /** The latitude/longitude window the shapes were cut to. */
  window: Window;
  /** Land outside the five boroughs (New Jersey, Long Island, Westchester). */
  land: Ring[];
  boroughs: Borough[];
  parks: { name: string; ring: Ring }[];
  attribution: string;
}

/** SVG path for a set of rings in the map's drawing box. */
export function ringsPath(rings: Ring[], proj: Projection): string {
  return rings
    .map((ring) =>
      ring
        .map(([lat, lng], i) => {
          const { x, y } = proj.project(lat, lng);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") + " Z"
    )
    .join(" ");
}

/** A projection that fits a lat/lng window exactly into a box `width` wide. */
export function windowProjection(w: Window, width: number): Projection {
  // Longitude degrees shrink with latitude, so scale them to match.
  const lngScale = Math.cos((((w.south + w.north) / 2) * Math.PI) / 180);
  const scale = width / ((w.east - w.west) * lngScale);
  const height = (w.north - w.south) * scale;
  return {
    width,
    height,
    project: (lat, lng) => ({
      x: (lng - w.west) * lngScale * scale,
      y: (w.north - lat) * scale,
    }),
    unproject: (x, y) => ({
      lat: w.north - y / scale,
      lng: w.west + x / (lngScale * scale),
    }),
  };
}

/** The latitude and longitude lines to draw: every `step` degrees inside the window. */
export function graticule(w: Window, step: number): { lats: number[]; lngs: number[] } {
  const inside = (lo: number, hi: number) => {
    const out: number[] = [];
    for (let i = Math.ceil(lo / step); i * step <= hi; i++) {
      out.push(Math.round(i * step * 1e6) / 1e6); // no 40.650000000000006
    }
    return out;
  };
  return { lats: inside(w.south, w.north), lngs: inside(w.west, w.east) };
}
