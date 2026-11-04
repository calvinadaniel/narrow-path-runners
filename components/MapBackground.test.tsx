import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MapBackground from "./MapBackground";
import type { Basemap } from "@/lib/basemap";

const basemap: Basemap = {
  window: { south: 40.565, west: -74.134, north: 40.8515, east: -73.8508 },
  land: [
    [
      [40.7, -74.1],
      [40.75, -74.1],
      [40.75, -74.05],
    ],
  ],
  boroughs: [
    {
      name: "Manhattan",
      rings: [
        [
          [40.7, -74.0],
          [40.8, -73.95],
          [40.8, -73.97],
        ],
      ],
      label: { lat: 40.75, lng: -73.98, angle: -62 },
    },
  ],
  parks: [
    {
      name: "Central Park",
      ring: [
        [40.76, -73.98],
        [40.8, -73.95],
        [40.78, -73.96],
      ],
    },
  ],
  attribution: "Map: Example Source.",
};

describe("MapBackground", () => {
  it("is decorative: hidden from screen readers and ignored by the pointer", () => {
    render(<MapBackground basemap={basemap} />);
    const el = screen.getByTestId("map-background");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toContain("pointer-events-none");
  });

  it("is faded and fills the screen behind the page", () => {
    render(<MapBackground basemap={basemap} />);
    const el = screen.getByTestId("map-background");
    expect(el.className).toContain("fixed");
    expect(el.className).toContain("inset-0");
    expect(el.className).toContain("opacity-[0.12]");
    expect(el.querySelector("svg")).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
  });

  it("draws the land, the borough and the park", () => {
    const { container } = render(<MapBackground basemap={basemap} />);
    expect(container.querySelectorAll("path")).toHaveLength(3);
  });

  it("draws latitude and longitude lines with degree labels at both ends", () => {
    const { container } = render(<MapBackground basemap={basemap} />);
    // 6 latitude lines + 5 longitude lines
    expect(container.querySelectorAll("line")).toHaveLength(11);
    // each label appears twice inside the drawing (both ends of the line) and twice as page text
    expect(screen.getAllByText("40.70° N")).toHaveLength(4);
    expect(screen.getAllByText("74.00° W")).toHaveLength(4);
    expect(screen.getAllByText("40.85° N")).toHaveLength(4);
    expect(screen.getAllByText("73.90° W")).toHaveLength(4);
  });

  it("places the on-screen labels by percentage so they survive the crop", () => {
    render(<MapBackground basemap={basemap} />);
    const tall = screen.getAllByText("40.70° N").find((el) => el.tagName === "SPAN")!;
    expect(tall).toHaveClass("map-label-tall-only");
    expect(parseFloat(tall.style.top)).toBeGreaterThan(0);
    expect(parseFloat(tall.style.top)).toBeLessThan(100);
    const wide = screen.getAllByText("74.00° W").find((el) => el.tagName === "SPAN")!;
    expect(wide).toHaveClass("map-label-wide-only");
    expect(parseFloat(wide.style.left)).toBeGreaterThan(0);
    expect(parseFloat(wide.style.left)).toBeLessThan(100);
  });
});
