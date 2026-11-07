/** Tiny WebAudio sound effects. No audio files, nothing to load. */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean) {
  enabled = on;
}
export function soundOn() {
  return enabled;
}

function tone(freq: number, dur = 0.12, type: OscillatorType = "sine", vol = 0.07, delay = 0) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new AC();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* audio not available */
  }
}

export const sfx = {
  click: () => tone(1100, 0.04, "square", 0.025),
  good: () => {
    tone(660, 0.1, "triangle");
    tone(880, 0.14, "triangle", 0.07, 0.09);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, "triangle", 0.07, i * 0.09)),
  bad: () => tone(150, 0.25, "sawtooth", 0.05),
  alarm: () => [0, 0.26].forEach((t) => {
    tone(880, 0.12, "square", 0.04, t);
    tone(620, 0.12, "square", 0.04, t + 0.13);
  }),
  tick: () => tone(1300, 0.03, "square", 0.02),
};
