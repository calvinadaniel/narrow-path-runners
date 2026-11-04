import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MarathonTracker, {
  sortStatuses,
  summarize,
  filterStatuses,
  pointLabel,
} from "./MarathonTracker";
import type { MarathonRunnerStatus, MarathonRosterEntry } from "@/lib/types";
import type { Course } from "@/lib/course";
import type { RaceEntry } from "@/lib/raceHistory";

const roster: MarathonRosterEntry[] = [
  { pid: "A", bib: "1", name: "Ann Alpha", runnerId: "ann-alpha" },
  { pid: "B", bib: "2", name: "Bob Beta", runnerId: "bob-beta" },
  { pid: "C", bib: "3", name: "Cy Gamma", runnerId: "cy-gamma" },
];

const statuses: MarathonRunnerStatus[] = [
  { pid: "A", bib: "1", name: "Ann Alpha", state: "not_started", waveStart: 1793542200, countdownSeconds: 3600 },
  { pid: "B", bib: "2", name: "Bob Beta", state: "running", lastPoint: "HALF", lastLabel: "Half/13.1mi", netTime: "1:56:17", paceAvg: "08:53 min/mile", projectedFinish: "4:14:01", percentComplete: 50, nextPoint: "14M", nextClock: "11:52 am" },
  { pid: "C", bib: "3", name: "Cy Gamma", state: "finished", netTime: "3:59:59", percentComplete: 100 },
];

const course: Course = {
  event: "TEST",
  miles: 26.2,
  line: [
    [40.6, -74.06, 0],
    [40.7, -73.95, 13],
    [40.77, -73.97, 26.2],
  ],
  points: [{ name: "HALF", label: "Half", miles: 13.1, lat: 40.7, lng: -73.95 }],
};

afterEach(() => vi.unstubAllGlobals());

describe("sortStatuses", () => {
  it("orders running, then finished, then not started", () => {
    expect(sortStatuses(statuses).map((s) => s.pid)).toEqual(["B", "C", "A"]);
  });

  it("sorts finishers fastest first and runners by progress", () => {
    const sorted = sortStatuses([
      { pid: "x", name: "X", state: "finished", netTime: "4:10:00" },
      { pid: "y", name: "Y", state: "finished", netTime: "3:59:00" },
      { pid: "p", name: "P", state: "running", percentComplete: 10 },
      { pid: "q", name: "Q", state: "running", percentComplete: 80 },
    ]);
    expect(sorted.map((s) => s.pid)).toEqual(["q", "p", "y", "x"]);
  });
});

describe("summarize and filterStatuses", () => {
  it("counts runners by state", () => {
    expect(summarize(statuses)).toEqual({ all: 3, running: 1, finished: 1, not_started: 1 });
  });

  it("filters by state, with all returning everyone", () => {
    expect(filterStatuses(statuses, "running").map((s) => s.pid)).toEqual(["B"]);
    expect(filterStatuses(statuses, "all")).toHaveLength(3);
  });
});

describe("pointLabel", () => {
  it("makes checkpoint codes readable", () => {
    expect(pointLabel("14M")).toBe("Mile 14");
    expect(pointLabel("HALF")).toBe("Half");
    expect(pointLabel("FINISH")).toBe("Finish");
    expect(pointLabel("30K")).toBe("30K");
  });
});

describe("MarathonTracker", () => {
  it("shows a message when nobody is on the roster", () => {
    render(<MarathonTracker roster={[]} profileIds={[]} />);
    expect(screen.getByText(/haven't confirmed who's running/i)).toBeInTheDocument();
  });

  it("renders live statuses from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    render(<MarathonTracker roster={roster} profileIds={["bob-beta"]} />);

    expect(await screen.findByText(/Half\/13.1mi · 1:56:17/)).toBeInTheDocument();
    expect(screen.getByText(/Finished · 3:59:59/)).toBeInTheDocument();
    expect(screen.getByText(/Projected 4:14:01/)).toBeInTheDocument();
    expect(screen.getByText(/Next: Mile 14 around 11:52 am/)).toBeInTheDocument();
    expect(screen.getByTestId("summary")).toHaveTextContent("1 running · 1 finished · 1 not started");
    // Only runners with a profile page become links.
    expect(screen.getByRole("link", { name: "Bob Beta" })).toHaveAttribute("href", "/roster/bob-beta");
    expect(screen.queryByRole("link", { name: "Ann Alpha" })).not.toBeInTheDocument();
  });

  it("filters to runners on the course", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    render(<MarathonTracker roster={roster} profileIds={[]} />);
    await screen.findByText(/Half\/13.1mi/);

    fireEvent.click(screen.getByRole("button", { name: "On course (1)" }));
    expect(screen.getByText("Bob Beta")).toBeInTheDocument();
    expect(screen.queryByText("Ann Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Cy Gamma")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "On course (1)" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "All (3)" }));
    expect(screen.getByText("Ann Alpha")).toBeInTheDocument();
  });

  it("switches between the list and the map, keeping the filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    render(<MarathonTracker roster={roster} profileIds={[]} course={course} />);
    await screen.findByText(/Half\/13.1mi/);
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(screen.getByRole("img", { name: /Map of the marathon course/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 runner: Bob Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 runner: Ann Alpha" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "On course (1)" }));
    expect(screen.getByRole("button", { name: "1 runner: Bob Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1 runner: Ann Alpha" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(screen.queryByRole("img", { name: /Map of the marathon course/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Half\/13.1mi · 1:56:17/)).toBeInTheDocument();
  });

  it("shows each runner's other 2026 races on their card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    const raceHistory: Record<string, RaceEntry[]> = {
      "ann-alpha": [
        { raceId: "a", name: "NYRR Al Gordon 5K", date: "2026-02-28", distance: "5K", time: "30:09" },
        { raceId: "b", name: "United Airlines NYC Half", date: "2026-03-15", distance: "Half Marathon", time: "1:55:10" },
      ],
      "bob-beta": [],
    };
    render(<MarathonTracker roster={roster} profileIds={[]} raceHistory={raceHistory} />);
    await screen.findByText(/Half\/13.1mi/);

    expect(screen.getByText("Other 2026 NYRR races (2)")).toBeInTheDocument();
    expect(screen.getByText("NYRR Al Gordon 5K")).toBeInTheDocument();
    expect(screen.getByText("30:09")).toBeInTheDocument();
    expect(screen.getAllByText("No other 2026 NYRR races on record")).toHaveLength(2); // Bob, and Cy who isn't listed
  });

  it("shows no race section without race history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    render(<MarathonTracker roster={roster} profileIds={[]} />);
    await screen.findByText(/Half\/13.1mi/);
    expect(screen.queryByText(/NYRR races/)).not.toBeInTheDocument();
  });

  it("hides the toggle when there is no course data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ fetchedAt: Date.now(), runners: statuses }),
      })
    );
    render(<MarathonTracker roster={roster} profileIds={[]} />);
    await screen.findByText(/Half\/13.1mi/);
    expect(screen.queryByRole("button", { name: "Map" })).not.toBeInTheDocument();
  });

  it("says so when live tracking is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    render(<MarathonTracker roster={roster} profileIds={[]} />);
    expect(await screen.findByText(/unavailable right now/i)).toBeInTheDocument();
    expect(screen.getByText("Ann Alpha")).toBeInTheDocument();
  });
});
