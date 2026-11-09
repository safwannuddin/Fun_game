import { NextResponse } from "next/server";
import { geminiStatus } from "@/lib/server/gemini";
import { leaderboardEnabled, pipeline } from "@/lib/server/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/health: live check of each service. Shows whether the Gemini key and
 * model work and whether the leaderboard database answers. Never returns secrets.
 */
export async function GET() {
  const [ai, db] = await Promise.all([
    geminiStatus(),
    leaderboardEnabled()
      ? pipeline([["PING"]]).then((r) => ({ ok: r?.[0] === "PONG", detail: r ? String(r[0]) : "no response" }))
      : Promise.resolve({ ok: false, detail: "Set KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN), then redeploy" }),
  ]);
  return NextResponse.json({ ai, leaderboard: db }, { status: ai.ok || db.ok ? 200 : 503 });
}
