/**
 * Os tokens de design vivem em src/shared/ui/theme.ts (docs/lembra-design-kit). Componentes usam o tema
 * por `useTheme()`; não há cores próprias aqui (nunca um hex fora do theme.ts).
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: { extend: {} },
  plugins: [],
};
