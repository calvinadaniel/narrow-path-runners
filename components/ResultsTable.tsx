import type { RaceResult } from "@/lib/types";

export default function ResultsTable({ results }: { results: RaceResult[] }) {
  const sorted = [...results].sort(
    (a, b) => (a.placement ?? Infinity) - (b.placement ?? Infinity)
  );
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-brand-forest/20">
          <th className="py-2">Place</th>
          <th className="py-2">Runner</th>
          <th className="py-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((result) => (
          <tr key={result.runnerId} className="border-b border-brand-forest/10">
            <td className="py-2">{result.placement ?? "—"}</td>
            <td className="py-2">
              <a href={`/roster/${result.runnerId}`} className="hover:underline">
                {result.runnerName}
              </a>
              {result.personalRecord && (
                <span className="ml-2 text-xs font-semibold text-brand-terracotta">
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
