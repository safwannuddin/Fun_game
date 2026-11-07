import Pixel from "./Pixel";
import { ROUNDS, ROUND_SECONDS } from "@/lib/scoring";

interface Props {
  round: number;
  time: number;
  score: number;
  safety: number;
  name: string;
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3 text-xs">
      <span className="eyebrow">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-ink" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: tone }} />
      </div>
      <span className="text-right font-mono tabular-nums">{label === "Time" ? `${value}s` : `${value}%`}</span>
    </div>
  );
}

export default function Hud({ round, time, score, safety, name }: Props) {
  const safeTone = safety > 60 ? "#35d39a" : safety > 30 ? "#ff8a3d" : "#ff5468";
  const timeTone = time > 20 ? "#72a7ff" : "#ff5468";
  return (
    <header className="panel grid grid-cols-[auto_1fr] items-center gap-4 p-3 sm:grid-cols-[auto_1fr_auto] sm:p-4">
      <div className="flex items-center gap-3">
        <Pixel safety={safety} size={44} />
        <div>
          <p className="eyebrow">Analyst</p>
          <p className="max-w-[9rem] truncate font-display font-semibold">{name}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Meter label="Time" value={time} max={ROUND_SECONDS} tone={timeTone} />
        <Meter label="Safety" value={Math.max(0, safety)} max={100} tone={safeTone} />
      </div>
      <div className="col-span-2 flex justify-between gap-6 border-t border-line pt-2 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <div>
          <p className="eyebrow">Case</p>
          <p className="font-mono text-lg tabular-nums">
            {round + 1}/{ROUNDS}
          </p>
        </div>
        <div>
          <p className="eyebrow">Score</p>
          <p className="font-mono text-lg tabular-nums text-signal">{score}</p>
        </div>
      </div>
    </header>
  );
}
