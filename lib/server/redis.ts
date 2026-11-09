/**
 * Minimal Upstash Redis REST client (works with Upstash or Vercel KV env names).
 */
function creds() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim().replace(/\/$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url, token } : null;
}

export function leaderboardEnabled(): boolean {
  return creds() !== null;
}

/** Runs several commands in one round trip. Returns each command's result, or null on failure. */
export async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const c = creds();
  if (!c) return null;
  try {
    const res = await fetch(`${c.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown; error?: string }[];
    return data.map((d) => (d.error ? null : d.result));
  } catch {
    return null;
  }
}
