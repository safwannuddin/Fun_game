export type DeviceId = "laptop" | "monitor" | "phone" | "usb" | "router" | "sticky" | "qr";
export type DecoyId = "plant" | "lamp" | "mug";
export type RoomItemId = DeviceId | DecoyId;

export type TechniqueId =
  | "phishing"
  | "spear-phishing"
  | "smishing"
  | "quishing"
  | "evil-twin"
  | "usb-baiting"
  | "weak-passwords"
  | "leaked-secret"
  | "sql-injection"
  | "xss"
  | "broken-access";

/** One line of evidence the player can flag. */
export interface EvidenceLine {
  text: string;
  bad: boolean;
  /** Shown after the line is flagged (or in the debrief). */
  why: string;
}

export interface Fix {
  text: string;
  ok: boolean;
  why: string;
}

export type EvidenceLang = "js" | "eml" | "json" | "shell" | "txt";

/** A complete case: riddle clues → evidence → verdict → fix → lesson. */
export interface Case {
  id: string;
  device: DeviceId;
  title: string;
  /** One-sentence scenario shown when the evidence opens. */
  story: string;
  /** NullByte's riddle clues, vague → obvious. Exactly 3. */
  clues: string[];
  evidence: {
    file: string;
    lang: EvidenceLang;
    lines: EvidenceLine[];
  };
  /** How many bad lines the player must flag. */
  need: number;
  technique: TechniqueId;
  fixes: Fix[];
  lesson: {
    how: string;
    spot: string;
    tip: string;
    /** Prompt a vibe coder should ask their AI (code cases). */
    vibe?: string;
  };
  source: "bank" | "ai";
}

export interface CaseResult {
  caseId: string;
  device: DeviceId;
  technique: TechniqueId;
  solved: boolean;
  points: number;
}
