import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#0a0a0a",
        paper: "#f6f5f1",
      },
    },
  },
  plugins: [],
};

export default config;
