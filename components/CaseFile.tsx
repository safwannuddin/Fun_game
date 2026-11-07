"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MAX_GUESSES, POINTS } from "@/lib/scoring";

interface Props {
  round: number;
  clues: string[];
  shown: number;
  onReveal: () => void;
  guessesLeft: number;
  log: string[];
}

/** NullByte's riddle card. Clues unlock one at a time; each extra clue costs points. */
export default function CaseFile({ round, clues, shown, onReveal, guessesLeft, log }: Props) {
  return (
    <aside className="panel flex flex-col gap-4 p-5" aria-label="Case file">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Case {String(round + 1).padStart(2, "0")} · message from NullByte</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">Which device did I infect?</h2>
        </div>
        <div className="flex gap-1.5 pt-1" aria-label={`${guessesLeft} guesses left`}>
          {Array.from({ length: MAX_GUESSES }).map((_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full ${i < guessesLeft ? "bg-signal" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {clues.slice(0, shown).map((clue, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-line bg-raised px-4 py-3"
            >
              <span className="font-mono text-sm text-signal">{i + 1}</span>
              <p className="font-display text-[17px] leading-snug">&ldquo;{clue}&rdquo;</p>
            </motion.li>
          ))}
        </AnimatePresence>
        {Array.from({ length: clues.length - shown }).map((_, i) => (
          <li key={`locked-${i}`} className="rounded-xl border border-dashed border-line px-4 py-3 font-mono text-sm text-muted">
            Clue {shown + i + 1} · locked
          </li>
        ))}
      </ol>

      {shown < clues.length && (
        <button type="button" onClick={onReveal} className="btn-ghost self-start text-sm">
          Unlock clue {shown + 1} (−{POINTS.extraClue} pts)
        </button>
      )}

      <p className="text-sm text-muted">
        You have {guessesLeft} {guessesLeft === 1 ? "guess" : "guesses"}. Tap the device you suspect in the room. A wrong guess costs points and safety.
      </p>

      {log.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line pt-3 font-mono text-xs text-muted" aria-live="polite">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
