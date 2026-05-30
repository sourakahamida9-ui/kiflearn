import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#15121f",
          soft: "#1f1b30",
          line: "#2c2740",
        },
        paper: "#fff8f0",
        brand: {
          DEFAULT: "#ff5d3b", // corail signature
          deep: "#e6431f",
        },
        // Couleurs des 4 réponses (style game-show)
        ans: {
          a: "#ef4565", // rose-rouge / triangle
          b: "#2d7dd2", // bleu / losange
          c: "#f4a300", // ambre / cercle
          d: "#1fa97a", // teal / carré
        },
      },
      boxShadow: {
        tile: "0 6px 0 0 rgba(0,0,0,0.25)",
        "tile-press": "0 2px 0 0 rgba(0,0,0,0.25)",
        card: "0 18px 40px -12px rgba(21,18,31,0.45)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up": "slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
