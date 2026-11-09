import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/server/gemini";
import { leaderboardEnabled } from "@/lib/server/redis";

export const dynamic = "force-dynamic";

/** Tells the client which live features are configured on this deployment. */
export function GET() {
  return NextResponse.json({ ai: aiEnabled(), leaderboard: leaderboardEnabled() });
}
