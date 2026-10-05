import { NextResponse } from "next/server";
import { loadView } from "@/lib/view";

export async function GET() {
  const v = loadView();
  return NextResponse.json({
    ok: true,
    kingdomName: v.kingdomName,
    era: v.era,
    score: v.score,
    population: v.state.population,
    happiness: v.state.happiness,
    resources: v.state.resources,
    capacity: v.cap,
    queues: {
      construction: v.construction.length,
      research: v.research.length,
      training: v.training.length,
      marches: v.marches.length,
    },
    unreadReports: v.unread,
    now: v.resolved.now,
  });
}
export const dynamic = "force-dynamic";

