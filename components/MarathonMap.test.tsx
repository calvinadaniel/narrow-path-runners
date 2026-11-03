import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MarathonMap from "./MarathonMap";
import type { Course } from "@/lib/course";
import type { MarathonRunnerStatus } from "@/lib/types";

const course: Course = {
  event: "TEST",
  miles: 26.2,
  line: [
    [40.6, -74.06, 0],
    [40.7, -73.95, 13],
    [40.77, -73.97, 26.2],
  ],
  points: [{ name: "HALF", label: "Half", miles: 13.1, lat: 40.7, lng: -73.95 }],
};

const status = (over: Partial<MarathonRunnerStatus>): MarathonRunnerStatus => ({
  pid: "p",
  name: "Runner",
  state: "running",
  ...over,
});

const statuses: MarathonRunnerStatus[] = [
  status({ pid: "A", name: "Ann Alpha", bib: "1", lastPoint: "HALF", netTime: "1:56:17" }),
  status({ pid: "B", name: "Bob Beta", bib: "2", miles: 5 }),
  status({ pid: "C", name: "Cy Gamma", bib: "3", state: "finished", netTime: "3:59:59" }),
  status({ pid: "D", name: "Di Delta", bib: "4", state: "finished", netTime: "4:10:00" }),
  status({ pid: "E", name: "Ed Epsilon", bib: "5", state: "not_started" }),
];

const detail = (s: MarathonRunnerStatus) => <p>{s.name} detail</p>;

describe("MarathonMap", () => {
  it("draws each runner, merging those at the same spot into a count", () => {
    render(<MarathonMap course={course} statuses={statuses} renderDetail={detail} />);
    expect(screen.getByRole("button", { name: "1 runner: Ann Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 runner: Bob Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 runners: Cy Gamma, Di Delta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 runner: Ed Epsilon" })).toBeInTheDocument();
  });

  it("starts with a hint, then shows who is at the tapped dot", () => {
    render(<MarathonMap course={course} statuses={statuses} renderDetail={detail} />);
    expect(screen.getByText(/Tap a dot/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2 runners: Cy Gamma, Di Delta" }));
    expect(screen.getByText("2 runners here")).toBeInTheDocument();
    expect(screen.getByText("Bib 3")).toBeInTheDocument();
    expect(screen.getByText("Cy Gamma detail")).toBeInTheDocument();
    expect(screen.getByText("Di Delta detail")).toBeInTheDocument();
    expect(screen.queryByText(/Tap a dot/)).not.toBeInTheDocument();
  });

  it("selects with the keyboard", () => {
    render(<MarathonMap course={course} statuses={statuses} renderDetail={detail} />);
    const dot = screen.getByRole("button", { name: "1 runner: Ann Alpha" });
    fireEvent.keyDown(dot, { key: "Enter" });
    expect(screen.getByRole("heading", { name: "Ann Alpha" })).toBeInTheDocument();
  });

  it("zooms in and resets", () => {
    const { container } = render(
      <MarathonMap course={course} statuses={statuses} renderDetail={detail} />
    );
    const svg = container.querySelector("svg")!;
    const initial = svg.getAttribute("viewBox");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(svg.getAttribute("viewBox")).not.toBe(initial);
    fireEvent.click(screen.getByRole("button", { name: "Reset map" }));
    expect(svg.getAttribute("viewBox")).toBe(initial);
  });

  it("says that positions are estimates", () => {
    render(<MarathonMap course={course} statuses={statuses} renderDetail={detail} />);
    expect(screen.getByText(/estimated between timing mats/i)).toBeInTheDocument();
  });
});
