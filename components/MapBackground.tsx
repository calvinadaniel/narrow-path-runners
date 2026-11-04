import { graticule, ringsPath, windowProjection, type Basemap } from "@/lib/basemap";

const WIDTH = 1000;
const STEP = 0.05; // degrees between grid lines, about 5 km

const LABEL = "text-xs font-bold text-brand-ink whitespace-nowrap";

const lat = (n: number) => `${Math.abs(n).toFixed(2)}° ${n >= 0 ? "N" : "S"}`;
const lng = (n: number) => `${Math.abs(n).toFixed(2)}° ${n >= 0 ? "E" : "W"}`;

/**
 * A faded map of New York with latitude and longitude lines, fixed behind the
 * page. It fills the screen and crops to fit: a wide screen loses the top and
 * bottom of the map, a tall one loses the sides. Labels inside the drawing cover
 * the edges that survive the crop; plain text labels cover the other axis, placed
 * by percentage so they stay on screen whichever way it crops.
 */
export default function MapBackground({ basemap }: { basemap: Basemap }) {
  const proj = windowProjection(basemap.window, WIDTH);
  const { lats, lngs } = graticule(basemap.window, STEP);
  const w = proj.width;
  const h = proj.height;

  return (
    <div
      aria-hidden="true"
      data-testid="map-background"
      className="fixed inset-0 z-0 pointer-events-none opacity-35"
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
      >
        <rect x={0} y={0} width={w} height={h} className="fill-brand-sky" />
        <path
          d={ringsPath(basemap.land, proj)}
          className="fill-white stroke-white"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {basemap.boroughs.map((b) => (
          <path
            key={b.name}
            d={ringsPath(b.rings, proj)}
            fillRule="evenodd"
            className="fill-white stroke-brand-tan"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        ))}
        {basemap.parks.map((p) => (
          <path key={p.name} d={ringsPath([p.ring], proj)} className="fill-brand-green/40" />
        ))}

        <g className="stroke-brand-ink" strokeWidth={0.8} strokeDasharray="5 5" fill="none">
          {lats.map((n) => {
            const y = proj.project(n, basemap.window.west).y;
            return <line key={`lat-${n}`} x1={0} x2={w} y1={y} y2={y} />;
          })}
          {lngs.map((n) => {
            const x = proj.project(basemap.window.south, n).x;
            return <line key={`lng-${n}`} x1={x} x2={x} y1={0} y2={h} />;
          })}
        </g>

        <g className="fill-brand-ink font-bold" fontSize={14}>
          {lats.flatMap((n) => {
            const y = proj.project(n, basemap.window.west).y - 5;
            return [
              <text key={`lat-l-${n}`} x={8} y={y}>
                {lat(n)}
              </text>,
              <text key={`lat-r-${n}`} x={w - 8} y={y} textAnchor="end">
                {lat(n)}
              </text>,
            ];
          })}
          {lngs.flatMap((n) => {
            const x = proj.project(basemap.window.south, n).x + 5;
            return [
              <text key={`lng-t-${n}`} x={x} y={18}>
                {lng(n)}
              </text>,
              <text key={`lng-b-${n}`} x={x} y={h - 8}>
                {lng(n)}
              </text>,
            ];
          })}
        </g>
      </svg>

      {/* Tall screens: the sides are cropped, so label the latitude lines on the screen's edges. */}
      {lats.flatMap((n) => {
        const top = `${(proj.project(n, basemap.window.west).y / h) * 100}%`;
        return (["left-1.5", "right-1.5"] as const).map((side) => (
          <span key={`lat-h-${side}-${n}`} className={`map-label-tall-only absolute ${side} -translate-y-full ${LABEL}`} style={{ top }}>
            {lat(n)}
          </span>
        ));
      })}
      {/* Wide screens: the top and bottom are cropped, so label the longitude lines below the header and at the foot. */}
      {lngs.flatMap((n) => {
        const left = `${(proj.project(basemap.window.south, n).x / w) * 100}%`;
        return (["top-[108px]", "bottom-2"] as const).map((edge) => (
          <span key={`lng-h-${edge}-${n}`} className={`map-label-wide-only absolute ml-1.5 ${edge} ${LABEL}`} style={{ left }}>
            {lng(n)}
          </span>
        ));
      })}
    </div>
  );
}
