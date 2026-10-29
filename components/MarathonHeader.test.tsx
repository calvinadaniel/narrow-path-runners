import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MarathonHeader from "./MarathonHeader";

describe("MarathonHeader", () => {
  it("shows the club logo without any navigation links", () => {
    render(<MarathonHeader />);
    expect(
      screen.getByRole("img", { name: "Narrow Path Runners" })
    ).toHaveAttribute("src", expect.stringContaining("npr-logo"));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("keeps the brand stripe and event labels", () => {
    const { container } = render(<MarathonHeader />);
    expect(container.querySelector(".npr-stripe")).toBeInTheDocument();
    expect(screen.getByText("TCS NYC Marathon")).toBeInTheDocument();
    expect(screen.getByText("Sunday, Nov 1")).toBeInTheDocument();
  });
});
