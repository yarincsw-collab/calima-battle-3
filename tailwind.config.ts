import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette pulled from the Calima Battles 3 poster
        ink: {
          950: "#05070A",
          900: "#0A0D12",
          800: "#10141B",
          700: "#181C25",
          600: "#222936",
        },
        electric: {
          400: "#3FC9FF",
          500: "#1BA4E0",
          600: "#0B86C2",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "system-ui", "sans-serif"],
        body: ['"Open Sans"', '"Open Sans Hebrew"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grunge-gradient":
          "radial-gradient(circle at 20% 10%, rgba(27,164,224,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(11,134,194,0.22), transparent 50%), linear-gradient(180deg, #05070A 0%, #0A0D12 50%, #05070A 100%)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(27,164,224,0.35)",
        "glow-strong": "0 0 60px rgba(63,201,255,0.55)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 25px rgba(27,164,224,0.45)" },
          "50%": { boxShadow: "0 0 55px rgba(63,201,255,0.75)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite",
        floatY: "floatY 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
