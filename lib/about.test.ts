import { describe, it, expect } from "vitest";
import { getAboutContent } from "./about";

describe("getAboutContent", () => {
  it("reads the about.mdx file", () => {
    const content = getAboutContent();
    expect(content.length).toBeGreaterThan(0);
  });
});
