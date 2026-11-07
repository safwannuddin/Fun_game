import { z } from "zod";
import { TECHNIQUE_IDS } from "./techniques";
import { DEVICE_IDS } from "./devices";
import type { Case } from "./types";

const line = z.object({
  text: z.string().min(1).max(160),
  bad: z.boolean(),
  why: z.string().min(1).max(220),
});

const fix = z.object({
  text: z.string().min(1).max(160),
  ok: z.boolean(),
  why: z.string().min(1).max(220),
});

/** Strict shape every AI-generated case must pass before the player sees it. */
export const caseSchema = z
  .object({
    title: z.string().min(1).max(60),
    story: z.string().min(1).max(260),
    clues: z.array(z.string().min(1).max(140)).length(3),
    evidence: z.object({
      file: z.string().min(1).max(80),
      lang: z.enum(["js", "eml", "json", "shell", "txt"]),
      lines: z.array(line).min(4).max(10),
    }),
    need: z.number().int().min(1).max(3),
    technique: z.enum(TECHNIQUE_IDS as [string, ...string[]]),
    fixes: z.array(fix).length(3),
    lesson: z.object({
      how: z.string().min(1).max(320),
      spot: z.string().min(1).max(220),
      tip: z.string().min(1).max(220),
      vibe: z.string().max(200).optional(),
    }),
  })
  .superRefine((c, ctx) => {
    const bads = c.evidence.lines.filter((l) => l.bad).length;
    if (bads < 1) ctx.addIssue({ code: "custom", message: "evidence needs at least one bad line" });
    if (c.need > bads) ctx.addIssue({ code: "custom", message: "need is larger than the number of bad lines" });
    if (c.fixes.filter((f) => f.ok).length !== 1) ctx.addIssue({ code: "custom", message: "exactly one fix must be ok" });
  });

export const deviceSchema = z.enum(DEVICE_IDS as [string, ...string[]]);

export function toCase(raw: unknown, device: Case["device"]): Case | null {
  const parsed = caseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const c = parsed.data;
  return {
    ...c,
    id: `ai-${device}-${Date.now().toString(36)}`,
    device,
    technique: c.technique as Case["technique"],
    source: "ai",
  };
}
