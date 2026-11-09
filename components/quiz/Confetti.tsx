"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#ff8a3d", "#35d39a", "#72a7ff", "#ff5468", "#ffd166", "#b48cff"];

/** A one-shot burst. Re-mount it (change its key) to fire again. */
export default function Confetti({ count = 40 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 700,
        y: -Math.random() * 420 - 80,
        r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length],
        d: 0.9 + Math.random() * 0.6,
        w: 6 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[2px]"
          style={{ background: b.c, width: b.w, height: b.w * 1.6 }}
          initial={{ x: 0, y: 40, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [40, b.y, b.y + 520], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: b.d * 1.6, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
