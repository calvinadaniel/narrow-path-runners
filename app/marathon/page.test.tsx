import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MarathonPage from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("MarathonPage", () => {
  it("links to the race replay", () => {
    // The tracker polls the API; keep it waiting so only the page itself renders.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<MarathonPage />);
    expect(
      screen.getByRole("link", { name: /race replay/i })
    ).toHaveAttribute("href", "/marathon/replay");
  });
});
