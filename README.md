# Code Red Room

A clue-based cybersecurity escape room built with Next.js. The hacker **NullByte** has infected one device in Pixel the robot's room and left riddles to taunt you. Work out which device it is, read its evidence the way a security analyst would, name the attack and choose the fix.

Built for the CSDT Student Ambassador individual project (LSBU, Winter 2026).

## Aim

More people are "vibe coding" (shipping code an AI wrote without reading it) and clicking links without checking them. Code Red Room trains the habit that stops both: **look at the evidence before you trust it.**

## Target players

- School and college visitors at open days. The email, text, Wi-Fi, USB, QR and password cases need no coding.
- University students and beginner coders.
- Vibe coders. The laptop cases are real bugs AI assistants write: leaked API keys, SQL injection, XSS and broken access control.

## How a case plays

| Step | What the player does | Scoring |
| --- | --- | --- |
| 1. Riddle | NullByte gives clue 1. Clues 2 and 3 can be unlocked. | −40 per extra clue |
| 2. Guess | Tap the device you suspect in the room. 3 guesses; decoys (plant, lamp, mug) cost a guess too. | −50 pts, −10% safety per wrong guess |
| 3. Inspect | The device's evidence opens: source code, raw email headers, an SMS payload, `ls`, `nmcli` or `zbarimg` output. Flag the lines that give the attack away. | −15 per wrong line, −25 to ask Pixel where to look |
| 4. Name it | Choose which attack it is (phishing, smishing, quishing, SQL injection…). | −50 per wrong answer |
| 5. Fix it | Choose what Pixel should do. | −40 per wrong answer |
| 6. Debrief | See the giveaway lines, how the technique works, how to spot it and the right move. Code cases add a prompt for vibe coders. | — |

Each case starts at 300 points plus 2 points per second left. Five cases, 90 seconds each. Running out of time or guesses loses the case (−25% safety). If Pixel's safety hits zero, the game ends. Survivors get a safety bonus and a rank: Cyber Cadet, Bug Hunter, Threat Hunter or Cyber Guardian.

## The 11 techniques

Phishing · Spear phishing · Smishing · Quishing (QR phishing) · Evil twin Wi-Fi · USB baiting · Weak passwords · Leaked API key · SQL injection · Cross-site scripting · Broken access control

## Architecture

```
Browser (Next.js client)                     Server (Next.js route handlers)
┌──────────────────────────┐   GET /api/case  ┌────────────────────────────┐
│ Game state machine       │ ───────────────► │ /api/case                  │
│ start → hunt → evidence  │                  │  ├─ AI mode + key set?     │──► Gemini API
│ → debrief → end          │ ◄─────────────── │  │   validate with zod     │   (JSON mode)
│ Room (SVG), CaseFile,    │   case JSON      │  └─ else / on failure:     │
│ EvidenceViewer, Debrief  │                  │      built-in case bank    │
│ Leaderboard (local)      │                  │ /api/health → ai on/off    │
└──────────────────────────┘                  └────────────────────────────┘
```

- **The API key never reaches the browser.** Gemini is called only from `lib/gemini.ts`, which is marked `server-only`.
- **Every AI case is validated** against `lib/schema.ts` (exactly 3 clues, at least one bad line, exactly one correct fix and so on) before a player sees it.
- **Nothing stalls on stage.** If the AI is slow (12 s timeout), returns bad JSON, or the network is down, the game uses the built-in bank. The bank also ships in the client bundle as a last resort.
- **The next case is prefetched** while the current one is being played.

```
app/
  page.tsx               page shell
  layout.tsx             fonts + metadata
  api/case/route.ts      case endpoint (AI or bank)
  api/health/route.ts    tells the client if AI mode is available
components/
  Game.tsx               state machine, timer, scoring
  Room.tsx               interactive SVG room
  CaseFile.tsx           NullByte's riddle clues + guesses
  EvidenceViewer.tsx     flag lines → name the attack → choose the fix
  Debrief.tsx            lesson card after each case
  StartScreen.tsx, EndScreen.tsx, Hud.tsx, Pixel.tsx
lib/
  cases.ts               built-in case bank (11 cases, all 7 devices)
  schema.ts              zod schema every case must pass
  gemini.ts              server-only Gemini client + prompt
  techniques.ts          technique names + verdict options
  scoring.ts             every scoring rule in one place
  leaderboard.ts         weekly leaderboard (localStorage)
  sound.ts               WebAudio sound effects
scripts/validate-cases.ts  checks the bank against the schema
```

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint
npm run typecheck
npm run validate     # check every built-in case against the schema
```

### Turn on AI Hacker mode (optional)

1. Get a Gemini API key from Google AI Studio.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
3. Restart the dev server. An **AI Hacker mode** checkbox appears on the start screen.

Without a key, the game runs on the built-in bank and the checkbox stays hidden.

## Deploy (Vercel)

1. Import this repo at vercel.com/new. The defaults for Next.js are correct.
2. Optionally add `GEMINI_API_KEY` (and `GEMINI_MODEL`) under Project → Settings → Environment Variables.
3. Deploy, then turn the production URL into a QR code for the presentation.

## Future improvements

- Shared online leaderboard (Supabase or Vercel KV) instead of per-device storage.
- Adaptive difficulty: track which techniques a player misses and generate more of those.
- Classroom mode: a teacher picks the techniques and gets a class report.
- "Scan my code" mode: paste your own vibe-coded snippet and get a case built from it.
- More rooms: a café, an office and a server room.
