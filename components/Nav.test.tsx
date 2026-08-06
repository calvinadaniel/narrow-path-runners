import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders brand logo and page links", () => {
    render(<Nav />);
    expect(
      screen.getByRole("link", { name: "Narrow Path Runners" })
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: "Narrow Path Runners" })).toHaveAttribute(
      "src",
      expect.stringContaining("npr-logo")
    );
    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute(
      "href",
      "/roster"
    );
    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute(
      "href",
      "/results"
    );
    expect(screen.getByRole("link", { name: "Who We Are" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(
      screen.queryByRole("link", { name: "JOIN NOW" })
    ).not.toBeInTheDocument();
  });
});
