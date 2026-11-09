"use client";

import { motion } from "framer-motion";
import { DAYS, rankFor, STORY } from "@/lib/journey";
import { daysCleared, isUnlocked, type Profile } from "@/lib/profile";
import Avatar from "./Avatar";

const TIER_TONE: Record<string, string> = {
  Basic: "text-safe border-safe/40",
  Intermediate: "text-signal border-signal/40",
  Advanced: "text-danger border-danger/40",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill={i <= n ? "#ffd166" : "#2a3654"} />
        </svg>
      ))}
    </span>
  );
}

export default function DayMap({ profile, onPlay, onSignOut }: { profile: Profile; onPlay: (day: number) => void; onSignOut: () => void }) {
  const cleared = daysCleared(profile);
  const name = profile.characterName;
  const nextDay = DAYS.find((d) => isUnlocked(profile, d.day) && (profile.days[d.day]?.stars ?? 0) < 2)?.day;

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <aside className="panel flex flex-col overflow-hidden lg:sticky lg:top-6 lg:self-start">
        <div className="h-64" style={{ background: "radial-gradient(70% 60% at 50% 65%, rgba(114,167,255,.18), transparent 70%)" }}>
          <Avatar kind={profile.avatar ?? "male"} mood={cleared === 10 ? "happy" : "idle"} className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div>
            <p className="eyebrow">{rankFor(cleared)}</p>
            <h2 className="font-display text-2xl font-extrabold">{name}</h2>
            <p className="text-sm text-muted">Guided by {profile.playerName}</p>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="eyebrow">{STORY.app} launch readiness</span>
              <span className="font-mono tabular-nums">{cleared * 10}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink">
              <motion.div className="h-full rounded-full bg-safe" initial={{ width: 0 }} animate={{ width: `${cleared * 10}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-raised p-3">
              <dt className="eyebrow">Days cleared</dt>
              <dd className="font-mono text-xl tabular-nums">{cleared}/10</dd>
            </div>
            <div className="rounded-lg bg-raised p-3">
              <dt className="eyebrow">XP</dt>
              <dd className="font-mono text-xl tabular-nums text-signal">{profile.xp}</dd>
            </div>
          </dl>
          <button type="button" onClick={onSignOut} className="self-start text-xs text-muted underline-offset-4 hover:underline">
            Sign out ({profile.email})
          </button>
        </div>
      </aside>

      <section className="flex flex-col gap-4" aria-labelledby="map-title">
        <div>
          <p className="eyebrow">10 days to Demo Day</p>
          <h1 id="map-title" className="font-display text-3xl font-extrabold sm:text-4xl">
            {cleared === 10 ? `${STORY.app} launched. ${name} got the internship!` : `Help ${name} survive each day`}
          </h1>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {DAYS.map((d, i) => {
            const open = isUnlocked(profile, d.day);
            const prog = profile.days[d.day];
            const isNext = d.day === nextDay;
            return (
              <motion.li key={d.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <button
                  type="button"
                  disabled={!open}
                  onClick={() => onPlay(d.day)}
                  className={`panel flex h-full w-full items-center gap-4 p-4 text-left transition ${
                    open ? "hover:border-signal" : "cursor-not-allowed opacity-50"
                  } ${isNext ? "border-signal ring-2 ring-signal/40" : ""}`}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-mono text-ink"
                    style={{ background: open ? d.teacher.color : "#2a3654" }}
                  >
                    <span className="text-[9px] font-semibold uppercase leading-none">Day</span>
                    <span className="text-lg font-semibold leading-none">{d.day}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold leading-tight">{d.attack}</span>
                    <span className="block truncate text-xs text-muted">with {d.teacher.name}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${TIER_TONE[d.tier]}`}>{d.tier}</span>
                    {open ? <Stars n={prog?.stars ?? 0} /> : <span className="font-mono text-xs text-muted">locked</span>}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
