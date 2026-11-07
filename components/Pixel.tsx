/** Pixel the robot. Its face follows the safety level. */
export default function Pixel({ safety, size = 48 }: { safety: number; size?: number }) {
  const color = safety > 60 ? "#35d39a" : safety > 30 ? "#ff8a3d" : "#ff5468";
  const mouth = safety > 60 ? "M23 37 q7 5 14 0" : safety > 30 ? "M23 38 h14" : "M25 40 q5 -6 10 0";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true" className="shrink-0">
      <line x1="30" y1="4" x2="30" y2="12" stroke="#8e99b6" strokeWidth="3" />
      <circle cx="30" cy="4" r="4" fill="#ff8a3d" className="animate-blink" />
      <rect x="6" y="12" width="48" height="40" rx="12" fill="#c9cfe3" />
      <rect x="12" y="18" width="36" height="26" rx="8" fill="#0d1322" />
      <circle cx="23" cy="29" r="4" fill={color} />
      <circle cx="37" cy="29" r="4" fill={color} />
      <path d={mouth} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
