import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders brand title, bracket nav links, and join CTA", () => {
    render(<Nav />);
    expect(
      screen.getByRole("link", { name: "Narrow Path Runners" })
    ).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "[Team]" })[0]).toHaveAttribute(
      "href",
      "/#team"
    );
    expect(
      screen.getAllByRole("link", { name: "[Events]" })[0]
    ).toHaveAttribute("href", "/#events");
    expect(
      screen.getAllByRole("link", { name: "[Who We Are]" })[0]
    ).toHaveAttribute("href", "/#who-we-are");
    expect(screen.getByRole("link", { name: "JOIN NOW" })).toHaveAttribute(
      "href",
      "/#join"
    );
  });
});
