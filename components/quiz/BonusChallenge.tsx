"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Day } from "@/lib/journey";
import { sfx } from "@/lib/sound";

type Bonus = { prompt: string; options: string[]; answer: number; explain: string };

export const BONUS_XP = 20;

/** One fresh AI-written question after a day is cleared. */
export default function BonusChallenge({ day, onCorrect }: { day: Day; onCorrect: () => void }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [bonus, setBonus] = useState<Bonus | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [error, setError] = useState("");
  const awarded = useRef(false); // XP once per finished day; extra questions are practice

  const [bonusCount, setBonusCount] = useState(0);
  const load = async () => {
    setBonusCount((c) => c + 1);
    setState("loading");
    setPicked(null);
    try {
      const res = await fetch(`/api/bonus?day=${day.day}`, { cache: "no-store" });
      const data = (await res.json()) as { bonus?: Bonus; error?: string };
      if (!res.ok || !data.bonus) throw new Error(data.error || "No question");
      setBonus(data.bonus);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create a bonus question.");
      setState("error");
    }
  };

  const choose = (i: number) => {
    if (picked !== null || !bonus) return;
    setPicked(i);
    if (i === bonus.answer) {
      sfx.good();
      if (!awarded.current) {
        awarded.current = true;
        onCorrect();
      }
    } else sfx.bad();
  };

  if (state === "idle" || state === "error") {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" className="btn-ghost self-start" onClick={load}>
          Try an AI bonus challenge (+{BONUS_XP} XP)
          <span className="rounded-full bg-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">New every time</span>
        </button>
        {state === "error" && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line p-4 text-sm text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-signal" />
        {day.teacher.name} is writing a brand-new question…
      </div>
    );
  }

  const b = bonus!;
  const right = picked !== null && picked === b.answer;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full flex-col gap-3 rounded-xl border border-signal/50 p-4">
      <p className="eyebrow text-signal">AI bonus challenge · +{BONUS_XP} XP</p>
      <p className="font-display text-lg font-semibold leading-snug">{b.prompt}</p>
      <div className="grid gap-2">
        {b.options.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={picked !== null}
            onClick={() => choose(i)}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
              picked === null
                ? "border-line bg-raised hover:border-signal"
                : i === b.answer
                  ? "border-safe bg-safe/10"
                  : i === picked
                    ? "border-danger bg-danger/10"
                    : "border-line opacity-50"
            }`}
          >
            <span className="mr-2 font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="flex flex-col gap-2">
          <p className={`text-sm ${right ? "text-safe" : "text-danger"}`}>
            <b>{right ? (awarded.current && bonusCount > 1 ? "Correct! " : `Correct! +${BONUS_XP} XP. `) : "Not quite. "}</b>
            <span className="text-text">{b.explain}</span>
          </p>
          <button type="button" className="btn-ghost self-start text-sm" onClick={load}>
            Another one (practice)
          </button>
        </div>
      )}
    </motion.div>
  );
}
