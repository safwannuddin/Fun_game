"use client";

import { useEffect, useState } from "react";

type Entry = { name: string; character: string; avatar: "male" | "female"; xp: number; days: number };

/** This week's top players across every device. Hidden when the leaderboard isn't configured. */
export default function Leaderboard({ refreshKey = 0, highlight }: { refreshKey?: number; highlight?: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/leaderboard", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ entries: Entry[]; enabled: boolean }>)
        .then((d) => {
          if (!alive) return;
          setEnabled(d.enabled);
          setEntries(d.entries);
        })
        .catch(() => alive && setEnabled(false));
    load();
    const t = setInterval(load, 15000); // live during the demo
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshKey]);

  if (!enabled) return null;

  return (
    <section className="panel flex flex-col gap-3 p-5" aria-labelledby="lb-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lb-title" className="eyebrow">
          Live leaderboard · this week
        </h2>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-safe">
          <span className="h-2 w-2 animate-blink rounded-full bg-safe" />
          live
        </span>
      </div>
      {entries === null ? (
        <p className="text-sm text-muted">Loading scores…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No scores yet this week. Clear Day 1 to get on the board.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((e, i) => {
            const me = highlight && e.name === highlight;
            return (
              <li
                key={`${e.name}-${i}`}
                className={`grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg px-3 py-2 ${me ? "bg-signal/15 ring-1 ring-signal/50" : "bg-raised"}`}
              >
                <span className="font-mono text-signal">{i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.name}</span>
                  <span className="block truncate text-xs text-muted">
                    with {e.character || "their coder"} · Day {e.days}/10
                  </span>
                </span>
                <span className="font-mono tabular-nums">{e.xp} XP</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
