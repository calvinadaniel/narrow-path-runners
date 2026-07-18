import { describe, it, expect } from "vitest";
import { buildPhotoEntries, captionFromFilename } from "./upload-photos-helpers";

describe("captionFromFilename", () => {
  it("turns a filename into a readable caption", () => {
    expect(captionFromFilename("finish-line-sprint.jpg")).toBe("finish line sprint");
  });
});

describe("buildPhotoEntries", () => {
  it("pairs filenames with their uploaded urls", () => {
    const entries = buildPhotoEntries(
      ["finish-line.jpg"],
      ["https://blob.vercel-storage.com/finish-line-abc123.jpg"]
    );
    expect(entries).toEqual([
      { url: "https://blob.vercel-storage.com/finish-line-abc123.jpg", caption: "finish line" },
    ]);
  });

  it("throws when filenames and urls length mismatch", () => {
    expect(() => buildPhotoEntries(["a.jpg"], [])).toThrow();
  });
});
