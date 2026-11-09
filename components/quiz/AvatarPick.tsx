"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AvatarKind } from "@/lib/profile";
import Avatar from "./Avatar";
import { sfx } from "@/lib/sound";

const DEFAULT_NAME: Record<AvatarKind, string> = { male: "Leo", female: "Maya" };

interface Props {
  playerName: string;
  onPick: (kind: AvatarKind, characterName: string) => void;
}

export default function AvatarPick({ playerName, onPick }: Props) {
  const [kind, setKind] = useState<AvatarKind | null>(null);
  const [charName, setCharName] = useState("");
  const [waveKey, setWaveKey] = useState(0);

  const choose = (k: AvatarKind) => {
    setKind(k);
    setWaveKey((w) => w + 1);
    sfx.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Hi {playerName}</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">Choose your coder</h1>
        <p className="mt-2 max-w-[56ch] text-muted">This is the character you&apos;ll guide through the next 10 days. Tap one to meet them.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Choose an avatar">
        {(["male", "female"] as AvatarKind[]).map((k) => {
          const selected = kind === k;
          return (
            <motion.button
              key={k}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(k)}
              whileHover={{ y: -3 }}
              className={`panel relative flex flex-col items-center overflow-hidden pb-4 text-left transition ${selected ? "border-signal ring-2 ring-signal/50" : ""}`}
            >
              <div
                className="h-72 w-full sm:h-80"
                style={{ background: `radial-gradient(60% 60% at 50% 60%, ${k === "male" ? "rgba(63,111,242,.25)" : "rgba(255,122,89,.25)"}, transparent 70%)` }}
              >
                <Avatar kind={k} mood={selected ? "wave" : "idle"} moodKey={selected ? waveKey : 0} className="h-full w-full" />
              </div>
              <span className="font-display text-xl font-extrabold">{DEFAULT_NAME[k]}</span>
              <span className="text-sm text-muted">{k === "male" ? "Male avatar" : "Female avatar"}</span>
            </motion.button>
          );
        })}
      </div>

      {kind && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            onPick(kind, charName.trim().slice(0, 16) || DEFAULT_NAME[kind]);
          }}
        >
          <label className="flex flex-1 flex-col gap-1.5" htmlFor="char-name">
            <span className="eyebrow">Name your coder (optional)</span>
            <input
              id="char-name"
              value={charName}
              maxLength={16}
              onChange={(e) => setCharName(e.target.value)}
              placeholder={DEFAULT_NAME[kind]}
              className="rounded-lg border border-line bg-ink px-4 py-3 text-base outline-none focus:border-signal"
            />
          </label>
          <button type="submit" className="btn">
            Meet {charName.trim() || DEFAULT_NAME[kind]}
          </button>
        </motion.form>
      )}
    </div>
  );
}
