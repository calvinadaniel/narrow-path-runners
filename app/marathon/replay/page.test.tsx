import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReplayPage from "./page";

describe("ReplayPage", () => {
  it("links back to the tracker", () => {
    render(<ReplayPage />);
    expect(
      screen.getByRole("link", { name: /back to the tracker/i })
    ).toHaveAttribute("href", "/marathon");
  });

  it("opens at 12:30 pm", () => {
    render(<ReplayPage />);
    expect(screen.getByTestId("clock")).toHaveTextContent("12:30:00 PM EST");
  });
});
