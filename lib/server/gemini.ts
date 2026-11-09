/**
 * Server-only Gemini client. The API key lives in Vercel's environment
 * variables and never reaches the browser.
 */
export type ChatTurn = { role: "user" | "model"; text: string };

const key = () => process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "";
const base = () => process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

/**
 * Model choice: GEMINI_MODEL if set, otherwise the newest stable "flash" model this
 * key can use, discovered from Google's model list (models get retired over time,
 * so a hard-coded name eventually breaks).
 */
let discovered: Promise<string> | null = null;
const FALLBACK_MODEL = "gemini-flash-latest";

function versionOf(name: string): number {
  const m = name.match(/gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

async function discoverModel(): Promise<string> {
  try {
    const res = await fetch(`${base()}/v1beta/models?pageSize=200`, { headers: { "x-goog-api-key": key() }, cache: "no-store" });
    if (!res.ok) return FALLBACK_MODEL;
    const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const usable = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /flash/.test(n) && !/lite|image|tts|audio|live|embed|thinking/.test(n));
    const stable = usable.filter((n) => !/preview|exp/.test(n));
    const pool = stable.length ? stable : usable;
    pool.sort((a, b) => versionOf(b) - versionOf(a) || a.length - b.length);
    return pool[0] ?? FALLBACK_MODEL;
  } catch {
    return FALLBACK_MODEL;
  }
}

async function resolveModel(forceDiscover = false): Promise<string> {
  const pinned = process.env.GEMINI_MODEL?.trim();
  if (pinned && !forceDiscover) return pinned;
  if (forceDiscover) discovered = null;
  discovered ??= discoverModel();
  return discovered;
}

export function aiEnabled(): boolean {
  return key().length > 0;
}

type Result = { text: string; error?: undefined } | { text?: undefined; error: string };

type CallOpts = { system: string; turns: ChatTurn[]; json?: boolean; maxTokens?: number; timeoutMs?: number };

async function call(opts: CallOpts, retried = false): Promise<Result & { model?: string }> {
  if (!aiEnabled()) return { error: "GEMINI_API_KEY is not set" };
  const m = await resolveModel(retried);
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
          // Newer models think before answering; leave room for that plus the reply.
          maxOutputTokens: /2\.5/.test(m) ? opts.maxTokens ?? 800 : Math.max(opts.maxTokens ?? 800, 2048),
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
      // Retired or unknown model: look up a current one once and retry.
      if (res.status === 404 && !retried) return call(opts, true);
      return { error: `HTTP ${res.status} (${m}): ${message}`, model: m };
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      const reason = cand?.finishReason || data?.promptFeedback?.blockReason || "empty response";
      console.error(`[gemini] no text from ${m}: ${reason}`);
      return { error: `No text returned (${reason})` };
    }
    return { text, model: m };
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
  if (!aiEnabled()) return { ok: false, model: "", detail: "GEMINI_API_KEY is not set" };
  const r = await call({ system: "Reply with the single word: ok", turns: [{ role: "user", text: "ping" }], maxTokens: 64, timeoutMs: 15000 });
  return { ok: Boolean(r.text), model: r.model ?? (await resolveModel()), detail: r.text ? "ok" : r.error ?? "unknown" };
}
