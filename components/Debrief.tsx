"use client";

import { motion } from "framer-motion";
import type { Case } from "@/lib/types";
import { TECHNIQUES } from "@/lib/techniques";

interface Props {
  c: Case;
  solved: boolean;
  points: number;
  reason: string;
  last: boolean;
  onNext: () => void;
}

/** After each case: what was wrong, how the technique works, how to stay safe. */
export default function Debrief({ c, solved, points, reason, last, onNext }: Props) {
  const badLines = c.evidence.lines.filter((l) => l.bad);
  const fix = c.fixes.find((f) => f.ok);
  return (
    <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-2 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="debrief-title"
        className="panel flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col gap-5 overflow-y-auto p-5 sm:p-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${solved ? "bg-safe/15 text-safe" : "bg-danger/15 text-danger"}`}>
            {solved ? `CASE CLOSED · +${points}` : "CASE LOST"}
          </span>
          {!solved && <span className="text-sm text-muted">{reason}</span>}
        </div>
        <div>
          <p className="eyebrow">Technique {solved ? "unlocked" : "revealed"}</p>
          <h2 id="debrief-title" className="mt-1 font-display text-3xl font-extrabold">
            {TECHNIQUES[c.technique].name}
          </h2>
          <p className="mt-2 max-w-[65ch] text-text/90">{c.lesson.how}</p>
        </div>

        <div className="rounded-xl border border-line bg-[#090e1a] p-4">
          <p className="eyebrow mb-2">The giveaway</p>
          <ul className="flex flex-col gap-3">
            {badLines.map((l, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <code className="overflow-x-auto whitespace-pre font-mono text-[13px] text-[#ffb0ba]">{l.text}</code>
                <span className="text-sm text-muted">{l.why}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-raised p-4">
            <p className="eyebrow mb-1">How to spot it</p>
            <p className="text-sm">{c.lesson.spot}</p>
          </div>
          <div className="rounded-xl bg-raised p-4">
            <p className="eyebrow mb-1">The right move</p>
            <p className="text-sm">{fix?.text}</p>
            <p className="mt-1 text-sm text-muted">{c.lesson.tip}</p>
          </div>
          {c.lesson.vibe && (
            <div className="rounded-xl border border-dashed border-signal/70 p-4 sm:col-span-2">
              <p className="eyebrow mb-1 text-signal">For vibe coders</p>
              <p className="text-sm">{c.lesson.vibe}</p>
            </div>
          )}
        </div>

        <button type="button" className="btn self-start" onClick={onNext} autoFocus>
          {last ? "See the final report" : "Next case"}
        </button>
      </motion.section>
    </motion.div>
  );
}
