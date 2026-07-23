import type { RaceResult } from "@/lib/types";

export default function ResultsTable({ results }: { results: RaceResult[] }) {
  const sorted = [...results].sort(
    (a, b) => (a.placement ?? Infinity) - (b.placement ?? Infinity)
  );
  return (
    <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[20rem] text-left border-collapse text-sm sm:text-base">
        <thead>
          <tr className="border-b-2 border-brand-green/30 bg-brand-green/5">
            <th className="py-2 pr-3 font-black text-brand-ink whitespace-nowrap">
              Place
            </th>
            <th className="py-2 pr-3 font-black text-brand-ink">Runner</th>
            <th className="py-2 font-black text-brand-ink whitespace-nowrap">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result) => (
            <tr key={result.runnerId} className="border-b border-brand-ink/10">
              <td className="py-2 pr-3 whitespace-nowrap">
                {result.placement ?? "—"}
              </td>
              <td className="py-2 pr-3">
                <a
                  href={`/roster/${result.runnerId}`}
                  className="page-link font-bold break-words"
                >
                  {result.runnerName}
                </a>
                {result.personalRecord && (
                  <span className="ml-2 text-xs font-black text-brand-orange">
                    PR
                  </span>
                )}
              </td>
              <td className="py-2 whitespace-nowrap">{result.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
