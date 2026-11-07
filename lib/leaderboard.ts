/**
 * Leaderboard storage. Today it lives in the browser (localStorage), so it works
 * offline and on any host. Swap these two functions for a database call
 * (Supabase, Firebase, Vercel KV) to make it shared.
 */
export interface ScoreEntry {
  name: string;
  score: number;
  safety: number;
  week: string;
  at: number;
}

const KEY = "crr:scores:v1";

export function weekKey(d = new Date()): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: Omit<ScoreEntry, "week" | "at">): void {
  try {
    const list = loadScores();
    list.push({ ...entry, name: entry.name.slice(0, 16), week: weekKey(), at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    /* storage blocked: score just isn't kept */
  }
}

export function topThisWeek(limit = 8): ScoreEntry[] {
  const wk = weekKey();
  return loadScores()
    .filter((s) => s.week === wk)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
