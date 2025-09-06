import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: {
          DEFAULT: "#FAFAFA", // off-white for cards/sections
          dark: "#0F0F0F", // splash background
          light: "#F5F5F5", // soft white shade
        },
        text: {
          DEFAULT: "#111111", // main text (black-ish)
          muted: "#6B7280", // grey subtitles
          white: "#FFFFFF",
        },

        // Accent palette
        accent: {
          teal: "#00FFCC",
          purple: "#9333EA",
          blue: "#2563EB",
          pink: "#E90052", // Added this official FPL pink color
        },

        // Borders & shadows
        border: {
          DEFAULT: "#E5E5E5",
          subtle: "#EAEAEA",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        brand: ["Cinzel", "serif"],
      },
      boxShadow: {
        card: "0 4px 10px rgba(0, 0, 0, 0.05)",
        glow: "0 0 15px rgba(147, 51, 234, 0.4)", // purple glow for accents
      },
      borderRadius: {
        xl: "0.75rem", // nice rounded corners for cards/buttons
        "2xl": "1rem",
      },
      backgroundImage: {
        "dashboard-gradient": "linear-gradient(to right, #2563EB, #9333EA)",
        "button-gradient": "linear-gradient(to right, #00FFCC, #9333EA)",
      },
    },
  },
  plugins: [],
};
export default config;