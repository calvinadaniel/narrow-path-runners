/** Helpers for NYRR → Race JSON import. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** NYRR times look like "0:49:24" or "4:36:21" — drop a leading 0: hour. */
export function formatNyrrTime(time: string): string {
  return time.replace(/^0:/, "");
}

export function runnerIdFromName(firstName: string, lastName: string): string {
  return slugify(`${firstName} ${lastName}`);
}

/** Strip permit codes like "(NY25006JRG)" from venue strings. */
export function cleanVenue(venue: string): string {
  return venue.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

const DISTANCE_LABELS: Record<string, string> = {
  HALF: "Half Marathon",
  MAR: "Marathon",
  "13.1M": "Half Marathon",
  "26.2M": "Marathon",
};

export function formatDistance(unitCode: string, distanceName: string): string {
  const code = (unitCode || "").toUpperCase();
  return DISTANCE_LABELS[code] || unitCode || distanceName;
}
