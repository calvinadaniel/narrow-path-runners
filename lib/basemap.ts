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
