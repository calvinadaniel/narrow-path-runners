import { describe, it, expect } from "vitest";
import {
  slugify,
  formatNyrrTime,
  runnerIdFromName,
  cleanVenue,
  formatDistance,
} from "./import-nyrr-helpers";

describe("import-nyrr-helpers", () => {
  it("slugifies names", () => {
    expect(runnerIdFromName("Whitney", "Bynoe")).toBe("whitney-bynoe");
    expect(slugify("Joe Kleinerman 10K")).toBe("joe-kleinerman-10k");
  });

  it("formats NYRR times", () => {
    expect(formatNyrrTime("0:49:24")).toBe("49:24");
    expect(formatNyrrTime("4:36:21")).toBe("4:36:21");
  });

  it("cleans venues and distances", () => {
    expect(cleanVenue("Central Park, NYC (NY26001DNB)")).toBe("Central Park, NYC");
    expect(formatDistance("HALF", "Half-Marathon")).toBe("Half Marathon");
    expect(formatDistance("MAR", "Marathon")).toBe("Marathon");
  });
});
