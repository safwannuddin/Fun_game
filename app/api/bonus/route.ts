import { NextResponse } from "next/server";
import { z } from "zod";
import { DAYS } from "@/lib/journey";
import { aiEnabled, gemini } from "@/lib/server/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bonusSchema = z.object({
  prompt: z.string().min(10).max(300),
  options: z.array(z.string().min(1).max(160)).length(4),
  answer: z.number().int().min(0).max(3),
  explain: z.string().min(10).max(300),
});

export type Bonus = z.infer<typeof bonusSchema>;

/** GET /api/bonus?day=N: Gemini writes one new multiple-choice question for that day. */
export async function GET(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
  const n = Number(new URL(req.url).searchParams.get("day"));
  const day = DAYS[n - 1];
  if (!day) return NextResponse.json({ error: "Unknown day" }, { status: 400 });

  const existing = day.questions.map((q) => `- ${q.prompt}`).join("\n");
  const system = `You write quiz questions for "Ship It Safe", a cybersecurity learning game for beginners (school visitors and university students).
Write ONE new multiple-choice question about ${day.attack}, set in a realistic everyday or student-coding situation.
It must be different from these existing questions:
${existing}
Rules: exactly 4 options, exactly one correct; plausible wrong options; fictional brands only (e.g. SnackSwap, QuickParcel, Brightfield University); no real URLs; no working attack code; plain British English; the explanation says why the answer is right in under 35 words.
Return ONLY JSON: {"prompt": string, "options": [string, string, string, string], "answer": 0-3, "explain": string}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await gemini({ system, turns: [{ role: "user", text: "Write the question now." }], json: true, maxTokens: 500 });
    if (!text) continue;
    try {
      const parsed = bonusSchema.safeParse(JSON.parse(text));
      if (parsed.success) return NextResponse.json({ bonus: parsed.data });
    } catch {
      /* invalid JSON: try once more */
    }
  }
  return NextResponse.json({ error: "Couldn't create a bonus question right now." }, { status: 502 });
}
