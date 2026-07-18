import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders a link for every main section", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Results" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roster" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });
});
