import type { Visual } from "@/lib/journey";

/** Realistic-looking mock UI for picture questions (all brands fictional or the player's own uni). */
export default function VisualCard({ v }: { v: Visual }) {
  switch (v.kind) {
    case "email":
      return (
        <div className="flex w-full flex-col gap-1 rounded-lg bg-[#f6f7fb] p-3 text-left text-[#1b2033]">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfe5f5] text-xs font-semibold">{v.from.trim()[0]}</span>
            <span className="min-w-0 truncate text-xs text-[#4b5578]">{v.from}</span>
          </div>
          <p className="text-sm font-semibold leading-snug">{v.subject}</p>
          <p className="text-xs leading-snug text-[#4b5578]">{v.preview}</p>
          <p className="mt-1 truncate rounded bg-[#e8ecf7] px-2 py-1 font-mono text-[11px] text-[#2e5bd8]">🔗 {v.link}</p>
        </div>
      );
    case "sms":
      return (
        <div className="flex w-full flex-col gap-2 rounded-2xl bg-[#0b1220] p-3 text-left">
          <p className="text-center font-mono text-[11px] text-muted">{v.from}</p>
          <p className="self-start rounded-2xl rounded-bl-sm bg-[#24304a] px-3 py-2 text-sm leading-snug">{v.text}</p>
        </div>
      );
    case "file": {
      const exe = /\.(exe|bat|scr|js|msi)$/i.test(v.name);
      return (
        <div className="flex w-full items-center gap-3 rounded-lg bg-[#10172a] p-3 text-left">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded bg-[#e8ecf6] font-mono text-[9px] font-bold text-ink">
            {exe ? "APP" : v.name.split(".").pop()?.toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block break-all font-mono text-sm">{v.name}</span>
            <span className="text-xs text-muted">{v.meta}</span>
          </span>
        </div>
      );
    }
    case "wifi":
      return (
        <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#10172a] p-3 text-left">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex items-end gap-0.5" aria-label={`signal ${v.signal} of 4`}>
              {[1, 2, 3, 4].map((b) => (
                <span key={b} className={`w-1 rounded-sm ${b <= v.signal ? "bg-text" : "bg-line"}`} style={{ height: 4 + b * 3 }} />
              ))}
            </span>
            <span className="truncate font-medium">{v.ssid}</span>
          </span>
          <span className={`shrink-0 font-mono text-xs ${v.secure ? "text-safe" : "text-muted"}`}>{v.secure ? "🔒 secured" : "open"}</span>
        </div>
      );
  }
}
