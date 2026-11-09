# Ship It Safe

An interactive cybersecurity quiz game. Players sign in, choose a 3D coder, and guide them through **10 days of real attacks**, from phishing to prompt injection. Each day a different teacher explains one attack, then the player answers 4 challenges to help the character get through it.

Built for the CSDT Student Ambassador individual project at LSBU.

## The story

Your character vibe-coded **CampusEats**, a food-sharing app for students, entirely with AI. It's going viral, and in 10 days it's Demo Day, where a security review decides who wins a summer internship at ByteForge. The hackers have already noticed the app. You are the mentor: get your character through all 10 days and the app launches safely.

## Flow

1. **Welcome:** both coders wave at you. Tap *Get started*.
2. **Create a profile:** email and name. Progress is saved to that email.
3. **Choose a coder:** a 3D male or female avatar, and give them a name.
4. **Story:** three short scenes explain the dream, the problem and your mission.
5. **Day map:** Days 1–10, each unlocked by clearing the one before.
6. **Each day:** the incident → a lesson from that day's teacher → 4 challenges → stars and XP.

## The 10 days

| Day | Attack | Teacher | Tier |
| --- | --- | --- | --- |
| 1 | Phishing | Inspector Iris | Basic |
| 2 | Weak passwords | Coach Kai | Basic |
| 3 | Smishing & QR scams | Officer Nova | Basic |
| 4 | Malware & fake downloads | Dr. Byte | Intermediate |
| 5 | Fake Wi-Fi & firewalls | Captain Mesh | Intermediate |
| 6 | Leaked API keys | Agent Vault | Intermediate |
| 7 | SQL injection | Professor Query | Intermediate |
| 8 | Cross-site scripting | Ms. Script | Advanced |
| 9 | Fake packages (supply chain) | Chief Pack | Advanced |
| 10 | Prompt injection | Professor Prompt | Advanced |

**Challenge types:** multiple choice, picture choice (mock emails, texts, files and Wi-Fi lists), tap-the-bad-line code questions, and true/false.

**Feedback:** a right answer plays a chime and confetti, and the character jumps. A wrong answer plays a buzzer, shakes the card, makes the character sad, and explains the right answer.

**Progress:** 3 of 4 correct clears a day (4 of 4 earns 3 stars). The character ranks up from Vibe Coder → Junior Dev → Developer → Software Engineer → Security Engineer → Cyber Guardian.

## Live features

These run on the server (Vercel functions), so API keys never reach the browser. Each one hides itself when its key is missing, so the game always works.

- **Ask the teacher (AI):** players chat with the day's teacher. Gemini answers in character, stays on the day's topic, and only teaches defence.
- **AI bonus challenge:** after clearing a day, Gemini writes a brand-new question. It is checked against a strict schema before it is shown, and earns +20 XP once per day.
- **Live leaderboard:** this week's top 10 across every device, refreshed every 15 seconds. Emails are hashed and never stored.

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- three.js + React Three Fiber for the 3D characters
- framer-motion for animation, WebAudio for sound effects
- zod for validating forms, API input and AI output
- Gemini API (server-side) for the teacher chat and bonus questions
- Upstash Redis (REST) for the weekly leaderboard

```
app/                    page shell, fonts, global styles
components/quiz/
  Journey.tsx           top-level flow
  Welcome.tsx           first screen
  Login.tsx             email sign-in
  AvatarPick.tsx        choose and name the coder
  Avatar3D.tsx          the 3D character and its reactions
  StoryIntro.tsx        the three story scenes
  DayMap.tsx            Days 1–10, rank, XP, launch readiness
  DayPlay.tsx           lesson → challenges → result
  VisualCard.tsx        mock email / SMS / file / Wi-Fi cards
  Confetti.tsx
  TeacherChat.tsx       live chat with the day's teacher
  BonusChallenge.tsx    AI-written bonus question
  Leaderboard.tsx       live weekly leaderboard
app/api/
  features/             which live features are switched on
  teacher/              Gemini teacher chat
  bonus/                Gemini bonus question (schema-checked)
  leaderboard/          read and submit weekly scores
lib/
  journey.ts            story, teachers, lessons and all 40 questions
  profile.ts            sign-in and saved progress
  features.ts           client hook for the live features
  server/gemini.ts      server-only Gemini client
  server/redis.ts       Upstash REST client
  sound.ts              sound effects
```

All game content lives in `lib/journey.ts`, so questions and wording can be changed without touching the UI.

## Run it locally

```bash
npm install
npm run dev     # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Deploy (Vercel)

1. Import the repository at vercel.com/new. The Next.js defaults work.
2. Optional, under Project → Settings → Environment Variables (see `.env.example`):
   - `GEMINI_API_KEY` to switch on the teacher chat and bonus challenge
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to switch on the leaderboard (or add the Upstash integration from Vercel's Storage tab, which sets them for you)
3. Deploy (redeploy after adding variables), then turn the URL into a QR code.

For local development, copy `.env.example` to `.env.local` and fill in the same values.

## Future improvements

- Google sign-in with Clerk, and progress saved online across devices
- AI-generated full days, adapted to the topics each player gets wrong
- Rate limiting and moderation on the AI features
- More days and attacks, plus a teacher dashboard for classes
