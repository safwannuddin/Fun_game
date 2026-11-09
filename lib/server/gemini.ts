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
let discovered: Promise<string[]> | null = null;
const FALLBACK_MODEL = "gemini-flash-latest";

function versionOf(name: string): number {
  const m = name.match(/gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

async function discoverModels(): Promise<string[]> {
  try {
    const res = await fetch(`${base()}/v1beta/models?pageSize=200`, { headers: { "x-goog-api-key": key() }, cache: "no-store" });
    if (!res.ok) return [FALLBACK_MODEL];
    const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const usable = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /flash/.test(n) && !/lite|image|tts|audio|live|embed|thinking/.test(n));
    const rank = (n: string) => (/preview|exp/.test(n) ? 1 : 0); // stable first, then previews
    usable.sort((a, b) => rank(a) - rank(b) || versionOf(b) - versionOf(a) || a.length - b.length);
    return usable.length ? [...usable, FALLBACK_MODEL] : [FALLBACK_MODEL];
  } catch {
    return [FALLBACK_MODEL];
  }
}

/** Models to try, best first: the pinned one (if any), then discovered ones. */
async function candidateModels(): Promise<string[]> {
  discovered ??= discoverModels();
  const list = await discovered;
  if (list.length === 1 && list[0] === FALLBACK_MODEL) discovered = null; // discovery failed: try again next time
  const pinned = process.env.GEMINI_MODEL?.trim();
  return [...new Set([...(pinned ? [pinned] : []), ...list])].slice(0, 4);
}

export function aiEnabled(): boolean {
  return key().length > 0;
}

type Result = { text: string; error?: undefined } | { text?: undefined; error: string };

type CallOpts = { system: string; turns: ChatTurn[]; json?: boolean; maxTokens?: number; timeoutMs?: number };

/** Statuses that mean "this model can't serve right now", so the next model is tried. */
const TRY_NEXT = new Set([404, 429, 500, 503]);

async function callModel(m: string, opts: CallOpts): Promise<Result & { status?: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12000);
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
      return { error: `HTTP ${res.status} (${m}): ${message}`, status: res.status };
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) {
      const reason = cand?.finishReason || data?.promptFeedback?.blockReason || "empty response";
      console.error(`[gemini] no text from ${m}: ${reason}`);
      return { error: `No text returned from ${m} (${reason})`, status: 503 };
    }
    return { text };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "timed out" : String(e);
    console.error(`[gemini] ${m} request failed: ${msg}`);
    return { error: `${m}: ${msg}`, status: 503 };
  } finally {
    clearTimeout(timer);
  }
}

/** Tries each candidate model in turn until one answers. */
async function call(opts: CallOpts): Promise<Result & { model?: string }> {
  if (!aiEnabled()) return { error: "GEMINI_API_KEY is not set" };
  let last: Result = { error: "No model available" };
  for (const m of await candidateModels()) {
    const r = await callModel(m, opts);
    if (r.text) return { text: r.text, model: m };
    last = r;
    if (!r.status || !TRY_NEXT.has(r.status)) break; // bad key or request: other models won't help
  }
  return last;
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
  return { ok: Boolean(r.text), model: r.model ?? "", detail: r.text ? "ok" : r.error ?? "unknown" };
}
