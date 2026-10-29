import { describe, it, expect } from "vitest";
import {
  formatElapsed,
  parseProjection,
  parseRunnerStatus,
  makeToken,
  type RtrtSplit,
} from "./rtrt";

const runner = { pid: "RVHBZATU", bib: "21021", name: "Calvin Daniel" };

// Shapes taken from captured responses for NYRR-NY2026 / NYRR-NY2025.
const preRaceLoc = {
  pending: { marathon: { countdown: "259079", wavestart: "1793542200" } },
  course: "marathon",
  wavestart: "1793542200",
} as never;

const half: RtrtSplit = {
  pid: "RVHBZATU",
  point: "HALF",
  label: "Half/13.1mi",
  time: "01:56:17.49",
  netTime: "01:56:17.49",
  epochTime: "1762101872.35",
  paceAvg: "08:53 min/mile",
  etfp: "FINISH~04:14:01~2:02 pm",
};

const finish: RtrtSplit = {
  pid: "RVHBZATU",
  point: "FINISH",
  label: "Finish",
  time: "04:14:00.46",
  netTime: "04:14:00.46",
  epochTime: "1762110135.32",
  paceAvg: "09:42 min/mile",
  isFinish: "1",
};

describe("formatElapsed", () => {
  it("drops fractions and a leading zero hour", () => {
    expect(formatElapsed("01:56:17.49")).toBe("1:56:17");
    expect(formatElapsed("04:14:00.46")).toBe("4:14:00");
    expect(formatElapsed("10:02:03")).toBe("10:02:03");
  });

  it("returns undefined for missing input", () => {
    expect(formatElapsed(undefined)).toBeUndefined();
  });
});

describe("parseProjection", () => {
  it("splits the tilde-delimited estimate", () => {
    expect(parseProjection("FINISH~04:14:01~2:02 pm")).toEqual({
      elapsed: "4:14:01",
      clock: "2:02 pm",
    });
  });

  it("returns undefined when absent or malformed", () => {
    expect(parseProjection(undefined)).toBeUndefined();
    expect(parseProjection("FINISH")).toBeUndefined();
  });
});

describe("parseRunnerStatus", () => {
  it("reports not_started with a countdown before the race", () => {
    const s = parseRunnerStatus(runner, [], preRaceLoc);
    expect(s.state).toBe("not_started");
    expect(s.countdownSeconds).toBe(259079);
    expect(s.waveStart).toBe(1793542200);
  });

  it("reports running from the newest split", () => {
    const early: RtrtSplit = {
      pid: "RVHBZATU",
      point: "5K",
      label: "5K",
      netTime: "00:27:10.00",
      epochTime: "1762097000.00",
    };
    const s = parseRunnerStatus(runner, [early, half], {
      epc: "50",
      emiles: "13.1",
    });
    expect(s.state).toBe("running");
    expect(s.lastPoint).toBe("HALF");
    expect(s.netTime).toBe("1:56:17");
    expect(s.projectedFinish).toBe("4:14:01");
    expect(s.projectedClock).toBe("2:02 pm");
    expect(s.percentComplete).toBe(50);
    expect(s.miles).toBe(13.1);
  });

  it("picks the newest split even if the list is out of order", () => {
    const s = parseRunnerStatus(runner, [half, { ...half, point: "3M", epochTime: "1762090000.00" }], undefined);
    expect(s.lastPoint).toBe("HALF");
  });

  it("reports finished with the net time", () => {
    const s = parseRunnerStatus(runner, [half, finish], { closed: "1" });
    expect(s.state).toBe("finished");
    expect(s.netTime).toBe("4:14:00");
    expect(s.percentComplete).toBe(100);
  });

  it("treats a START-only runner as running at the line", () => {
    const start: RtrtSplit = {
      pid: "RVHBZATU",
      point: "START",
      label: "Start",
      netTime: "00:00:00.00",
      epochTime: "1762094894.86",
    };
    const s = parseRunnerStatus(runner, [start], { epc: "0" });
    expect(s.state).toBe("running");
    expect(s.lastPoint).toBe("START");
  });
});

describe("makeToken", () => {
  it("is 20 uppercase hex characters and random", () => {
    expect(makeToken()).toMatch(/^[0-9A-F]{20}$/);
    expect(makeToken()).not.toBe(makeToken());
  });
});
