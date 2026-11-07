/** All scoring rules live here so the presentation can explain them in one place. */
export const ROUNDS = 5;
export const ROUND_SECONDS = 90;
export const MAX_GUESSES = 3;

export const POINTS = {
  base: 300,
  extraClue: 40, // revealing clue 2 or 3
  wrongGuess: 50, // picking a clean item in the room
  wrongFlag: 15, // flagging an innocent line
  pixelHint: 25, // asking Pixel where to look in the evidence
  wrongVerdict: 50, // naming the wrong attack
  wrongFix: 40,
  perSecondLeft: 2,
  safetyBonusPerPoint: 2, // end of game
} as const;

export const SAFETY = {
  wrongGuess: 10,
  wrongFlag: 5,
  wrongVerdict: 10,
  wrongFix: 10,
  lostCase: 25,
} as const;

export function rankFor(score: number, survived: boolean): { title: string; note: string } {
  if (!survived) return { title: "Easy Target", note: "NullByte got in this time. Every analyst gets hacked in training." };
  if (score >= 1900) return { title: "Cyber Guardian", note: "You read evidence like a security analyst." };
  if (score >= 1400) return { title: "Threat Hunter", note: "Sharp eyes. A couple more cases and you're a guardian." };
  if (score >= 900) return { title: "Bug Hunter", note: "Solid instincts. Try using fewer clues." };
  return { title: "Cyber Cadet", note: "You survived. Now go faster." };
}
