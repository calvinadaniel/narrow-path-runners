import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

  it("names the race and the day", () => {
    const { container } = render(<MarathonHeader />);
    const headline = container.querySelector("p[class*='headline']")!;
    expect(headline).toHaveTextContent("NYCMarathon");
    expect(screen.getByText("Sunday · Nov 1 · 2026")).toBeInTheDocument();
  });

  it("shows finishers, miles and boroughs, and no fastest time", () => {
    const { container } = render(<MarathonHeader />);
    const stats = container.querySelector("dl")!;
    const dts = within(stats).getAllByText(/^(Finishers|Miles|Boroughs)$/);
    expect(dts.map((el) => el.textContent)).toEqual(["Finishers", "Miles", "Boroughs"]);
    const value = (label: string) => within(stats).getByText(label).nextElementSibling!.textContent;
    expect(value("Finishers")).toMatch(/^\d+$/);
    expect(Number(value("Finishers"))).toBeGreaterThan(0);
    expect(value("Miles")).toBe("26.2");
    expect(value("Boroughs")).toBe("5");
    expect(screen.queryByText(/fastest/i)).not.toBeInTheDocument();
  });

  it("draws the course by borough, with no runner dots or snapshot caption", () => {
    const { container } = render(<MarathonHeader />);
    const ribbon = screen.getByRole("img", { name: /^The course by borough:/ });
    expect(ribbon).toHaveAccessibleName(/Staten Island, Brooklyn, Queens, Manhattan, The Bronx, Manhattan/);
    expect(within(ribbon).getByText("Brooklyn")).toBeInTheDocument();
    expect(within(ribbon).getByText("QNS")).toBeInTheDocument();
    expect(within(ribbon).getByText("BX")).toBeInTheDocument();
    expect(screen.queryByText(/12:30/)).not.toBeInTheDocument();
    expect(container.querySelectorAll("[class*='dot']")).toHaveLength(0);
  });

  it("draws the course as one line", () => {
    render(<MarathonHeader />);
    expect(
      screen.getByRole("img", { name: /course drawn as one line/ })
    ).toBeInTheDocument();
  });
});
