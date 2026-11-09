import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1322",
        surface: "#141c2f",
        raised: "#1c263d",
        line: "#2a3654",
        text: "#e8ecf6",
        muted: "#8e99b6",
        signal: "#ff8a3d",
        danger: "#ff5468",
        safe: "#35d39a",
        info: "#72a7ff",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-7px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(3px)" },
        },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.25" } },
        drift: { from: { transform: "translateX(-60px)" }, to: { transform: "translateX(220px)" } },
        sway: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        flicker: { "0%,92%,100%": { opacity: "0.55" }, "94%": { opacity: "0.3" }, "96%": { opacity: "0.6" } },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        blink: "blink 1.2s infinite",
        drift: "drift 30s linear infinite",
        sway: "sway 4s ease-in-out infinite",
        flicker: "flicker 5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
