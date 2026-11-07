import { NextResponse } from "next/server";
import { pickBankCase } from "@/lib/cases";
import { generateWithGemini, aiEnabled } from "@/lib/gemini";
import { deviceSchema, toCase } from "@/lib/schema";
import type { DeviceId } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/case?device=laptop&ai=1&seen=id1,id2
 * Returns an AI-generated case when AI is on and the reply passes validation,
 * otherwise a case from the built-in bank. The API key never leaves the server.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = deviceSchema.safeParse(url.searchParams.get("device"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown device" }, { status: 400 });
  }
  const device = parsed.data as DeviceId;
  const wantAi = url.searchParams.get("ai") === "1";
  const seen = (url.searchParams.get("seen") ?? "").split(",").filter(Boolean).slice(0, 50);

  if (wantAi && aiEnabled()) {
    const raw = await generateWithGemini(device);
    const aiCase = raw ? toCase(raw, device) : null;
    if (aiCase) return NextResponse.json({ case: aiCase, fallback: false });
    return NextResponse.json({ case: pickBankCase(device, seen), fallback: true });
  }

  return NextResponse.json({ case: pickBankCase(device, seen), fallback: false });
}
