import { getAllRunnerProfiles } from "@/lib/runners";
import RunnerCard from "@/components/RunnerCard";

export default function RosterPage() {
  const profiles = getAllRunnerProfiles();
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Roster</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <RunnerCard key={profile.id} profile={profile} />
        ))}
      </div>
    </main>
  );
}
