/**
 * Server-only Gemini client. The API key lives in Vercel's environment
 * variables and never reaches the browser.
 */
export type ChatTurn = { role: "user" | "model"; text: string };

const key = () => process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "";
const model = () => process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const base = () => process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

export function aiEnabled(): boolean {
  return key().length > 0;
}

type Result = { text: string; error?: undefined } | { text?: undefined; error: string };

async function call(opts: { system: string; turns: ChatTurn[]; json?: boolean; maxTokens?: number; timeoutMs?: number }): Promise<Result> {
  if (!aiEnabled()) return { error: "GEMINI_API_KEY is not set" };
  const m = model();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(`${base()}/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 800,
          temperature: opts.json ? 0.9 : 0.6,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
          // 2.5 models "think" first; without this the thinking can use up the whole budget and return no text.
          ...(/2\.5/.test(m) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let message = body.slice(0, 300);
      try {
        message = JSON.parse(body)?.error?.message ?? message;
      } catch {
        /* not JSON */
      }
      console.error(`[gemini] HTTP ${res.status} from ${m}: ${message}`);
      return { error: `HTTP ${res.status}: ${message}` };
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      const reason = cand?.finishReason || data?.promptFeedback?.blockReason || "empty response";
      console.error(`[gemini] no text from ${m}: ${reason}`);
      return { error: `No text returned (${reason})` };
    }
    return { text };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "timed out" : String(e);
    console.error(`[gemini] request failed: ${msg}`);
    return { error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the model's text, or null on any failure (the reason is logged). */
export async function gemini(opts: Parameters<typeof call>[0]): Promise<string | null> {
  const r = await call(opts);
  return r.text ?? null;
}

/** A tiny live check used by /api/health, so a broken key or model name is easy to spot. */
export async function geminiStatus(): Promise<{ ok: boolean; model: string; detail: string }> {
  if (!aiEnabled()) return { ok: false, model: model(), detail: "GEMINI_API_KEY is not set" };
  const r = await call({ system: "Reply with the single word: ok", turns: [{ role: "user", text: "ping" }], maxTokens: 20, timeoutMs: 10000 });
  return { ok: Boolean(r.text), model: model(), detail: r.text ? "ok" : r.error ?? "unknown" };
}
