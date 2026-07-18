import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotoGrid from "./PhotoGrid";

describe("PhotoGrid", () => {
  it("renders an image for each photo", () => {
    render(
      <PhotoGrid
        photos={[
          { url: "https://example.com/a.jpg", caption: "A" },
          { url: "https://example.com/b.jpg", caption: "B" },
        ]}
      />
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("shows a message when there are no photos", () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.getByText("No photos yet.")).toBeInTheDocument();
  });
});
