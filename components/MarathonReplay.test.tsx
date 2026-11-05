import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MarathonReplay from "./MarathonReplay";
import type { Course } from "@/lib/course";
import type { Replay } from "@/lib/replay";

const FROM = 1793554200; // 12:30 pm EST, Nov 1 2026
const TO = FROM + 1800;

const course: Course = {
  event: "TEST",
  miles: 26.2,
  line: [
    [40.6, -74.06, 0],
    [40.7, -73.95, 13],
    [40.77, -73.97, 26.2],
  ],
  points: [],
};

// Ann is mid-course the whole window; Bob finishes at 12:45; Cy never started.
const replay: Replay = {
  event: "TEST",
  runners: [
    {
      pid: "A",
      name: "Ann Alpha",
      bib: "1",
      marks: [
        [FROM - 3600, 0, "Start", ""],
        [FROM - 600, 8, "8M mat", "09:00 min/mile"],
        [FROM + 3000, 20, "20M mat", "09:00 min/mile"],
      ],
    },
    {
      pid: "B",
      name: "Bob Beta",
      bib: "2",
      marks: [
        [FROM - 7200, 0, "Start", ""],
        [FROM + 900, 26.2, "Finish", "07:00 min/mile"],
      ],
    },
    { pid: "C", name: "Cy Gamma", bib: "3", marks: [] },
  ],
};

const renderReplay = () =>
  render(<MarathonReplay course={course} replay={replay} from={FROM} to={TO} />);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("MarathonReplay", () => {
  it("opens at 12:30 with the field's state at that moment", () => {
    renderReplay();
    expect(screen.getByTestId("clock")).toHaveTextContent("12:30:00 PM EST");
    expect(screen.getByTestId("summary")).toHaveTextContent("2 running · 0 finished · 1 not started");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("offers three speeds and starts at 300x, which plays ten hours in about two minutes", () => {
    renderReplay();
    expect(screen.getByRole("button", { name: "60×" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "300×" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "900×" })).toHaveAttribute("aria-pressed", "false");
  });

  it("advances the clock while playing, at the chosen speed", () => {
    renderReplay();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("clock")).toHaveTextContent("12:40:00 PM EST"); // 2 s x 300

    fireEvent.click(screen.getByRole("button", { name: "60×" }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("clock")).toHaveTextContent("12:41:00 PM EST"); // 1 s x 60
  });

  it("pauses", () => {
    renderReplay();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("clock")).toHaveTextContent("12:40:00 PM EST");
  });

  it("jumps with the scrubber and updates the counts", () => {
    renderReplay();
    fireEvent.change(screen.getByRole("slider", { name: "Replay time" }), {
      target: { value: String(FROM + 1200) },
    });
    expect(screen.getByTestId("clock")).toHaveTextContent("12:50:00 PM EST");
    expect(screen.getByTestId("summary")).toHaveTextContent("1 running · 1 finished · 1 not started");
  });

  it("stops at the end of the window and offers to replay", () => {
    renderReplay();
    fireEvent.click(screen.getByRole("button", { name: "900×" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId("clock")).toHaveTextContent("1:00:00 PM EST");
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByTestId("clock")).toHaveTextContent("12:30:00 PM EST");
  });

  it("restarts from the beginning", () => {
    renderReplay();
    fireEvent.change(screen.getByRole("slider", { name: "Replay time" }), {
      target: { value: String(FROM + 900) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(screen.getByTestId("clock")).toHaveTextContent("12:30:00 PM EST");
  });

  it("shows the runners on the map", () => {
    renderReplay();
    expect(screen.getByRole("button", { name: "1 runner: Ann Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cy Gamma/ })).toBeInTheDocument();
  });
});
