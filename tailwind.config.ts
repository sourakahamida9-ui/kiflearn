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
          DEFAULT: "#0a0a0a",
          soft: "#171717",
          muted: "#737373",
        },
        paper: "#ffffff",
        surface: "#f8fafc",
        brand: {
          DEFAULT: "#2563eb",
          deep: "#1d4ed8",
          light: "#dbeafe",
          glow: "#60a5fa",
        },
        ans: {
          a: "#1e3a8a",
          b: "#2563eb",
          c: "#3b82f6",
          d: "#0ea5e9",
        },
      },
      borderRadius: {
        card: "1.25rem",
        btn: "0.875rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(10, 10, 10, 0.04)",
        card: "0 4px 24px rgba(37, 99, 235, 0.08)",
        "card-hover": "0 12px 40px rgba(37, 99, 235, 0.14)",
        glow: "0 0 40px rgba(37, 99, 235, 0.25)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slide-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
