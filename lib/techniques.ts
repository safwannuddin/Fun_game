import type { TechniqueId } from "./types";

export const TECHNIQUES: Record<TechniqueId, { name: string; blurb: string }> = {
  phishing: { name: "Phishing", blurb: "Fake emails that steal logins" },
  "spear-phishing": { name: "Spear Phishing", blurb: "Phishing that copies your own organisation" },
  smishing: { name: "Smishing", blurb: "Phishing by text message" },
  quishing: { name: "Quishing", blurb: "Phishing hidden behind a QR code" },
  "evil-twin": { name: "Evil Twin Wi-Fi", blurb: "A fake hotspot copying a real one" },
  "usb-baiting": { name: "USB Baiting", blurb: "Malware on a tempting USB stick" },
  "weak-passwords": { name: "Weak Passwords", blurb: "Passwords cracked in seconds" },
  "leaked-secret": { name: "Leaked API Key", blurb: "Secrets exposed in front-end code" },
  "sql-injection": { name: "SQL Injection", blurb: "User input that rewrites a database query" },
  xss: { name: "Cross-Site Scripting", blurb: "User input that runs as code in the browser" },
  "broken-access": { name: "Broken Access Control", blurb: "Normal users getting admin powers" },
};

export const TECHNIQUE_IDS = Object.keys(TECHNIQUES) as TechniqueId[];

/** Families keep the verdict choices plausible (no "SQL injection" option on a Wi-Fi case). */
const FAMILY: Record<TechniqueId, "social" | "code" | "device"> = {
  phishing: "social",
  "spear-phishing": "social",
  smishing: "social",
  quishing: "social",
  "evil-twin": "device",
  "usb-baiting": "device",
  "weak-passwords": "device",
  "leaked-secret": "code",
  "sql-injection": "code",
  xss: "code",
  "broken-access": "code",
};

/** Correct answer + 3 distractors, mostly from the same family, shuffled. */
export function verdictOptions(correct: TechniqueId, rand: () => number = Math.random): TechniqueId[] {
  const same = TECHNIQUE_IDS.filter((t) => t !== correct && FAMILY[t] === FAMILY[correct]);
  const other = TECHNIQUE_IDS.filter((t) => t !== correct && FAMILY[t] !== FAMILY[correct]);
  const pick = [...shuffle(same, rand).slice(0, 2), ...shuffle(other, rand)].slice(0, 3);
  return shuffle([correct, ...pick], rand);
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
