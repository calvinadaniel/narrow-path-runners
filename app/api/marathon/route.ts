import { getMarathonSnapshot } from "@/lib/marathon";

// Route Handlers aren't cached by default; this one must run per request and
// lean on getMarathonSnapshot's short-lived cache plus the CDN header below.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getMarathonSnapshot();
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
      },
    });
  } catch {
    return Response.json(
      { error: "Live tracking is unavailable right now." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
