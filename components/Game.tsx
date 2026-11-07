"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Case, CaseResult, DeviceId, RoomItemId, TechniqueId } from "@/lib/types";
import { DEVICE_IDS, DECOYS, DEVICES, isDevice } from "@/lib/devices";
import { pickBankCase } from "@/lib/cases";
import { shuffle, verdictOptions } from "@/lib/techniques";
import { MAX_GUESSES, POINTS, ROUNDS, ROUND_SECONDS, SAFETY } from "@/lib/scoring";
import { sfx } from "@/lib/sound";
import StartScreen from "./StartScreen";
import Hud from "./Hud";
import Room from "./Room";
import CaseFile from "./CaseFile";
import EvidenceViewer, { type EvidenceStep } from "./EvidenceViewer";
import Debrief from "./Debrief";
import EndScreen from "./EndScreen";
import Pixel from "./Pixel";

type Phase = "start" | "loading" | "hunt" | "evidence" | "debrief" | "end";
type Loaded = { case: Case; fallback: boolean };

async function fetchCase(device: DeviceId, ai: boolean, seen: string[]): Promise<Loaded> {
  try {
    const qs = new URLSearchParams({ device, ai: ai ? "1" : "0", seen: seen.join(",") });
    const res = await fetch(`/api/case?${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as Loaded;
  } catch {
    // Offline or API down: the bank ships with the client, so the game never stalls.
    return { case: pickBankCase(device, seen), fallback: ai };
  }
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>("start");
  const [name, setName] = useState("Analyst");
  const [ai, setAi] = useState(false);
  const [plan, setPlan] = useState<DeviceId[]>([]);
  const [round, setRound] = useState(0);
  const [c, setC] = useState<Case | null>(null);
  const [fallback, setFallback] = useState(false);

  // hunt
  const [shown, setShown] = useState(1);
  const [guessesLeft, setGuessesLeft] = useState(MAX_GUESSES);
  const [cleared, setCleared] = useState<RoomItemId[]>([]);
  const [infected, setInfected] = useState<RoomItemId | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // evidence
  const [step, setStep] = useState<EvidenceStep>("flag");
  const [flagged, setFlagged] = useState<number[]>([]);
  const [wrongFlags, setWrongFlags] = useState<number[]>([]);
  const [pixelHint, setPixelHint] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<TechniqueId[]>([]);
  const [wrongVerdicts, setWrongVerdicts] = useState<TechniqueId[]>([]);
  const [fixOrder, setFixOrder] = useState<number[]>([]);
  const [wrongFixes, setWrongFixes] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);

  // scoring
  const [time, setTime] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [safety, setSafety] = useState(100);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [debrief, setDebrief] = useState<{ solved: boolean; points: number; reason: string } | null>(null);
  const [survived, setSurvived] = useState(true);

  const penalty = useRef(0);
  const safetyRef = useRef(100);
  const phaseRef = useRef<Phase>("start");
  const seen = useRef<string[]>([]);
  const prefetch = useRef(new Map<number, Promise<Loaded>>());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const load = useCallback(
    (idx: number, devices: DeviceId[], useAi: boolean) => {
      if (idx >= devices.length) return null;
      let p = prefetch.current.get(idx);
      if (!p) {
        p = fetchCase(devices[idx], useAi, seen.current);
        prefetch.current.set(idx, p);
      }
      return p;
    },
    [],
  );

  const beginRound = useCallback(
    async (idx: number, devices: DeviceId[], useAi: boolean) => {
      setPhase("loading");
      setRound(idx);
      const loaded = await load(idx, devices, useAi)!;
      seen.current = [...seen.current, loaded.case.id];
      setC(loaded.case);
      setFallback(loaded.fallback);
      setShown(1);
      setGuessesLeft(MAX_GUESSES);
      setCleared([]);
      setInfected(null);
      setLog([]);
      setStep("flag");
      setFlagged([]);
      setWrongFlags([]);
      setPixelHint(null);
      setWrongVerdicts([]);
      setWrongFixes([]);
      setVerdicts(verdictOptions(loaded.case.technique));
      setFixOrder(shuffle([0, 1, 2]));
      setTime(ROUND_SECONDS);
      setDebrief(null);
      penalty.current = 0;
      setPhase("hunt");
      sfx.alarm();
      load(idx + 1, devices, useAi); // warm up the next case while this one is played
    },
    [load],
  );

  const startGame = (n: string, useAi: boolean) => {
    const devices = shuffle(DEVICE_IDS).slice(0, ROUNDS);
    prefetch.current.clear();
    seen.current = [];
    setName(n);
    setAi(useAi);
    setPlan(devices);
    setScore(0);
    setSafety(100);
    safetyRef.current = 100;
    setResults([]);
    setSurvived(true);
    beginRound(0, devices, useAi);
  };

  const shake = () => setShakeKey((k) => k + 1);

  const loseCase = useCallback(
    (reason: string) => {
      if (!c || (phaseRef.current !== "hunt" && phaseRef.current !== "evidence")) return;
      phaseRef.current = "debrief";
      sfx.bad();
      safetyRef.current -= SAFETY.lostCase;
      setSafety(safetyRef.current);
      setInfected(c.device);
      setResults((r) => [...r, { caseId: c.id, device: c.device, technique: c.technique, solved: false, points: 0 }]);
      setDebrief({ solved: false, points: 0, reason });
      setPhase("debrief");
    },
    [c],
  );

  /** Penalise a mistake. Returns false if it knocked Pixel out. */
  const hurt = (pts: number, safe: number) => {
    penalty.current += pts;
    safetyRef.current -= safe;
    setSafety(safetyRef.current);
    sfx.bad();
    if (safetyRef.current <= 0) {
      loseCase("Pixel's safety hit zero.");
      return false;
    }
    return true;
  };

  // countdown
  useEffect(() => {
    if (phase !== "hunt" && phase !== "evidence") return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if ((phase === "hunt" || phase === "evidence") && time <= 0) loseCase("Time ran out.");
    else if ((phase === "hunt" || phase === "evidence") && time <= 10 && time > 0) sfx.tick();
  }, [time, phase, loseCase]);

  // ── hunt ──
  const revealClue = () => {
    if (!c || shown >= c.clues.length) return;
    penalty.current += POINTS.extraClue;
    setShown((s) => s + 1);
    sfx.click();
  };

  const pick = (id: RoomItemId) => {
    if (phase !== "hunt" || !c || cleared.includes(id)) return;
    if (id === c.device) {
      sfx.good();
      setInfected(id);
      setLog((l) => [...l, `> ${DEVICES[c.device].name}: infection confirmed`]);
      setTimeout(() => {
        if (phaseRef.current === "hunt") setPhase("evidence");
      }, 650);
      return;
    }
    const line = isDevice(id) ? `> ${DEVICES[id].name}: scanned, clean` : `> ${DECOYS[id].name}: ${DECOYS[id].line}`;
    setCleared((x) => [...x, id]);
    setLog((l) => [...l, line]);
    const left = guessesLeft - 1;
    setGuessesLeft(left);
    if (!hurt(POINTS.wrongGuess, SAFETY.wrongGuess)) return;
    if (left <= 0) loseCase("You used all 3 guesses.");
  };

  // ── evidence ──
  const flag = (i: number) => {
    if (!c || step !== "flag") return;
    const line = c.evidence.lines[i];
    if (line.bad) {
      const next = [...flagged, i];
      setFlagged(next);
      sfx.good();
      if (next.length >= c.need) setTimeout(() => setStep("verdict"), 700);
    } else {
      setWrongFlags((w) => [...w, i]);
      shake();
      hurt(POINTS.wrongFlag, SAFETY.wrongFlag);
    }
  };

  const askPixel = () => {
    if (!c) return;
    const target = c.evidence.lines.findIndex((l, i) => l.bad && !flagged.includes(i));
    if (target < 0) return;
    const from = Math.max(1, target);
    const to = Math.min(c.evidence.lines.length, target + 2);
    penalty.current += POINTS.pixelHint;
    setPixelHint(`Something smells wrong between lines ${from} and ${to}. Read them slowly.`);
    sfx.click();
  };

  const verdict = (t: TechniqueId) => {
    if (!c) return;
    if (t === c.technique) {
      sfx.good();
      setStep("fix");
    } else {
      setWrongVerdicts((w) => [...w, t]);
      shake();
      hurt(POINTS.wrongVerdict, SAFETY.wrongVerdict);
    }
  };

  const chooseFix = (i: number) => {
    if (!c) return;
    if (c.fixes[i].ok) {
      phaseRef.current = "debrief";
      const points = Math.max(50, POINTS.base - penalty.current + time * POINTS.perSecondLeft);
      setScore((s) => s + points);
      setResults((r) => [...r, { caseId: c.id, device: c.device, technique: c.technique, solved: true, points }]);
      setDebrief({ solved: true, points, reason: "" });
      sfx.win();
      setPhase("debrief");
    } else {
      setWrongFixes((w) => [...w, i]);
      shake();
      hurt(POINTS.wrongFix, SAFETY.wrongFix);
    }
  };

  const next = () => {
    const done = round + 1 >= ROUNDS || safetyRef.current <= 0;
    if (done) {
      const alive = safetyRef.current > 0;
      setSurvived(alive);
      if (alive) setScore((s) => s + safetyRef.current * POINTS.safetyBonusPerPoint);
      setPhase("end");
      if (alive) sfx.win();
      return;
    }
    beginRound(round + 1, plan, ai);
  };

  // ── render ──
  if (phase === "start") return <StartScreen onStart={startGame} />;

  if (phase === "end")
    return <EndScreen name={name} score={score} safety={safety} survived={survived} results={results} onRestart={() => setPhase("start")} />;

  return (
    <div className="flex flex-col gap-4">
      <Hud round={round} time={Math.max(0, time)} score={score} safety={Math.max(0, safety)} name={name} />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-3">
          <Room onPick={pick} cleared={cleared} infected={infected} locked={phase !== "hunt"} />
          <div className="panel flex items-center gap-3 px-4 py-3 text-sm" aria-live="polite">
            <Pixel safety={safety} size={36} />
            <p className="min-w-0">
              {phase === "loading"
                ? ai
                  ? "NullByte is writing a fresh case…"
                  : "Loading the next case…"
                : infected && phase === "hunt"
                  ? "Got it. Opening the evidence…"
                  : "Read the riddle, then tap the device you think is infected. Decoys cost a guess too."}
              {fallback && phase !== "loading" ? " (The AI was slow, so this case comes from the built-in bank.)" : ""}
            </p>
          </div>
        </div>

        {c && phase !== "loading" ? (
          <CaseFile round={round} clues={c.clues} shown={shown} onReveal={revealClue} guessesLeft={guessesLeft} log={log} />
        ) : (
          <aside className="panel flex min-h-[16rem] items-center justify-center p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-danger" />
              <p className="font-display text-lg">Intercepting NullByte&apos;s message…</p>
            </div>
          </aside>
        )}
      </div>

      <AnimatePresence>
        {phase === "evidence" && c && (
          <EvidenceViewer
            key="evidence"
            c={c}
            step={step}
            time={Math.max(0, time)}
            flagged={flagged}
            wrongFlags={wrongFlags}
            onFlag={flag}
            pixelHint={pixelHint}
            onPixelHint={askPixel}
            verdictOptions={verdicts}
            wrongVerdicts={wrongVerdicts}
            onVerdict={verdict}
            fixOrder={fixOrder}
            wrongFixes={wrongFixes}
            onFix={chooseFix}
            shakeKey={shakeKey}
          />
        )}
      </AnimatePresence>

      {phase === "debrief" && c && debrief && (
        <Debrief c={c} solved={debrief.solved} points={debrief.points} reason={debrief.reason} last={round + 1 >= ROUNDS || safety <= 0} onNext={next} />
      )}
    </div>
  );
}
