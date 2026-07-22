import type { RaceResult } from "@/lib/types";

export default function ResultsTable({ results }: { results: RaceResult[] }) {
  const sorted = [...results].sort(
    (a, b) => (a.placement ?? Infinity) - (b.placement ?? Infinity)
  );
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b-2 border-brand-green/30 bg-brand-green/5">
          <th className="py-2 font-black text-brand-ink">Place</th>
          <th className="py-2 font-black text-brand-ink">Runner</th>
          <th className="py-2 font-black text-brand-ink">Time</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((result) => (
          <tr key={result.runnerId} className="border-b border-brand-ink/10">
            <td className="py-2">{result.placement ?? "—"}</td>
            <td className="py-2">
              <a href={`/roster/${result.runnerId}`} className="page-link font-bold">
                {result.runnerName}
              </a>
              {result.personalRecord && (
                <span className="ml-2 text-xs font-black text-brand-orange">
                  PR
                </span>
              )}
            </td>
            <td className="py-2">{result.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
