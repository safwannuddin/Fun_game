/**
 * Server-only Gemini client. The API key lives in Vercel's environment
 * variables and never reaches the browser.
 */
export type ChatTurn = { role: "user" | "model"; text: string };

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function gemini(opts: {
  system: string;
  turns: ChatTurn[];
  json?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 400,
          temperature: opts.json ? 0.9 : 0.6,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("");
    return text?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
