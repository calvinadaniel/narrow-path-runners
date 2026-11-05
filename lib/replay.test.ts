import { describe, it, expect } from "vitest";
import {
  REPLAY_STEP,
  buildMarks,
  buildReplay,
  formatClock,
  formatDuration,
  replayWindow,
  statusAt,
  type ReplayRunner,
} from "./replay";
import type { Course } from "./course";
import type { RtrtSplit } from "./rtrt";

// A short fake course: 10 miles.
const course: Course = {
  event: "TEST",
  miles: 10,
  line: [
    [40.0, -74.0, 0],
    [40.1, -74.0, 10],
  ],
  points: [
    { name: "5M", label: "8K/5mi", miles: 5, lat: 40.05, lng: -74.0 },
    { name: "HALF", label: "Half", miles: 6.5, lat: 40.065, lng: -74.0 },
  ],
};

const split = (point: string, epoch: number, over: Partial<RtrtSplit> = {}): RtrtSplit => ({
  pid: "A",
  point,
  label: point === "START" ? "Start" : point === "FINISH" ? "Finish" : `${point} mat`,
  epochTime: String(epoch),
  paceAvg: "09:00 min/mile",
  ...over,
});

const runner: ReplayRunner = {
  pid: "A",
  name: "Ann Alpha",
  bib: "1",
  marks: [
    [1000, 0, "Start", ""],
    [1900, 5, "5M mat", "09:00 min/mile"],
    [2800, 10, "Finish", "09:00 min/mile"],
  ],
};

describe("buildMarks", () => {
  it("orders mats by time and places them on the course", () => {
    const marks = buildMarks(
      [split("FINISH", 2800), split("START", 1000), split("5M", 1900)],
      course
    );
    expect(marks.map((m) => [m[0], m[1]])).toEqual([
      [1000, 0],
      [1900, 5],
      [2800, 10],
    ]);
  });

  it("drops mats that are not on the course or have no time", () => {
    const marks = buildMarks(
      [split("START", 1000), split("MYSTERY", 1500), split("5M", 1900, { epochTime: "nope" })],
      course
    );
    expect(marks).toHaveLength(1);
  });

  it("ignores a reading that would put the runner backward", () => {
    const marks = buildMarks(
      [split("START", 1000), split("HALF", 1500), split("5M", 1600), split("FINISH", 2800)],
      course
    );
    expect(marks.map((m) => m[1])).toEqual([0, 6.5, 10]);
  });
});

describe("buildReplay", () => {
  it("keeps one entry per roster runner, even with no splits", () => {
    const replay = buildReplay(
      "TEST",
      [
        { pid: "A", name: "Ann", bib: "1" },
        { pid: "B", name: "Bob", bib: "2" },
      ],
      [split("START", 1000)],
      course
    );
    expect(replay.runners.map((r) => [r.pid, r.marks.length])).toEqual([
      ["A", 1],
      ["B", 0],
    ]);
  });
});

describe("statusAt", () => {
  it("is not started before the start mat, and for runners with no readings", () => {
    expect(statusAt(runner, 999, course).state).toBe("not_started");
    expect(statusAt({ ...runner, marks: [] }, 5000, course).state).toBe("not_started");
  });

  it("is running at the start mat", () => {
    const s = statusAt(runner, 1000, course);
    expect(s.state).toBe("running");
    expect(s.miles).toBe(0);
    expect(s.netTime).toBe("0:00:00");
  });

  it("places a runner between mats by their share of the time", () => {
    const s = statusAt(runner, 1450, course); // halfway between start and 5M
    expect(s.state).toBe("running");
    expect(s.miles).toBeCloseTo(2.5);
    expect(s.lastLabel).toBe("Start");
    expect(s.netTime).toBe("0:07:30");
    expect(s.percentComplete).toBeCloseTo(25);
  });

  it("is exactly on the mat when the clock matches it", () => {
    const s = statusAt(runner, 1900, course);
    expect(s.miles).toBe(5);
    expect(s.lastLabel).toBe("5M mat");
    expect(s.paceAvg).toBe("09:00 min/mile");
  });

  it("finishes at the last mat with the net time from the start mat", () => {
    const s = statusAt(runner, 2800, course);
    expect(s.state).toBe("finished");
    expect(s.netTime).toBe("0:30:00");
    expect(statusAt(runner, 9999, course).state).toBe("finished");
  });

  it("leaves a runner at their last reading if they never finish", () => {
    const dnf: ReplayRunner = { ...runner, marks: runner.marks.slice(0, 2) };
    const s = statusAt(dnf, 5000, course);
    expect(s.state).toBe("running");
    expect(s.miles).toBe(5);
  });
});

describe("formatting", () => {
  it("formats elapsed time", () => {
    expect(formatDuration(0)).toBe("0:00:00");
    expect(formatDuration(4521)).toBe("1:15:21");
    expect(formatDuration(-5)).toBe("0:00:00");
  });

  it("formats New York clock time", () => {
    // 12:30 pm on Nov 1 2026, after daylight saving ended
    expect(formatClock(1793554200)).toBe("12:30:00 PM EST");
  });
});

describe("replayWindow", () => {
  const runner = (pid: string, marks: [number, number][]): ReplayRunner => ({
    pid,
    name: pid,
    marks: marks.map(([t, m]) => [t, m, "", ""]),
  });

  it("runs from the first runner's start to the last runner's finish", () => {
    const { from, to } = replayWindow({
      event: "TEST",
      runners: [
        runner("early", [[1000, 0], [4000, 10]]),
        runner("late", [[2000, 0], [9000, 10]]),
      ],
    });
    expect(from).toBe(1000);
    expect(to).toBeGreaterThanOrEqual(9000);
  });

  it("rounds the end up to a slider step so the slider can reach it", () => {
    const { from, to } = replayWindow({
      event: "TEST",
      runners: [runner("a", [[1000, 0], [1000 + 100, 10]])], // 100 s is not a multiple of the step
    });
    expect((to - from) % REPLAY_STEP).toBe(0);
    expect(to - from).toBeGreaterThanOrEqual(100);
    expect(to - from).toBeLessThan(100 + REPLAY_STEP);
  });

  it("ignores runners with no readings, and handles an empty replay", () => {
    const { from } = replayWindow({
      event: "TEST",
      runners: [runner("ghost", []), runner("a", [[500, 0], [900, 10]])],
    });
    expect(from).toBe(500);
    expect(replayWindow({ event: "TEST", runners: [] })).toEqual({ from: 0, to: 0 });
    expect(replayWindow({ event: "TEST", runners: [runner("ghost", [])] })).toEqual({ from: 0, to: 0 });
  });
});
