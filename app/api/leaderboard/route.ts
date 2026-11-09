import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { leaderboardEnabled, pipeline } from "@/lib/server/redis";
import { weekKey } from "@/lib/week";

export const dynamic = "force-dynamic";

const TWO_WEEKS = 60 * 60 * 24 * 14;
const keys = () => {
  const wk = weekKey();
  return { board: `lb:${wk}`, meta: `lb:meta:${wk}` };
};

export interface BoardEntry {
  name: string;
  character: string;
  avatar: "male" | "female";
  xp: number;
  days: number;
}

/** GET /api/leaderboard: this week's top 10. */
export async function GET() {
  if (!leaderboardEnabled()) return NextResponse.json({ entries: [], enabled: false });
  const { board, meta } = keys();
  const top = await pipeline([["ZREVRANGE", board, 0, 9, "WITHSCORES"]]);
  const flat = (top?.[0] as string[] | null) ?? [];
  const ids: string[] = [];
  const scores: number[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    ids.push(flat[i]);
    scores.push(Number(flat[i + 1]));
  }
  if (!ids.length) return NextResponse.json({ entries: [], enabled: true });
  const metas = await pipeline([["HMGET", meta, ...ids]]);
  const rows = (metas?.[0] as (string | null)[] | null) ?? [];
  const entries: BoardEntry[] = ids.map((_, i) => {
    let m: Partial<BoardEntry> = {};
    try {
      m = rows[i] ? JSON.parse(rows[i] as string) : {};
    } catch {
      /* ignore */
    }
    return { name: m.name ?? "Player", character: m.character ?? "", avatar: m.avatar === "female" ? "female" : "male", xp: scores[i], days: m.days ?? 0 };
  });
  return NextResponse.json({ entries, enabled: true });
}

const post = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  name: z.string().trim().min(1).max(24),
  character: z.string().trim().max(16),
  avatar: z.enum(["male", "female"]),
  xp: z.number().int().min(0).max(1000),
  days: z.number().int().min(0).max(10),
});

/** POST /api/leaderboard: records a player's XP (keeps their best this week). Emails are hashed, never stored. */
export async function POST(req: Request) {
  if (!leaderboardEnabled()) return NextResponse.json({ ok: false, enabled: false });
  const parsed = post.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const p = parsed.data;
  const id = createHash("sha256").update(p.email).digest("hex").slice(0, 20);
  const { board, meta } = keys();
  const res = await pipeline([
    ["ZADD", board, "GT", p.xp, id],
    ["HSET", meta, id, JSON.stringify({ name: p.name, character: p.character, avatar: p.avatar, days: p.days })],
    ["EXPIRE", board, TWO_WEEKS],
    ["EXPIRE", meta, TWO_WEEKS],
  ]);
  return NextResponse.json({ ok: Boolean(res) });
}
