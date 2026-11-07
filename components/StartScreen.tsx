"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TECHNIQUES, TECHNIQUE_IDS } from "@/lib/techniques";
import { topThisWeek, type ScoreEntry } from "@/lib/leaderboard";
import { setSound, soundOn } from "@/lib/sound";
import { ROUNDS, ROUND_SECONDS } from "@/lib/scoring";
import Pixel from "./Pixel";

interface Props {
  onStart: (name: string, ai: boolean) => void;
}

const HOW = [
  { n: "01", t: "Read the riddle", d: "NullByte leaves up to 3 clues about the infected device." },
  { n: "02", t: "Guess the device", d: "Tap what you suspect in the room. You get 3 guesses." },
  { n: "03", t: "Inspect the evidence", d: "Read its code, email source or terminal output and flag the bad lines." },
  { n: "04", t: "Name it and fix it", d: "Say what the attack is, choose the fix, and unlock the technique." },
];

export default function StartScreen({ onStart }: Props) {
  const [name, setName] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [ai, setAi] = useState(false);
  const [sound, setSoundState] = useState(true);
  const [board, setBoard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    setBoard(topThisWeek());
    setSoundState(soundOn());
    try {
      setName(localStorage.getItem("crr:name") ?? "");
    } catch {
      /* ignore */
    }
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { ai?: boolean }) => setAiAvailable(Boolean(d.ai)))
      .catch(() => setAiAvailable(false));
  }, []);

  const start = () => {
    const n = name.trim().slice(0, 16) || "Analyst";
    try {
      localStorage.setItem("crr:name", n);
    } catch {
      /* ignore */
    }
    onStart(n, ai && aiAvailable);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <motion.section className="panel relative flex flex-col gap-6 overflow-hidden p-6 sm:p-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Pixel safety={100} size={40} />
          <p className="eyebrow">CSDT Student Ambassador · Cyber escape room</p>
        </div>
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Code <span className="text-danger">Red</span> Room
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg text-text/85">
            The hacker <b>NullByte</b> has hidden an attack somewhere in Pixel&apos;s room and left riddles to taunt you. Work out which device is infected, read the
            evidence like a security analyst, and name the attack before time runs out.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2">
          {HOW.map((s) => (
            <li key={s.n} className="rounded-xl border border-line bg-raised/60 p-4">
              <span className="font-mono text-xs text-signal">{s.n}</span>
              <p className="mt-1 font-display font-semibold">{s.t}</p>
              <p className="text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <label className="flex flex-col gap-1.5" htmlFor="analyst-name">
            <span className="eyebrow">Your analyst name</span>
            <input
              id="analyst-name"
              value={name}
              maxLength={16}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Safwan"
              autoComplete="off"
              className="rounded-lg border border-line bg-ink px-4 py-3 text-base outline-none focus:border-signal"
            />
          </label>

          {aiAvailable && (
            <label className="flex items-start gap-3 rounded-xl border border-line bg-raised/60 p-4 text-sm" htmlFor="ai-mode">
              <input id="ai-mode" type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#ff8a3d]" />
              <span>
                <b>AI Hacker mode.</b> Gemini writes a brand-new case every round, clues and evidence included. If the AI is slow, the game falls back to the
                built-in cases automatically.
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn text-base">
              Open case 01
            </button>
            <button
              type="button"
              className="btn-ghost"
              aria-pressed={sound}
              onClick={() => {
                setSound(!sound);
                setSoundState(!sound);
              }}
            >
              Sound {sound ? "on" : "off"}
            </button>
          </div>
          <p className="text-xs text-muted">
            {ROUNDS} cases · {ROUND_SECONDS} seconds each · works on any phone
          </p>
        </form>
      </motion.section>

      <div className="flex flex-col gap-5">
        <section className="panel flex flex-col gap-3 p-5" aria-labelledby="board-title">
          <p id="board-title" className="eyebrow">
            This week&apos;s top analysts
          </p>
          {board.length === 0 ? (
            <p className="text-sm text-muted">No scores yet this week. Be the first on the board.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {board.map((s, i) => (
                <li key={`${s.name}-${s.at}`} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg bg-raised px-3 py-2">
                  <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate">{s.name}</span>
                  <span className="font-mono tabular-nums">{s.score}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-xs text-muted">Resets every Monday.</p>
        </section>

        <section className="panel flex flex-col gap-3 p-5" aria-labelledby="tech-title">
          <p id="tech-title" className="eyebrow">
            {TECHNIQUE_IDS.length} techniques to unlock
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {TECHNIQUE_IDS.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                {TECHNIQUES[t].name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
