import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        card: "rgba(255, 255, 255, 0.9)",
        metaBlue: "#0084FF",
        metaPurple: "#8B5CF6",
        text: "#0A0A0A",
        // Extended dark mode tokens
        darkBg: "#090A0F",
        darkCard: "rgba(20, 22, 28, 0.88)",
        darkText: "#F4F4F5",
      },
      borderRadius: {
        card: "32px",
        pill: "999px",
        halo: "24px",
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.06)",
        sheet: "0 -16px 48px rgba(0, 0, 0, 0.12)",
        halo: "0 0 24px rgba(0, 132, 255, 0.35)",
        "halo-purple": "0 0 24px rgba(139, 92, 246, 0.4)",
      },
      lineHeight: {
        hindi: "1.6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        hindi: ["var(--font-inter)", "Inter", "Noto Sans Devanagari", "sans-serif"],
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "halo-breathe": "haloBreathe 2s ease-in-out infinite",
        "sound-wave": "soundWave 1.2s ease-in-out infinite alternate",
      },
      keyframes: {
        haloBreathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
        soundWave: {
          "0%": { height: "6px" },
          "100%": { height: "28px" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
