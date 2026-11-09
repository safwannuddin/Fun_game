"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { STORY, fill } from "@/lib/journey";
import type { AvatarKind } from "@/lib/profile";
import Avatar, { type Mood } from "./Avatar";

const BEATS: { key: keyof typeof STORY; label: string; mood: Mood }[] = [
  { key: "hook", label: "The dream", mood: "happy" },
  { key: "problem", label: "The problem", mood: "sad" },
  { key: "mission", label: "Your mission", mood: "wave" },
];

export default function StoryIntro({ kind, name, onDone }: { kind: AvatarKind; name: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const beat = BEATS[i];
  const last = i === BEATS.length - 1;

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="panel h-80 overflow-hidden sm:h-[26rem]" style={{ background: "radial-gradient(70% 60% at 50% 65%, rgba(255,138,61,.16), transparent 70%)" }}>
        <Avatar kind={kind} mood={beat.mood} moodKey={i} className="h-full w-full" />
      </div>
      <div className="flex flex-col gap-5">
        <ol className="flex gap-2" aria-label="Story progress">
          {BEATS.map((b, j) => (
            <li key={b.key} className={`h-1.5 flex-1 rounded-full ${j <= i ? "bg-signal" : "bg-line"}`} />
          ))}
        </ol>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex flex-col gap-3">
            <p className="eyebrow">{beat.label}</p>
            <p className="font-display text-2xl leading-snug sm:text-3xl">{fill(STORY[beat.key], name)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3">
          {i > 0 && (
            <button type="button" className="btn-ghost" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          <button type="button" className="btn" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? `Start Day 1 with ${name}` : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
