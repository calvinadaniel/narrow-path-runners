import Image from "next/image";
import { Archivo, Barlow_Condensed } from "next/font/google";
import {
  getMarathonCourse,
  getMarathonFinisherCount,
  getNycBasemap,
} from "@/lib/marathon";
import { boroughSegments, routeShape } from "@/lib/ribbon";
import styles from "./MarathonHeader.module.css";

// The header has its own type: a condensed face for the big words and numbers.
const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-condensed",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-archivo",
});

const BOROUGHS: Record<
  string,
  { name: string; abbr: string; color: string; dark?: boolean; alwaysAbbr?: boolean }
> = {
  "Staten Island": { name: "Staten Island", abbr: "SI", color: "var(--color-brand-red)" },
  Brooklyn: { name: "Brooklyn", abbr: "BK", color: "var(--color-brand-orange)" },
  Queens: { name: "Queens", abbr: "QNS", color: "var(--color-brand-green)", alwaysAbbr: true },
  Manhattan: { name: "Manhattan", abbr: "MAN", color: "var(--color-brand-sky)", dark: true },
  Bronx: { name: "The Bronx", abbr: "BX", color: "var(--color-brand-tan)", dark: true, alwaysAbbr: true },
};

function SegmentLabel({ borough }: { borough: string }) {
  const b = BOROUGHS[borough];
  if (!b) return null;
  if (b.alwaysAbbr) return <span className={`${styles.abbr} ${styles.always}`}>{b.abbr}</span>;
  if (borough === "Staten Island") return <span className={styles.si}>{b.abbr}</span>;
  return (
    <>
      <span className={styles.full}>{b.name}</span>
      <span className={styles.abbr}>{b.abbr}</span>
    </>
  );
}

/** Branded header for the standalone tracker. The logo is not a link: there is nowhere to navigate to. */
export default function MarathonHeader() {
  const course = getMarathonCourse();
  const basemap = getNycBasemap();
  const finishers = getMarathonFinisherCount();
  const route = course ? routeShape(course) : null;
  const segments = course && basemap ? boroughSegments(course, basemap) : [];
  const ribbonLabel = segments.map((s) => BOROUGHS[s.borough]?.name ?? s.borough).join(", ");

  return (
    <header className={`${styles.header} ${condensed.variable} ${archivo.variable}`}>
      <div className={styles.inner}>
        <div className={styles.top}>
          {route ? (
            <svg
              className={styles.route}
              viewBox={route.viewBox}
              role="img"
              aria-label="The marathon course drawn as one line, from Staten Island to Central Park"
            >
              <path d={route.d} fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <path d={route.d} fill="none" stroke="var(--acc)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={route.start.x} cy={route.start.y} r="3.4" fill="#0b0b0b" stroke="#fff" strokeWidth="1.6" />
              <circle cx={route.end.x} cy={route.end.y} r="3.8" fill="var(--acc)" />
            </svg>
          ) : null}
          <div className={styles.copy}>
            <p className={styles.eyebrow}>
              <Image
                src="/npr-logo.png"
                alt="Narrow Path Runners"
                width={66}
                height={66}
                className={styles.logo}
                priority
              />
              <span>Narrow Path Runners</span>
              <i className={styles.tri} aria-hidden="true">
                <b />
                <b />
                <b />
              </i>
            </p>
            <p className={styles.headline}>
              NYC
              <br />
              Marathon
            </p>
            <p className={styles.date}>Sunday · Nov 1 · 2026</p>
          </div>
        </div>

        {course && segments.length > 0 ? (
          <div className={styles.ribbon} role="img" aria-label={`The course by borough: ${ribbonLabel}`}>
            <div className={styles.track} aria-hidden="true">
              {segments.map((s) => {
                const b = BOROUGHS[s.borough];
                return (
                  <div
                    key={`${s.borough}-${s.from}`}
                    className={`${styles.seg} ${b?.dark ? styles.dark : ""}`}
                    style={{ flex: s.to - s.from, background: b?.color }}
                  >
                    <SegmentLabel borough={s.borough} />
                  </div>
                );
              })}
            </div>
            <div className={styles.ticks} aria-hidden="true">
              {[5, 10, 15, 20, 25].map((m) => (
                <span key={m} className={styles.tick} style={{ left: `${(m / course.miles) * 100}%` }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.band}>
        <dl className={styles.stats}>
          {finishers > 0 ? (
            <div>
              <dt>Finishers</dt>
              <dd>{finishers}</dd>
            </div>
          ) : null}
          <div>
            <dt>Miles</dt>
            <dd>26.2</dd>
          </div>
          <div>
            <dt>Boroughs</dt>
            <dd>5</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
