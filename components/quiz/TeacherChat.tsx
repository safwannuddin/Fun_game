"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Day } from "@/lib/journey";

type Msg = { role: "user" | "model"; text: string };

/** Shows **bold** as bold and drops stray Markdown asterisks, without ever rendering HTML. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p) ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p.replace(/(^|\s)\*(\S[^*]*\S|\S)\*(?=\s|[.,!?]|$)/g, "$1$2").replace(/^#+\s*/gm, "")}</span>,
      )}
    </>
  );
}

function starters(day: Day): string[] {
  return [`How do I spot ${day.attack.toLowerCase()}?`, "Can you give me a real-life example?", "What should I do if it already happened?"];
}

/** Live chat with the day's teacher, answered by Gemini on the server. */
export default function TeacherChat({ day }: { day: Day }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim().slice(0, 400);
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user" as const, text: q }].slice(-12);
    setMsgs(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: day.day, messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "No reply");
      setMsgs((m) => [...m, { role: "model", text: data.reply! }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The teacher is busy right now.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="btn-ghost self-start text-sm" onClick={() => setOpen(true)}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] text-ink" style={{ background: day.teacher.color }}>
          {day.teacher.initials}
        </span>
        Ask {day.teacher.name} a question
        <span className="rounded-full bg-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">Live AI</span>
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-xl border border-line bg-ink/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Ask {day.teacher.name} · live AI</p>
        <button type="button" className="text-xs text-muted hover:text-text" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {starters(day).map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-sm hover:border-signal">
                {s}
              </button>
            ))}
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "self-end rounded-br-sm bg-signal text-ink" : "self-start rounded-bl-sm bg-raised"
              }`}
            >
              {m.role === "model" ? <Rich text={m.text} /> : m.text}
            </motion.p>
          ))}
        </AnimatePresence>
        {busy && <p className="self-start rounded-2xl bg-raised px-3 py-2 text-sm text-muted">{day.teacher.name} is typing…</p>}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor={`ask-${day.day}`} className="sr-only">
          Your question
        </label>
        <input
          id={`ask-${day.day}`}
          value={input}
          maxLength={400}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${day.attack.toLowerCase()}…`}
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 py-2.5 text-base outline-none focus:border-signal"
        />
        <button type="submit" className="btn px-4 py-2.5" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
      <p className="text-xs text-muted">Answers come from AI and stay on today&apos;s topic. Don&apos;t share passwords or personal details.</p>
    </motion.div>
  );
}
