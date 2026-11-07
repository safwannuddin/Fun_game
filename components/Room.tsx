"use client";

import { createContext, useContext, useState, type KeyboardEvent, type ReactNode } from "react";
import type { RoomItemId } from "@/lib/types";
import { itemName } from "@/lib/devices";

interface RoomProps {
  onPick: (id: RoomItemId) => void;
  cleared: RoomItemId[];
  infected?: RoomItemId | null;
  locked?: boolean;
}

/** Where each item's status tag sits (SVG coordinates). */
const TAG: Record<RoomItemId, [number, number]> = {
  qr: [313, 34],
  router: [650, 80],
  plant: [742, 90],
  lamp: [716, 182],
  monitor: [290, 152],
  sticky: [394, 160],
  usb: [195, 272],
  mug: [412, 248],
  laptop: [517, 204],
  phone: [616, 236],
};

interface RoomCtx {
  cleared: RoomItemId[];
  locked?: boolean;
  onPick: (id: RoomItemId) => void;
  setHover: (id: RoomItemId | null) => void;
}
const Ctx = createContext<RoomCtx | null>(null);

function Item({ id, transform, hit, children }: { id: RoomItemId; transform: string; hit: [number, number, number, number]; children: ReactNode }) {
  const ctx = useContext(Ctx)!;
  const isClean = ctx.cleared.includes(id);
  const pick = () => {
    if (!ctx.locked) ctx.onPick(id);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick();
    }
  };
  return (
    <g
      className={`room-item${isClean ? " is-clean" : ""}`}
      transform={transform}
      role="button"
      tabIndex={ctx.locked ? -1 : 0}
      aria-label={`Inspect the ${itemName(id).toLowerCase()}${isClean ? " (already cleared)" : ""}`}
      onClick={pick}
      onKeyDown={onKey}
      onMouseEnter={() => ctx.setHover(id)}
      onMouseLeave={() => ctx.setHover(null)}
      onFocus={() => ctx.setHover(id)}
      onBlur={() => ctx.setHover(null)}
    >
      <rect x={hit[0]} y={hit[1]} width={hit[2]} height={hit[3]} fill="transparent" />
      <g className="art">{children}</g>
    </g>
  );
}

function Tag({ id, tone }: { id: RoomItemId; tone: "clean" | "infected" }) {
  const [x, y] = TAG[id];
  const label = tone === "clean" ? "CLEAN" : "INFECTED";
  const w = tone === "clean" ? 52 : 70;
  return (
    <g transform={`translate(${x - w / 2},${y - 22})`} pointerEvents="none">
      <rect width={w} height="18" rx="9" fill={tone === "clean" ? "#35d39a" : "#ff5468"} />
      <text x={w / 2} y="12.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0d1322" fontFamily="var(--font-mono)">
        {label}
      </text>
    </g>
  );
}

export default function Room({ onPick, cleared, infected, locked }: RoomProps) {
  const [hover, setHover] = useState<RoomItemId | null>(null);

  return (
    <Ctx.Provider value={{ cleared, locked, onPick, setHover }}>
    <div className={`relative overflow-hidden rounded-2xl border border-line bg-[#231f47] ${locked ? "room-locked" : ""}`}>
      <svg viewBox="0 0 800 470" className="block h-auto w-full" role="group" aria-label="Pixel's bedroom. Tap an item to investigate it.">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2a5e" />
            <stop offset="1" stopColor="#4a3a7a" />
          </linearGradient>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="#ffb547" stopOpacity=".55" />
            <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="screenG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b4fa8" />
            <stop offset="1" stopColor="#2a2f6e" />
          </linearGradient>
          <clipPath id="winClip">
            <rect x="60" y="45" width="170" height="130" rx="6" />
          </clipPath>
        </defs>

        {/* wall + floor */}
        <rect width="800" height="340" fill="#2a2452" />
        <rect y="340" width="800" height="130" fill="#3a2f4a" />
        <g stroke="#2c2338" strokeWidth="2">
          <line x1="0" y1="380" x2="800" y2="380" />
          <line x1="0" y1="425" x2="800" y2="425" />
          <line x1="140" y1="340" x2="120" y2="380" />
          <line x1="420" y1="380" x2="410" y2="425" />
          <line x1="660" y1="340" x2="680" y2="380" />
          <line x1="250" y1="425" x2="240" y2="470" />
        </g>
        <rect y="334" width="800" height="8" fill="#1d1838" />
        <circle cx="715" cy="230" r="150" fill="url(#lampGlow)" className="animate-flicker" />

        {/* window */}
        <rect x="52" y="37" width="186" height="146" rx="10" fill="#1d1838" />
        <g clipPath="url(#winClip)">
          <rect x="60" y="45" width="170" height="130" fill="url(#sky)" />
          <circle cx="190" cy="80" r="16" fill="#fff4d6" />
          <g fill="#fff" opacity=".8">
            <circle cx="90" cy="70" r="1.6" />
            <circle cx="130" cy="58" r="1.2" />
            <circle cx="150" cy="95" r="1.4" />
            <circle cx="215" cy="130" r="1.2" />
          </g>
          <g className="animate-drift" fill="#8f86c9" opacity=".7">
            <ellipse cx="80" cy="140" rx="30" ry="9" />
            <ellipse cx="100" cy="134" rx="18" ry="9" />
          </g>
          <g fill="#14112a">
            <rect x="60" y="150" width="30" height="25" />
            <rect x="95" y="138" width="22" height="37" />
            <rect x="120" y="155" width="40" height="20" />
            <rect x="165" y="142" width="25" height="33" />
            <rect x="195" y="150" width="35" height="25" />
          </g>
          <g fill="#ffb547" opacity=".8">
            <rect x="100" y="145" width="4" height="4" />
            <rect x="172" y="150" width="4" height="4" />
            <rect x="132" y="162" width="4" height="4" />
          </g>
        </g>
        <rect x="143" y="45" width="4" height="130" fill="#1d1838" />
        <rect x="60" y="108" width="170" height="4" fill="#1d1838" />

        {/* QR poster */}
        <Item id="qr" transform="translate(268,40)" hit={[-8, -6, 106, 138]}>
          <rect width="90" height="124" rx="4" fill="#fff6e6" />
          <rect width="90" height="26" rx="4" fill="#ff7a59" />
          <text x="45" y="18" textAnchor="middle" fontWeight="800" fontSize="13" fill="#fff" fontFamily="var(--font-display)">
            FREE PIZZA
          </text>
          <g transform="translate(20,36)">
            <rect width="50" height="50" fill="#fff" />
            <g fill="#14112a">
              <rect x="2" y="2" width="14" height="14" />
              <rect x="34" y="2" width="14" height="14" />
              <rect x="2" y="34" width="14" height="14" />
              <rect x="20" y="4" width="4" height="4" />
              <rect x="26" y="10" width="4" height="4" />
              <rect x="20" y="20" width="6" height="4" />
              <rect x="30" y="22" width="4" height="8" />
              <rect x="38" y="30" width="6" height="4" />
              <rect x="20" y="30" width="4" height="6" />
              <rect x="26" y="38" width="4" height="8" />
              <rect x="36" y="40" width="8" height="4" />
            </g>
            <g fill="#fff">
              <rect x="5" y="5" width="8" height="8" />
              <rect x="37" y="5" width="8" height="8" />
              <rect x="5" y="37" width="8" height="8" />
            </g>
          </g>
          <text x="45" y="102" textAnchor="middle" fontSize="8" fill="#3a2f4a">
            Scan to claim
          </text>
          <text x="45" y="114" textAnchor="middle" fontSize="7" fill="#7a6f9a">
            Fri 12–2pm · Main Hall
          </text>
        </Item>

        {/* shelf */}
        <rect x="585" y="150" width="190" height="10" rx="2" fill="#1d1838" />
        <Item id="plant" transform="translate(722,96)" hit={[-10, -6, 56, 62]}>
          <path className="leaf animate-sway" d="M18 32 C4 22 2 8 10 0 C16 10 20 20 18 32Z" fill="#35d39a" />
          <path className="leaf animate-sway" style={{ animationDelay: "-1.5s" }} d="M18 32 C30 20 36 10 32 2 C24 10 18 20 18 32Z" fill="#2aa97b" />
          <path d="M6 32 H30 L27 54 H9Z" fill="#ff7a59" />
        </Item>
        <Item id="router" transform="translate(605,108)" hit={[-8, -24, 104, 70]}>
          <line x1="14" y1="4" x2="6" y2="-20" stroke="#14112a" strokeWidth="4" strokeLinecap="round" />
          <line x1="76" y1="4" x2="84" y2="-20" stroke="#14112a" strokeWidth="4" strokeLinecap="round" />
          <rect y="4" width="90" height="38" rx="8" fill="#e8e3ff" />
          <rect y="30" width="90" height="12" rx="6" fill="#c9c1f0" />
          <circle cx="20" cy="20" r="3.5" fill="#35d39a" className="animate-blink" />
          <circle cx="34" cy="20" r="3.5" fill="#35d39a" className="animate-blink" style={{ animationDelay: ".3s" }} />
          <circle cx="48" cy="20" r="3.5" fill="#ffb547" className="animate-blink" style={{ animationDelay: ".7s" }} />
        </Item>
        <Item id="lamp" transform="translate(690,190)" hit={[-6, -6, 64, 160]}>
          <path d="M6 0 H46 L54 38 H-2Z" fill="#ffb547" />
          <rect x="24" y="38" width="5" height="100" fill="#14112a" />
          <ellipse cx="26" cy="142" rx="20" ry="5" fill="#14112a" />
        </Item>

        {/* desk + chair */}
        <rect x="160" y="300" width="500" height="16" rx="3" fill="#8a5a3c" />
        <rect x="160" y="312" width="500" height="5" fill="#6b4329" />
        <rect x="180" y="316" width="14" height="128" fill="#6b4329" />
        <rect x="626" y="316" width="14" height="128" fill="#6b4329" />
        <rect x="510" y="316" width="116" height="62" fill="#7a4d32" />
        <rect x="556" y="342" width="24" height="5" rx="2" fill="#c99a6b" />
        <g fill="#1a1636">
          <rect x="330" y="340" width="110" height="14" rx="6" />
          <rect x="380" y="354" width="10" height="70" />
          <rect x="345" y="424" width="80" height="8" rx="4" />
        </g>

        <Item id="monitor" transform="translate(205,160)" hit={[-6, -6, 182, 152]}>
          <rect width="170" height="114" rx="8" fill="#14112a" />
          <rect x="8" y="8" width="154" height="92" rx="3" fill="url(#screenG)" />
          <rect x="16" y="16" width="44" height="76" rx="2" fill="#2a2f6e" />
          <g fill="#8f9ae0">
            <rect x="20" y="22" width="34" height="6" rx="2" />
            <rect x="20" y="34" width="30" height="5" rx="2" />
            <rect x="20" y="44" width="34" height="5" rx="2" />
          </g>
          <g fill="#dfe3ff">
            <rect x="68" y="18" width="84" height="7" rx="2" />
            <rect x="68" y="32" width="70" height="5" rx="2" opacity=".7" />
            <rect x="68" y="42" width="78" height="5" rx="2" opacity=".7" />
          </g>
          <rect x="68" y="66" width="40" height="12" rx="3" fill="#72a7ff" />
          <circle cx="150" cy="16" r="7" fill="#ff5468" />
          <text x="150" y="19.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
            1
          </text>
          <rect x="75" y="114" width="20" height="20" fill="#14112a" />
          <rect x="50" y="132" width="70" height="8" rx="3" fill="#14112a" />
        </Item>
        <Item id="sticky" transform="translate(372,166)" hit={[-10, -10, 64, 64]}>
          <g transform="rotate(7 22 22)">
            <rect width="44" height="44" fill="#ffe066" />
            <g stroke="#9a7d12" strokeWidth="2" strokeLinecap="round">
              <line x1="7" y1="12" x2="36" y2="12" />
              <line x1="7" y1="20" x2="30" y2="20" />
              <line x1="7" y1="28" x2="34" y2="28" />
            </g>
          </g>
        </Item>
        <Item id="usb" transform="translate(172,282)" hit={[-10, -14, 70, 34]}>
          <rect width="34" height="16" rx="3" fill="#ff7a59" />
          <rect x="34" y="3" width="13" height="10" fill="#c9c1f0" />
          <rect x="5" y="4" width="20" height="8" rx="1" fill="#fff6e6" />
        </Item>
        <Item id="mug" transform="translate(400,272)" hit={[-8, -20, 46, 52]}>
          <path d="M8 -4 q4 -6 0 -12 M16 -4 q4 -6 0 -12" stroke="#b6addb" strokeWidth="2" fill="none" opacity=".6" />
          <rect width="24" height="28" rx="4" fill="#72a7ff" />
          <path d="M24 7 h5 a6 6 0 0 1 0 12 h-5" stroke="#72a7ff" strokeWidth="4" fill="none" />
        </Item>
        <Item id="laptop" transform="translate(445,212)" hit={[-26, -8, 196, 106]}>
          <rect width="144" height="84" rx="6" fill="#14112a" />
          <rect x="6" y="6" width="132" height="72" rx="3" fill="#0d0b1f" />
          <rect x="12" y="14" width="40" height="4" rx="2" fill="#ff7a59" />
          <rect x="56" y="14" width="50" height="4" rx="2" fill="#8f9ae0" />
          <rect x="20" y="24" width="60" height="4" rx="2" fill="#35d39a" />
          <rect x="84" y="24" width="30" height="4" rx="2" fill="#ffb547" />
          <rect x="20" y="34" width="80" height="4" rx="2" fill="#8f9ae0" />
          <rect x="28" y="44" width="50" height="4" rx="2" fill="#ffb547" />
          <rect x="20" y="54" width="30" height="4" rx="2" fill="#8f9ae0" />
          <rect x="12" y="64" width="6" height="6" fill="#e8ecf6" className="animate-blink" />
          <path d="M-14 84 L158 84 L168 96 L-24 96 Z" fill="#c9c1f0" />
        </Item>
        <Item id="phone" transform="translate(600,246)" hit={[-12, -14, 58, 80]}>
          <rect width="32" height="54" rx="6" fill="#14112a" />
          <rect x="3" y="5" width="26" height="42" rx="2" fill="url(#screenG)" />
          <rect x="6" y="10" width="20" height="9" rx="2" fill="#dfe3ff" />
          <rect x="6" y="22" width="14" height="4" rx="2" fill="#8f9ae0" />
        </Item>

        {cleared.map((id) => (
          <Tag key={id} id={id} tone="clean" />
        ))}
        {infected && <Tag id={infected} tone="infected" />}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 font-mono text-xs text-text backdrop-blur" aria-live="polite">
        {hover ? `Inspect: ${itemName(hover)}` : locked ? "Room locked" : "Tap an item to inspect it"}
      </div>
    </div>
    </Ctx.Provider>
  );
}
