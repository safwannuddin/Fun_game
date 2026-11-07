import "server-only";
import type { DeviceId } from "./types";
import { TECHNIQUE_IDS } from "./techniques";

const DEVICE_BRIEF: Record<DeviceId, string> = {
  laptop:
    'a short JavaScript/Node file written by an AI assistant for a student web app. evidence.lang = "js". 5-8 lines, one line of code per item, keep indentation with spaces. Exactly ONE line has a realistic security bug (pick one of: leaked-secret, sql-injection, xss, broken-access). need = 1.',
  monitor:
    'the raw source of a phishing email (headers like From, Subject, Authentication-Results, then a few HTML body lines). evidence.lang = "eml". 3-4 lines are red flags. need = 3. technique = phishing or spear-phishing.',
  phone:
    'an incoming SMS shown as a JSON object, one key per line. evidence.lang = "json". 2-3 red flags. need = 2. technique = smishing.',
  usb:
    'a terminal listing of files on a USB stick someone found (ls -la output, optionally cat autorun.inf). evidence.lang = "shell". 1-2 lines are malware clues. need = 1 or 2. technique = usb-baiting.',
  router:
    'the output of "nmcli dev wifi list" in a campus café (SSID, SECURITY, SIGNAL, BSSID columns). evidence.lang = "shell". Exactly one network is an evil twin. need = 1. technique = evil-twin.',
  sticky:
    'a sticky note listing accounts and passwords ("account → password"). evidence.lang = "txt". 3 weak, 2 strong. need = 3. technique = weak-passwords.',
  qr:
    'terminal output investigating a QR code on a poster (zbarimg decode, whois creation date, page title). evidence.lang = "shell". 2-3 red flags. need = 2. technique = quishing.',
};

export function buildPrompt(device: DeviceId): string {
  return `You write cases for "Code Red Room", a cybersecurity escape-room game for university students and school visitors.
The hacker NullByte has infected one device in Pixel the robot's room. Players first guess the device from 3 riddle clues, then inspect its evidence, flag the bad lines, name the attack and choose the fix.

Create ONE new, original case. The infected device is: ${device}.
Evidence must be: ${DEVICE_BRIEF[device]}

Rules:
- Fictional brands only (SnackSwap, QuickParcel, Brightfield University, BeanCafe). No real companies, no real URLs, no working attack code.
- Clues are riddles written by NullByte, from vague to obvious. Clue 3 should point at the physical object in the room (e.g. "the folding computer", "the blinking box on the shelf").
- Plain, friendly English for beginners. Every "why" explains the reason in under 20 words.
- technique must be one of: ${TECHNIQUE_IDS.join(", ")}.
- Exactly 3 fixes, exactly one with ok=true.
- lesson.vibe is a question a vibe coder should ask their AI (only for laptop; otherwise "").

Return ONLY JSON matching:
{"title":string,"story":string,"clues":[string,string,string],
 "evidence":{"file":string,"lang":"js"|"eml"|"json"|"shell"|"txt","lines":[{"text":string,"bad":boolean,"why":string}]},
 "need":number,"technique":string,
 "fixes":[{"text":string,"ok":boolean,"why":string}],
 "lesson":{"how":string,"spot":string,"tip":string,"vibe":string}}`;
}

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Calls Gemini and returns the parsed JSON, or null on any failure or timeout. */
export async function generateWithGemini(device: DeviceId, timeoutMs = 12000): Promise<unknown | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(device) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
        }),
        signal: ctrl.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
