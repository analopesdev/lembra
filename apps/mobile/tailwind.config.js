/** Tokens de design centralizados (ADR-0020). Contraste AA verificado nos pares texto/fundo. */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        fundo: { DEFAULT: "#FFFFFF", escuro: "#0F172A" },
        texto: { DEFAULT: "#0F172A", escuro: "#F1F5F9" },
        suave: { DEFAULT: "#475569", escuro: "#CBD5E1" },
        marca: { DEFAULT: "#4338CA", escuro: "#A5B4FC" },
      },
    },
  },
  plugins: [],
};
