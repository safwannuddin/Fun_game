"use client";

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import type { Case, TechniqueId } from "@/lib/types";
import { TECHNIQUES } from "@/lib/techniques";
import { DEVICES } from "@/lib/devices";
import { POINTS } from "@/lib/scoring";

export type EvidenceStep = "flag" | "verdict" | "fix";

interface Props {
  c: Case;
  step: EvidenceStep;
  time: number;
  flagged: number[];
  wrongFlags: number[];
  onFlag: (i: number) => void;
  pixelHint: string | null;
  onPixelHint: () => void;
  verdictOptions: TechniqueId[];
  wrongVerdicts: TechniqueId[];
  onVerdict: (t: TechniqueId) => void;
  fixOrder: number[];
  wrongFixes: number[];
  onFix: (i: number) => void;
  shakeKey: number;
}

const LANG_LABEL: Record<Case["evidence"]["lang"], string> = {
  js: "JavaScript",
  eml: "Raw email",
  json: "Message payload",
  shell: "Terminal",
  txt: "Text",
};

/** Light-touch highlighting: strings, comments and prompts. */
function Highlight({ text }: { text: string }) {
  if (/^\s*(\/\/|#)/.test(text)) return <span className="text-muted">{text}</span>;
  if (text.startsWith("$ ")) {
    return (
      <>
        <span className="text-safe">$ </span>
        <span className="text-text">{text.slice(2)}</span>
      </>
    );
  }
  const parts = text.split(/("[^"]*"|'[^']*'|`[^`]*`)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^["'`]/.test(p) ? (
          <span key={i} className="text-[#ffc38f]">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

const STEPS: { id: EvidenceStep; label: string }[] = [
  { id: "flag", label: "Flag the evidence" },
  { id: "verdict", label: "Name the attack" },
  { id: "fix", label: "Choose the fix" },
];

export default function EvidenceViewer(p: Props) {
  const { c, step } = p;
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const found = p.flagged.length;
  const shake = useAnimationControls();
  useEffect(() => {
    if (p.shakeKey) shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.35 } });
  }, [p.shakeKey, shake]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-2 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div animate={shake} className="flex w-full max-w-3xl justify-center">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        className="panel flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        {/* header */}
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow">
              Evidence · {DEVICES[c.device].name}
              {c.source === "ai" ? " · AI-generated case" : ""}
            </p>
            <h2 id="evidence-title" className="mt-1 font-display text-2xl font-extrabold text-balance">
              {c.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{c.story}</p>
          </div>
          <div
            className={`shrink-0 rounded-lg border border-line px-3 py-1.5 font-mono text-lg tabular-nums ${p.time <= 15 ? "text-danger animate-blink" : "text-signal"}`}
            aria-label={`${p.time} seconds left`}
          >
            {p.time}s
          </div>
        </header>

        {/* stepper */}
        <ol className="flex gap-1 border-b border-line px-5 py-3 text-xs">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                i === stepIndex ? "bg-signal text-ink font-semibold" : i < stepIndex ? "bg-raised text-safe" : "bg-raised text-muted"
              }`}
            >
              <span className="font-mono">{i < stepIndex ? "✓" : i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </li>
          ))}
        </ol>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* code view */}
          <div className="overflow-hidden rounded-xl border border-line bg-[#090e1a]">
            <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 font-mono text-xs text-muted">
              <span className="truncate">{c.evidence.file}</span>
              <span className="shrink-0">{LANG_LABEL[c.evidence.lang]}</span>
            </div>
            <div className="overflow-x-auto">
              <ol className="min-w-max py-2 font-mono text-[13px] leading-6">
                {c.evidence.lines.map((line, i) => {
                  const isFlagged = p.flagged.includes(i);
                  const isWrong = p.wrongFlags.includes(i);
                  const reveal = isFlagged || isWrong;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={step !== "flag" || isFlagged || isWrong}
                        onClick={() => p.onFlag(i)}
                        className={`group grid w-full grid-cols-[2.5rem_1fr] text-left transition ${
                          isFlagged
                            ? "bg-danger/15"
                            : isWrong
                              ? "bg-raised/60 opacity-70"
                              : step === "flag"
                                ? "hover:bg-raised"
                                : ""
                        }`}
                      >
                        <span className={`select-none pr-3 text-right ${isFlagged ? "text-danger" : "text-[#4b5878]"}`}>{isFlagged ? "⚑" : i + 1}</span>
                        <span className="whitespace-pre pr-4">
                          <Highlight text={line.text} />
                        </span>
                        {reveal && (
                          <span className={`col-start-2 block max-w-[min(62ch,calc(100vw-7rem))] whitespace-normal pb-1 pr-4 font-sans text-xs ${isFlagged ? "text-[#ffb0ba]" : "text-muted"}`}>
                            {isFlagged ? "Red flag: " : "Not this one: "}
                            {line.why}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {step === "flag" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {c.need > 1 ? `Tap the ${c.need} lines that give the attack away.` : "Tap the line that gives the attack away."}
                </p>
                <span className="font-mono text-sm text-signal">
                  {found}/{c.need} flagged
                </span>
              </div>
              {p.pixelHint ? (
                <p className="rounded-lg border border-line bg-raised px-3 py-2 text-sm">
                  <b className="text-signal">Pixel:</b> {p.pixelHint}
                </p>
              ) : (
                <button type="button" className="btn-ghost self-start text-sm" onClick={p.onPixelHint}>
                  Ask Pixel where to look (−{POINTS.pixelHint})
                </button>
              )}
            </div>
          )}

          {step === "verdict" && (
            <div className="flex flex-col gap-3">
              <p className="font-medium">What kind of attack is this?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {p.verdictOptions.map((t) => {
                  const wrong = p.wrongVerdicts.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={wrong}
                      onClick={() => p.onVerdict(t)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        wrong ? "border-danger/60 opacity-60" : "border-line bg-raised hover:border-signal"
                      }`}
                    >
                      <span className="block font-display font-semibold">{TECHNIQUES[t].name}</span>
                      <span className="text-sm text-muted">{wrong ? "Not quite. Look at the flagged lines again." : TECHNIQUES[t].blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "fix" && (
            <div className="flex flex-col gap-3">
              <p className="font-medium">
                It&apos;s <span className="text-signal">{TECHNIQUES[c.technique].name}</span>. What should Pixel do?
              </p>
              <div className="flex flex-col gap-2">
                {p.fixOrder.map((i) => {
                  const f = c.fixes[i];
                  const wrong = p.wrongFixes.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={wrong}
                      onClick={() => p.onFix(i)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        wrong ? "border-danger/60 opacity-70" : "border-line bg-raised hover:border-signal"
                      }`}
                    >
                      <span className={c.evidence.lang === "js" ? "font-mono text-sm" : "font-medium"}>{f.text}</span>
                      {wrong && <span className="mt-1 block text-sm text-[#ffb0ba]">{f.why}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.section>
      </motion.div>
    </motion.div>
  );
}
