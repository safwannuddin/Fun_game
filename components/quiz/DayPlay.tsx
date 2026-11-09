"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { type Day, type Question, fill, starsFor, PASS_MARK, STORY } from "@/lib/journey";
import type { AvatarKind } from "@/lib/profile";
import { sfx } from "@/lib/sound";
import Avatar, { type Mood } from "./Avatar";
import VisualCard from "./VisualCard";
import Confetti from "./Confetti";
import TeacherChat from "./TeacherChat";
import BonusChallenge from "./BonusChallenge";

interface Props {
  day: Day;
  kind: AvatarKind;
  name: string;
  onExit: () => void;
  onFinish: (correct: number) => void;
  onNextDay: (() => void) | null;
  ai: boolean;
  onBonus: () => void;
}

type Stage = "lesson" | "quiz" | "result";

function TeacherBadge({ day }: { day: Day }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-ink" style={{ background: day.teacher.color }}>
        {day.teacher.initials}
      </span>
      <div>
        <p className="font-display text-lg font-semibold leading-tight">{day.teacher.name}</p>
        <p className="text-sm text-muted">{day.teacher.role}</p>
      </div>
    </div>
  );
}

export default function DayPlay({ day, kind, name, onExit, onFinish, onNextDay, ai, onBonus }: Props) {
  const [stage, setStage] = useState<Stage>("lesson");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mood, setMood] = useState<Mood>("think");
  const [moodKey, setMoodKey] = useState(0);
  const [burst, setBurst] = useState(0);
  const shake = useAnimationControls();

  const q: Question = day.questions[qi];
  const total = day.questions.length;
  const t = (s: string) => fill(s, name);

  const answerIndex = useMemo(() => (q.type === "truefalse" ? (q.answer ? 0 : 1) : q.answer), [q]);
  const isRight = picked !== null && picked === answerIndex;

  const react = (m: Mood) => {
    setMood(m);
    setMoodKey((k) => k + 1);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === answerIndex) {
      setCorrect((c) => c + 1);
      sfx.good();
      react("happy");
      setBurst((b) => b + 1);
    } else {
      sfx.bad();
      react("sad");
      shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.4 } });
    }
  };

  const next = () => {
    if (qi + 1 < total) {
      setQi(qi + 1);
      setPicked(null);
      react("think");
    } else {
      const final = correct;
      onFinish(final);
      setStage("result");
      if (final >= PASS_MARK) {
        sfx.win();
        react("happy");
        setBurst((b) => b + 1);
      } else {
        sfx.bad();
        react("sad");
      }
    }
  };

  const restart = () => {
    setStage("quiz");
    setQi(0);
    setPicked(null);
    setCorrect(0);
    react("think");
  };

  const stars = starsFor(correct, total);
  const passed = correct >= PASS_MARK;

  // ── option button styling ──
  const optionClass = (i: number) => {
    if (picked === null) return "border-line bg-raised hover:border-signal hover:-translate-y-0.5";
    if (i === answerIndex) return "border-safe bg-safe/10";
    if (i === picked) return "border-danger bg-danger/10";
    return "border-line bg-raised opacity-50";
  };

  return (
    <div className="flex flex-col gap-4">
      {burst > 0 && <Confetti key={burst} />}

      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost text-sm" onClick={onExit}>
          ← Day map
        </button>
        <div className="text-right">
          <p className="eyebrow">
            Day {day.day} · {day.tier}
          </p>
          <p className="font-display text-lg font-semibold">{day.attack}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* character */}
        <aside className="panel flex flex-row items-center overflow-hidden lg:flex-col lg:items-stretch">
          <div
            className="h-40 w-36 shrink-0 sm:h-48 sm:w-44 lg:h-72 lg:w-full"
            style={{ background: "radial-gradient(70% 60% at 50% 65%, rgba(114,167,255,.16), transparent 70%)" }}
          >
            <Avatar kind={kind} mood={mood} moodKey={moodKey} className="h-full w-full" />
          </div>
          <div className="min-w-0 p-4">
            <p className="font-display font-semibold">{name}</p>
            <p className="text-sm text-muted">
              {stage === "lesson"
                ? "Listening to today's teacher…"
                : stage === "result"
                  ? passed
                    ? "We made it through today!"
                    : "That one got us. Let's try again."
                  : picked === null
                    ? "What should I do?"
                    : isRight
                      ? "Phew, thanks! That was close."
                      : "Ouch. Now I know for next time."}
            </p>
            {stage === "quiz" && (
              <ol className="mt-3 flex gap-1.5" aria-label={`Question ${qi + 1} of ${total}`}>
                {day.questions.map((_, i) => (
                  <li key={i} className={`h-1.5 flex-1 rounded-full ${i < qi ? "bg-safe" : i === qi ? "bg-signal" : "bg-line"}`} />
                ))}
              </ol>
            )}
          </div>
        </aside>

        <motion.section animate={shake} className="panel flex min-w-0 flex-col gap-5 p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {stage === "lesson" && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
                  <p className="eyebrow text-danger">Today&apos;s incident</p>
                  <p className="mt-1">{t(day.incident)}</p>
                </div>
                <TeacherBadge day={day} />
                <ul className="flex flex-col gap-2.5">
                  {day.lesson.map((l, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.12 }}
                      className="grid grid-cols-[1.75rem_1fr] gap-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs text-ink" style={{ background: day.teacher.color }}>
                        {i + 1}
                      </span>
                      <span>{t(l)}</span>
                    </motion.li>
                  ))}
                </ul>
                <div className="rounded-xl border border-dashed border-line px-4 py-3">
                  <p className="eyebrow">Remember</p>
                  <p className="mt-1 font-display text-lg">{day.rule}</p>
                </div>
                {ai && <TeacherChat day={day} />}
                <button
                  type="button"
                  className="btn self-start"
                  onClick={() => {
                    setStage("quiz");
                    react("think");
                    sfx.click();
                  }}
                >
                  Help {name} now
                </button>
              </motion.div>
            )}

            {stage === "quiz" && (
              <motion.div key={`q${qi}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">
                    Challenge {qi + 1} of {total}
                  </p>
                  <p className="font-mono text-xs text-muted">{correct} correct</p>
                </div>
                <h2 className="font-display text-xl font-semibold leading-snug sm:text-2xl">{t(q.prompt)}</h2>

                {q.type === "code" && (
                  <div className="overflow-hidden rounded-xl border border-line bg-[#090e1a]">
                    <p className="border-b border-line px-3 py-2 font-mono text-xs text-muted">{q.file}</p>
                    <div className="overflow-x-auto">
                      <ol className="min-w-max py-2 font-mono text-[13px] leading-7">
                        {q.lines.map((line, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              disabled={picked !== null}
                              onClick={() => choose(i)}
                              className={`grid w-full grid-cols-[2.5rem_1fr] pr-4 text-left transition ${
                                picked === null ? "hover:bg-raised" : i === answerIndex ? "bg-safe/15" : i === picked ? "bg-danger/15" : ""
                              }`}
                            >
                              <span className="select-none pr-3 text-right text-[#4b5878]">{i + 1}</span>
                              <span className="whitespace-pre">{line}</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {q.type === "truefalse" && (
                  <div className="grid grid-cols-2 gap-3">
                    {["True", "False"].map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        disabled={picked !== null}
                        onClick={() => choose(i)}
                        className={`rounded-xl border px-4 py-5 font-display text-xl font-semibold transition ${optionClass(i)}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {(q.type === "choice" || q.type === "visual") && (
                  <div className={`grid gap-3 ${q.type === "visual" ? "sm:grid-cols-3" : ""}`}>
                    {q.options.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={picked !== null}
                        onClick={() => choose(i)}
                        className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition ${optionClass(i)}`}
                      >
                        {q.type === "choice" && <span className="mt-0.5 font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>}
                        {o.visual ? <VisualCard v={o.visual} /> : <span className={/[(){};=]/.test(o.text ?? "") ? "font-mono text-sm" : ""}>{t(o.text ?? "")}</span>}
                      </button>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {picked !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                        isRight ? "border-safe/50 bg-safe/10" : "border-danger/50 bg-danger/10"
                      }`}
                      role="status"
                    >
                      <div>
                        <p className={`font-display font-semibold ${isRight ? "text-safe" : "text-danger"}`}>{isRight ? "Correct!" : "Not quite."}</p>
                        <p className="text-sm">{t(q.explain)}</p>
                      </div>
                      <button type="button" className="btn shrink-0" onClick={next} autoFocus>
                        {qi + 1 < total ? "Next" : "See results"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {stage === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-start gap-5">
                <p className="eyebrow">Day {day.day} complete</p>
                <div className="flex gap-2" aria-label={`${stars} of 3 stars`}>
                  {[1, 2, 3].map((i) => (
                    <motion.svg
                      key={i}
                      width="56"
                      height="56"
                      viewBox="0 0 24 24"
                      initial={{ scale: 0, rotate: -40 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + i * 0.18, type: "spring", stiffness: 300, damping: 14 }}
                      aria-hidden="true"
                    >
                      <path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill={i <= stars ? "#ffd166" : "#2a3654"} />
                    </motion.svg>
                  ))}
                </div>
                <h2 className="font-display text-3xl font-extrabold">
                  {passed ? `${STORY.app} survived ${day.attack.toLowerCase()}!` : `${day.attack} got through.`}
                </h2>
                <p className="text-muted">
                  You got {correct} of {total} right{passed ? ` and earned ${correct * 10} XP.` : `. You need ${PASS_MARK} to unlock the next day.`}
                </p>
                <div className="rounded-xl border border-dashed border-line px-4 py-3">
                  <p className="eyebrow">{day.teacher.name}&apos;s rule</p>
                  <p className="mt-1 font-display text-lg">{day.rule}</p>
                </div>
                {ai && passed && <BonusChallenge day={day} onCorrect={onBonus} />}
                {ai && !passed && <TeacherChat day={day} />}
                <div className="flex flex-wrap gap-3">
                  {passed && onNextDay && (
                    <button type="button" className="btn" onClick={onNextDay}>
                      Start Day {day.day + 1}
                    </button>
                  )}
                  {!passed && (
                    <button type="button" className="btn" onClick={restart}>
                      Try Day {day.day} again
                    </button>
                  )}
                  <button type="button" className="btn-ghost" onClick={onExit}>
                    Back to the map
                  </button>
                  {passed && stars < 3 && (
                    <button type="button" className="btn-ghost" onClick={restart}>
                      Replay for 3 stars
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}
