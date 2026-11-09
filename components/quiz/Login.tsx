"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { emailSchema, nameSchema } from "@/lib/profile";

interface Props {
  onSignIn: (email: string, name: string) => void;
}

/** Simple email sign-in. Swap for Clerk / Google later without touching the rest of the app. */
export default function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) return setError(em.error.issues[0].message);
    const nm = nameSchema.safeParse(name);
    if (!nm.success) return setError(nm.error.issues[0].message);
    setError(null);
    onSignIn(em.data, nm.data);
  };

  return (
    <div className="flex min-h-[80dvh] items-center justify-center">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="panel flex w-full max-w-md flex-col gap-4 p-6 sm:p-8"
        noValidate
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold">Create your profile</h2>
          <p className="mt-1 text-sm text-muted">Your progress is saved to your email, so you can come back to the same day.</p>
        </div>
        <label className="flex flex-col gap-1.5" htmlFor="email">
          <span className="eyebrow">Email</span>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="rounded-lg border border-line bg-ink px-4 py-3 text-base outline-none focus:border-signal"
          />
        </label>
        <label className="flex flex-col gap-1.5" htmlFor="name">
          <span className="eyebrow">Your name</span>
          <input
            id="name"
            autoComplete="given-name"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className="rounded-lg border border-line bg-ink px-4 py-3 text-base outline-none focus:border-signal"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn text-base">
          Continue
        </button>
        <p className="text-xs text-muted">We only use your email to save your progress and show your first name on the leaderboard. It is never shared.</p>
      </motion.form>
    </div>
  );
}
