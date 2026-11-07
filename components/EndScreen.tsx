"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CaseResult } from "@/lib/types";
import { TECHNIQUES } from "@/lib/techniques";
import { DEVICES } from "@/lib/devices";
import { rankFor } from "@/lib/scoring";
import { saveScore } from "@/lib/leaderboard";
import Pixel from "./Pixel";

interface Props {
  name: string;
  score: number;
  safety: number;
  survived: boolean;
  results: CaseResult[];
  onRestart: () => void;
}

export default function EndScreen({ name, score, safety, survived, results, onRestart }: Props) {
  const [saved, setSaved] = useState(false);
  const rank = rankFor(score, survived);
  const solved = results.filter((r) => r.solved).length;

  return (
    <motion.section className="panel flex flex-col gap-6 p-6 sm:p-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-4">
        <Pixel safety={survived ? Math.max(safety, 61) : 0} size={64} />
        <div>
          <p className="eyebrow">{survived ? "Final report · room secured" : "Final report · Pixel was hacked"}</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">{rank.title}</h1>
          <p className="mt-1 text-muted">{rank.note}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          ["Score", score.toString()],
          ["Safety", `${Math.max(0, safety)}%`],
          ["Cases closed", `${solved}/${results.length}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-raised p-4">
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums sm:text-3xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="eyebrow mb-2">Case log</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {results.map((r, i) => (
            <motion.li
              key={r.caseId + i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${r.solved ? "border-safe/40" : "border-danger/40"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{TECHNIQUES[r.technique].name}</p>
                <p className="text-xs text-muted">{DEVICES[r.device].name}</p>
              </div>
              <span className={`font-mono text-sm ${r.solved ? "text-safe" : "text-danger"}`}>{r.solved ? `+${r.points}` : "lost"}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          disabled={saved}
          onClick={() => {
            saveScore({ name, score, safety: Math.max(0, safety) });
            setSaved(true);
          }}
        >
          {saved ? "Saved to the leaderboard" : `Add ${name} to the leaderboard`}
        </button>
        <button type="button" className="btn-ghost" onClick={onRestart}>
          Play again
        </button>
      </div>
    </motion.section>
  );
}
