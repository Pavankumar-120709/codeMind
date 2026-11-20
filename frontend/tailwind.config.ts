import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F5F0",
        surface: {
          DEFAULT: "#FFFFFF",
          cream: "#FBF9F5",
          muted: "#F0ECE1",
          hover: "#EAE5D9"
        },
        charcoal: {
          DEFAULT: "#292824",
          light: "#4E4B43",
          muted: "#76736A"
        },
        border: {
          DEFAULT: "#E5E1D8",
          subtle: "#EFECE6",
          dark: "#D6D0C4"
        },
        terracotta: {
          DEFAULT: "#C66B48",
          hover: "#B35B39",
          light: "#FDF5F1",
          subtle: "#F8E4DB"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
};
export default config;
