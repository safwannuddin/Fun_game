import { NextResponse } from "next/server";
import { z } from "zod";
import { DAYS } from "@/lib/journey";
import { aiEnabled, gemini } from "@/lib/server/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({
  day: z.number().int().min(1).max(DAYS.length),
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().min(1).max(400) }))
    .min(1)
    .max(12),
});

/** POST /api/teacher: the day's teacher answers a player's question with Gemini. */
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { day: n, messages } = parsed.data;
  if (messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const day = DAYS[n - 1];

  const system = `You are ${day.teacher.name}, a ${day.teacher.role}, teaching inside "Ship It Safe", a cybersecurity learning game for school visitors and university students.
Today's topic is ${day.attack}. Your lesson covered:
${day.lesson.map((l) => `- ${l.replaceAll("{name}", "the student")}`).join("\n")}
Key rule: ${day.rule}

How to answer:
- Stay in character, warm and encouraging, in plain British English for beginners.
- Keep every answer under 90 words. Use a short real-world example where it helps.
- Only discuss ${day.attack}, staying safe online, and secure coding. If asked about anything else, kindly steer back to today's topic.
- Teach defence only. Never give working attack code, step-by-step hacking instructions, or ways to target real people, companies or systems.
- Never ask for or repeat passwords, emails or other personal details.`;

  const reply = await gemini({ system, turns: messages, maxTokens: 300 });
  if (!reply) return NextResponse.json({ error: "The teacher is busy right now. Try again in a moment." }, { status: 502 });
  return NextResponse.json({ reply });
}
