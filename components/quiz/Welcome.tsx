"use client";

import { motion } from "framer-motion";
import Avatar from "./Avatar";

/** First screen anyone sees after scanning the QR code. */
export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-[85dvh] flex-col items-center justify-center gap-6 text-center">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
        CSDT Student Ambassadors · LSBU
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl"
      >
        Welcome to <span className="text-signal">Ship It Safe</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-[46ch] text-lg text-text/85">
        Two coders built an app with AI, and the hackers are coming. Pick one, learn a new attack every day, and help them make it to launch.
      </motion.p>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="grid w-full max-w-2xl grid-cols-2 gap-2">
        <div className="h-60 sm:h-80" style={{ background: "radial-gradient(60% 60% at 50% 60%, rgba(63,111,242,.22), transparent 70%)" }}>
          <Avatar kind="male" mood="wave" moodKey={1} className="h-full w-full" />
        </div>
        <div className="h-60 sm:h-80" style={{ background: "radial-gradient(60% 60% at 50% 60%, rgba(255,122,89,.22), transparent 70%)" }}>
          <Avatar kind="female" mood="wave" moodKey={2} className="h-full w-full" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex flex-col items-center gap-3">
        <button type="button" className="btn px-8 py-4 text-lg" onClick={onStart}>
          Get started
        </button>
        <ul className="flex flex-wrap justify-center gap-2 text-sm text-muted">
          <li className="rounded-full border border-line px-3 py-1">10 days</li>
          <li className="rounded-full border border-line px-3 py-1">10 teachers</li>
          <li className="rounded-full border border-line px-3 py-1">40 challenges</li>
          <li className="rounded-full border border-line px-3 py-1">Basic → Advanced</li>
        </ul>
      </motion.div>
    </div>
  );
}
