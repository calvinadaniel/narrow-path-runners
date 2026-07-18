import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RunnerCard from "./RunnerCard";
import type { RunnerProfile } from "@/lib/types";

const profile: RunnerProfile = {
  id: "jane-doe",
  name: "Jane Doe",
  races: [{ race: {} as never, result: {} as never }],
};

describe("RunnerCard", () => {
  it("links to the runner's profile page", () => {
    render(<RunnerCard profile={profile} />);
    expect(
      screen.getByRole("link", { name: /Jane Doe/ })
    ).toHaveAttribute("href", "/roster/jane-doe");
  });

  it("shows how many races the runner has logged", () => {
    render(<RunnerCard profile={profile} />);
    expect(screen.getByText("1 race logged")).toBeInTheDocument();
  });
});
