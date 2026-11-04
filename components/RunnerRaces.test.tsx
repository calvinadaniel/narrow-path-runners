import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RunnerRaces, { shortDate } from "./RunnerRaces";
import type { RaceEntry } from "@/lib/raceHistory";

const races: RaceEntry[] = [
  { raceId: "b", name: "United Airlines NYC Half", date: "2026-03-15", distance: "Half Marathon", time: "1:55:10" },
  { raceId: "a", name: "NYRR Al Gordon 5K", date: "2026-02-28", distance: "5K", time: "30:09" },
];

describe("shortDate", () => {
  it("writes the month and day", () => {
    expect(shortDate("2026-03-15")).toBe("Mar 15");
    expect(shortDate("2026-01-01")).toBe("Jan 1");
    expect(shortDate("2026-12-31")).toBe("Dec 31");
  });
});

describe("RunnerRaces", () => {
  it("shows the count and each race with its time", () => {
    render(<RunnerRaces races={races} />);
    expect(screen.getByText("Other 2026 NYRR races (2)")).toBeInTheDocument();
    expect(screen.getByText("United Airlines NYC Half")).toBeInTheDocument();
    expect(screen.getByText("Mar 15 · Half Marathon")).toBeInTheDocument();
    expect(screen.getByText("1:55:10")).toBeInTheDocument();
    expect(screen.getByText("30:09")).toBeInTheDocument();
  });

  it("lists the races in the order given", () => {
    render(<RunnerRaces races={races} />);
    const times = screen.getAllByText(/^\d+:\d\d(:\d\d)?$/).map((el) => el.textContent);
    expect(times).toEqual(["1:55:10", "30:09"]);
  });

  it("starts collapsed", () => {
    const { container } = render(<RunnerRaces races={races} />);
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  it("says so when there are no other races", () => {
    const { container } = render(<RunnerRaces races={[]} />);
    expect(screen.getByText("No other 2026 NYRR races on record")).toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
  });
});
