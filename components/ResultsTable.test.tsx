import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultsTable from "./ResultsTable";
import type { RaceResult } from "@/lib/types";

const results: RaceResult[] = [
  { runnerId: "sam-lee", runnerName: "Sam Lee", time: "24:02", placement: 2 },
  { runnerId: "jane-doe", runnerName: "Jane Doe", time: "22:14", placement: 1, personalRecord: true },
];

describe("ResultsTable", () => {
  it("renders runners sorted by placement", () => {
    render(<ResultsTable results={results} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Jane Doe");
    expect(rows[1]).toHaveTextContent("Sam Lee");
  });

  it("shows a PR badge for personal records", () => {
    render(<ResultsTable results={results} />);
    expect(screen.getByText("PR")).toBeInTheDocument();
  });
});
