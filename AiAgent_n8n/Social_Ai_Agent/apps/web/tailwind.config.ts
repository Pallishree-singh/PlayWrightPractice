import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F1A",
        mist: "#E7F0FF",
        flux: "#7AF0C4",
        ember: "#FF8748",
        slate: "#1E2B45"
      }
    }
  },
  plugins: []
};

export default config;
