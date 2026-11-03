"use client";

import { useEffect, useMemo, useState } from "react";
import MarathonMap from "@/components/MarathonMap";
import { StatusLine } from "@/components/MarathonTracker";
import type { Basemap } from "@/lib/basemap";
import type { Course } from "@/lib/course";
import { formatClock, statusAt, type Replay } from "@/lib/replay";

const SPEEDS = [30, 60, 120] as const;
const TICK_MS = 1000; // matches the map's 1s glide between positions

/** Plays back the race between two clock times from the saved split times. */
export default function MarathonReplay({
  course,
  replay,
  from,
  to,
  basemap,
}: {
  course: Course;
  basemap?: Basemap;
  replay: Replay;
  /** Epoch seconds the replay starts and ends at. */
  from: number;
  to: number;
}) {
  const [t, setT] = useState(from);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(60);

  // Playback ends by itself at the end of the window.
  const atEnd = t >= to;
  const isPlaying = playing && !atEnd;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setT((cur) => Math.min(to, cur + speed));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, speed, to]);

  const statuses = useMemo(
    () => replay.runners.map((r) => statusAt(r, t, course)),
    [replay, t, course]
  );
  const counts = useMemo(() => {
    const c = { running: 0, finished: 0, not_started: 0 };
    for (const s of statuses) c[s.state] += 1;
    return c;
  }, [statuses]);

  return (
    <div>
      <div className="card-vintage p-4 mb-4">
        <p className="text-xs font-black tracking-wide uppercase text-brand-ink/50">
          Sunday, Nov 1 · race replay
        </p>
        <p
          className="font-black text-3xl sm:text-4xl tabular-nums mt-1"
          data-testid="clock"
          aria-live="off"
        >
          {formatClock(t)}
        </p>
        <p className="font-black mt-2" data-testid="summary">
          {counts.running} running · {counts.finished} finished · {counts.not_started} not
          started
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => {
              if (atEnd) setT(from);
              setPlaying(!isPlaying);
            }}
            className="px-5 py-2 rounded-full bg-brand-ink text-white text-sm font-black"
          >
            {isPlaying ? "Pause" : atEnd ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setT(from);
            }}
            className="px-4 py-2 rounded-full border-2 border-brand-ink/20 text-sm font-black"
          >
            Restart
          </button>
          <div className="inline-flex rounded-full border-2 border-brand-ink p-0.5" role="group" aria-label="Playback speed">
            {SPEEDS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSpeed(v)}
                aria-pressed={speed === v}
                className={`px-3 py-1 rounded-full text-sm font-black transition-colors ${
                  speed === v ? "bg-brand-ink text-white" : "text-brand-ink"
                }`}
              >
                {v}×
              </button>
            ))}
          </div>
        </div>

        <label className="block mt-4">
          <span className="sr-only">Replay time</span>
          <input
            type="range"
            min={from}
            max={to}
            step={15}
            value={t}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            className="w-full accent-brand-red"
          />
        </label>
        <div className="flex justify-between text-xs text-brand-ink/60 tabular-nums">
          <span>{formatClock(from)}</span>
          <span>{formatClock(to)}</span>
        </div>
      </div>

      <MarathonMap
        course={course}
        basemap={basemap}
        statuses={statuses}
        renderDetail={(s) => <StatusLine s={s} />}
      />
    </div>
  );
}
