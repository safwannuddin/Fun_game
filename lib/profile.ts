/**
 * Player profile + progress.
 *
 * Sign-in is a simple email form for now; profiles live in this browser
 * (localStorage, keyed by email). To move to Clerk or Google sign-in later,
 * replace signIn/signOut/currentEmail and keep the Profile shape — the rest of
 * the app only talks to these functions.
 */
import { z } from "zod";

export type AvatarKind = "male" | "female";

export interface DayProgress {
  stars: number;
  best: number; // best correct answers
}

export interface Profile {
  email: string;
  playerName: string;
  avatar: AvatarKind | null;
  characterName: string;
  storySeen: boolean;
  days: Record<number, DayProgress>;
  xp: number;
  createdAt: number;
}

export const emailSchema = z.string().trim().toLowerCase().email("That doesn't look like an email address.").max(120);
export const nameSchema = z.string().trim().min(1, "Tell us your name.").max(24);

const SESSION = "sis:session";
const key = (email: string) => `sis:profile:${email}`;

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage blocked: progress lasts for this visit only */
  }
}

export function currentProfile(): Profile | null {
  const email = read<string>(SESSION);
  return email ? read<Profile>(key(email)) : null;
}

export function signIn(emailRaw: string, nameRaw: string): Profile {
  const email = emailSchema.parse(emailRaw);
  const playerName = nameSchema.parse(nameRaw);
  const existing = read<Profile>(key(email));
  const profile: Profile = existing
    ? { ...existing, playerName }
    : { email, playerName, avatar: null, characterName: "", storySeen: false, days: {}, xp: 0, createdAt: Date.now() };
  write(key(email), profile);
  write(SESSION, email);
  return profile;
}

export function saveProfile(p: Profile) {
  write(key(p.email), p);
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION);
  } catch {
    /* ignore */
  }
}

export function daysCleared(p: Profile): number {
  return Object.values(p.days).filter((d) => d.stars >= 2).length;
}

export function isUnlocked(p: Profile, day: number): boolean {
  return day === 1 || (p.days[day - 1]?.stars ?? 0) >= 2;
}
