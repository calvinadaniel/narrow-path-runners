import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReplayPage from "./page";
import { getMarathonReplay } from "@/lib/marathon";
import { formatClock, replayWindow } from "@/lib/replay";

describe("ReplayPage", () => {
  const { from, to } = replayWindow(getMarathonReplay()!);

  it("links back to the tracker", () => {
    render(<ReplayPage />);
    expect(
      screen.getByRole("link", { name: /back to the tracker/i })
    ).toHaveAttribute("href", "/marathon");
  });

  it("covers the whole race, from the first start to the last finish", () => {
    render(<ReplayPage />);
    expect(screen.getByTestId("clock")).toHaveTextContent(formatClock(from));
    expect(screen.getByText(formatClock(to))).toBeInTheDocument();
    // a marathon takes the field hours, not minutes
    expect(to - from).toBeGreaterThan(8 * 3600);
    expect(screen.getByText(/The whole race/)).toBeInTheDocument();
  });

  it("starts with the field still at the line", () => {
    render(<ReplayPage />);
    const summary = screen.getByTestId("summary").textContent ?? "";
    expect(summary).toMatch(/0 finished/);
  });
});
