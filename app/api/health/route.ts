import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/** Lets the start screen know whether AI Hacker mode can be offered. */
export function GET() {
  return NextResponse.json({ ok: true, ai: aiEnabled() });
}
