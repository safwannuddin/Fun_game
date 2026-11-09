"use client";

import { useEffect, useState } from "react";

export interface Features {
  ai: boolean;
  leaderboard: boolean;
}

let cached: Promise<Features> | null = null;

/** Which live features this deployment has keys for. Everything hides gracefully when off. */
export function useFeatures(): Features {
  const [f, setF] = useState<Features>({ ai: false, leaderboard: false });
  useEffect(() => {
    cached ??= fetch("/api/features")
      .then((r) => r.json() as Promise<Features>)
      .catch(() => ({ ai: false, leaderboard: false }));
    let alive = true;
    cached.then((v) => alive && setF(v));
    return () => {
      alive = false;
    };
  }, []);
  return f;
}
