import { describe, it, expect } from "vitest";
import { getGroupRunPhotos } from "./gallery";

describe("getGroupRunPhotos", () => {
  it("returns photos from the group-runs.json file", () => {
    const photos = getGroupRunPhotos();
    expect(photos.length).toBeGreaterThanOrEqual(1);
    expect(photos[0]).toHaveProperty("url");
  });
});
