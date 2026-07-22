import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StravaCta from "./StravaCta";

describe("StravaCta", () => {
  it("links to the club Strava profile", () => {
    render(<StravaCta compact />);
    const link = screen.getByRole("link", { name: /strava/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.strava.com/clubs/1969555/"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
