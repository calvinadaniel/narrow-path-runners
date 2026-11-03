"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  clusterDots,
  linePath,
  makeProjection,
  milesFor,
  positionAt,
  type Course,
  type Dot,
} from "@/lib/course";
import type { MarathonRunnerStatus } from "@/lib/types";

const W = 600;
const H = 800;
const PAD = 56;
const MAX_ZOOM = 8;

/** Landmarks by distance along the course; `side` says which way the label sits. */
const LANDMARKS: { miles: number; label: string; side: "l" | "r" }[] = [
  { miles: 0.2, label: "Start · Staten Island", side: "r" },
  { miles: 1, label: "Verrazzano Bridge", side: "l" },
  { miles: 7, label: "Brooklyn", side: "l" },
  { miles: 13.1, label: "Pulaski Bridge · Half", side: "l" },
  { miles: 15.8, label: "Queensboro Bridge", side: "l" },
  { miles: 20.7, label: "The Bronx", side: "r" },
  { miles: 24.3, label: "Central Park", side: "l" },
];

/** A white outline keeps labels readable where they cross the course line. */
const HALO = "stroke-white [paint-order:stroke] [stroke-linejoin:round]";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const STATE_CLASS = {
  running: "fill-brand-red",
  finished: "fill-brand-green",
  not_started: "fill-brand-ink/40",
} as const;

function dotClass(members: Dot<MarathonRunnerStatus>[]): string {
  const first = members[0].item.state;
  return members.every((m) => m.item.state === first)
    ? STATE_CLASS[first]
    : "fill-brand-ink";
}

export default function MarathonMap({
  course,
  statuses,
  renderDetail,
}: {
  course: Course;
  statuses: MarathonRunnerStatus[];
  /** Status line shown under each runner in the detail panel. */
  renderDetail: (s: MarathonRunnerStatus) => ReactNode;
}) {
  const proj = useMemo(() => makeProjection(course, W, H, PAD), [course]);
  const path = useMemo(() => linePath(course, proj), [course, proj]);

  const [view, setView] = useState({ k: 1, cx: W / 2, cy: H / 2 });
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const svgRef = useRef<SVGSVGElement>(null);

  const vw = W / view.k;
  const vh = H / view.k;
  const vx = clamp(view.cx - vw / 2, 0, W - vw);
  const vy = clamp(view.cy - vh / 2, 0, H - vh);
  const u = 1 / view.k; // keeps marks the same size on screen as we zoom

  const dots: Dot<MarathonRunnerStatus>[] = useMemo(
    () =>
      statuses.map((s) => {
        const { lat, lng } = positionAt(course, milesFor(s, course));
        return { id: s.pid, item: s, ...proj.project(lat, lng) };
      }),
    [statuses, course, proj]
  );
  const clusters = useMemo(() => clusterDots(dots, 15 * u), [dots, u]);
  const selected = clusters.find((c) => c.members.some((m) => m.id === selectedPid));

  function zoom(factor: number) {
    setView((v) => ({ ...v, k: clamp(v.k * factor, 1, MAX_ZOOM) }));
  }

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const perPx = vw / rect.width;
    const all = [...pointers.current.values()];

    if (all.length === 2) {
      const [a, b] = all;
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [c, d] = [...pointers.current.values()];
      const after = Math.hypot(c.x - d.x, c.y - d.y);
      if (before > 0) zoom(after / before);
    } else if (view.k > 1) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setView((v) => ({
        ...v,
        cx: clamp(v.cx - (e.clientX - prev.x) * perPx, vw / 2, W - vw / 2),
        cy: clamp(v.cy - (e.clientY - prev.y) * perPx, vh / 2, H - vh / 2),
      }));
    }
  }
  function onPointerEnd(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
  }

  const start = proj.project(course.line[0][0], course.line[0][1]);
  const mileTicks = [5, 10, 15, 20, 25].filter((m) => m < course.miles);

  return (
    <div>
      <div className="relative card-vintage overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          role="img"
          aria-label="Map of the marathon course with runner positions"
          className={`block w-full h-auto max-h-[75vh] ${view.k > 1 ? "touch-none cursor-grab" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
        >
          <path
            d={path}
            fill="none"
            className="stroke-brand-ink/25"
            strokeWidth={7 * u}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            className="stroke-brand-tan"
            strokeWidth={3 * u}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {mileTicks.map((m) => {
            const { lat, lng } = positionAt(course, m);
            const p = proj.project(lat, lng);
            return (
              <g key={m} className="pointer-events-none">
                <circle cx={p.x} cy={p.y} r={3.5 * u} className="fill-brand-ink/60" />
                <text
                  x={p.x + 7 * u}
                  y={p.y + 15 * u}
                  fontSize={10 * u}
                  strokeWidth={3 * u}
                  className={`fill-brand-ink/60 font-bold ${HALO}`}
                >
                  {m} mi
                </text>
              </g>
            );
          })}

          {LANDMARKS.map((l) => {
            const { lat, lng } = positionAt(course, l.miles);
            const p = proj.project(lat, lng);
            const dx = (l.side === "r" ? 16 : -16) * u;
            return (
              <text
                key={l.label}
                x={p.x + dx}
                y={p.y + 4 * u}
                fontSize={12 * u}
                strokeWidth={3.5 * u}
                textAnchor={l.side === "r" ? "start" : "end"}
                className={`fill-brand-ink/70 font-black pointer-events-none ${HALO}`}
              >
                {l.label}
              </text>
            );
          })}

          <circle
            cx={start.x}
            cy={start.y}
            r={5 * u}
            className="fill-white stroke-brand-green"
            strokeWidth={2.5 * u}
          />
          {(() => {
            const end = course.line[course.line.length - 1];
            const p = proj.project(end[0], end[1]);
            return (
              <g className="pointer-events-none">
                <rect
                  x={p.x - 5 * u}
                  y={p.y - 5 * u}
                  width={10 * u}
                  height={10 * u}
                  className="fill-white stroke-brand-ink"
                  strokeWidth={2 * u}
                />
                <text
                  x={p.x - 10 * u}
                  y={p.y + 20 * u}
                  fontSize={12 * u}
                  strokeWidth={3.5 * u}
                  textAnchor="end"
                  className={`fill-brand-ink font-black ${HALO}`}
                >
                  Finish
                </text>
              </g>
            );
          })()}

          {clusters.map((c) => {
            const count = c.members.length;
            const r = (count > 1 ? 13 : 8) * u;
            const names = c.members.map((m) => m.item.name).join(", ");
            const isSelected = selected === c;
            return (
              <g
                key={c.members[0].id}
                role="button"
                tabIndex={0}
                aria-label={`${count} runner${count === 1 ? "" : "s"}: ${names}`}
                className="cursor-pointer outline-none motion-safe:transition-transform motion-safe:duration-1000 ease-linear focus-visible:[&>circle:nth-of-type(2)]:stroke-brand-orange"
                style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
                onClick={() => setSelectedPid(c.members[0].id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPid(c.members[0].id);
                  }
                }}
              >
                <circle r={18 * u} fill="transparent" />
                <circle
                  r={r}
                  className={`${dotClass(c.members)} ${isSelected ? "stroke-brand-orange" : "stroke-white"}`}
                  strokeWidth={(isSelected ? 3.5 : 2) * u}
                />
                {count > 1 ? (
                  <text
                    textAnchor="middle"
                    dy={4.5 * u}
                    fontSize={13 * u}
                    className="fill-white font-black pointer-events-none"
                  >
                    {count}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => zoom(1.6)}
            aria-label="Zoom in"
            className="h-9 w-9 rounded-md bg-white border-2 border-brand-ink/20 font-black text-lg leading-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoom(1 / 1.6)}
            aria-label="Zoom out"
            className="h-9 w-9 rounded-md bg-white border-2 border-brand-ink/20 font-black text-lg leading-none"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setView({ k: 1, cx: W / 2, cy: H / 2 })}
            aria-label="Reset map"
            className="h-9 w-9 rounded-md bg-white border-2 border-brand-ink/20 font-black text-[11px]"
          >
            1×
          </button>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-ink/70 mt-3" aria-label="Map key">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-brand-red" aria-hidden="true" /> On course
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-brand-green" aria-hidden="true" /> Finished
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-brand-ink/40" aria-hidden="true" /> Not started
        </li>
      </ul>
      <p className="text-xs text-brand-ink/50 mt-1">
        Positions are estimated between timing mats, not GPS.
      </p>

      <div className="mt-4" aria-live="polite">
        {selected ? (
          <div className="card-vintage p-4">
            <h2 className="font-black mb-2">
              {selected.members.length === 1
                ? selected.members[0].item.name
                : `${selected.members.length} runners here`}
            </h2>
            <ul className="space-y-3">
              {selected.members.map((m) => (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bold break-words">{m.item.name}</span>
                    {m.item.bib ? (
                      <span className="text-xs text-brand-ink/50 shrink-0">Bib {m.item.bib}</span>
                    ) : null}
                  </div>
                  {renderDetail(m.item)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-brand-ink/60">Tap a dot to see who&apos;s there.</p>
        )}
      </div>
    </div>
  );
}
