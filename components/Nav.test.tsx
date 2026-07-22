import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders bracket nav links and join CTA", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "[Team]" })).toHaveAttribute(
      "href",
      "/#team"
    );
    expect(screen.getByRole("link", { name: "[Events]" })).toHaveAttribute(
      "href",
      "/#events"
    );
    expect(screen.getByRole("link", { name: "[Who We Are]" })).toHaveAttribute(
      "href",
      "/#who-we-are"
    );
    expect(screen.getByRole("link", { name: "JOIN NOW" })).toHaveAttribute(
      "href",
      "/#join"
    );
  });
});
