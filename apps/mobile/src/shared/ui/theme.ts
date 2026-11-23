// Lembra — tokens de design (gerado a partir de design-tokens.json)
// Uso: const t = themes[colorScheme === "dark" ? "escuro" : "claro"];

export const palette = {
  azulPetroleo: "#293746",
  azulAco: "#5D91B8",
  iceBlue: "#A8C8DF",
  fundo: "#F0F3F6",
  dark: "#171D25",
} as const;

export const themes = {
  claro: {
    background: "#F0F3F6",
    surface: "#FFFFFF",
    surfaceMuted: "#F0F3F6",
    border: "#DDE3EA",
    text: "#171D25",
    textMuted: "#4E5B69",
    link: "#293746",
    primary: "#293746",
    onPrimary: "#FFFFFF",
    button: "#5D91B8",
    onButton: "#171D25",
    accent: "#A8C8DF",
    tint: "#DCE8F2",
    onTint: "#293746",
    hero: "#293746",
    onHero: "#FFFFFF",
    onHeroMuted: "#C9D7E4",
    heroTrack: "#3B4C5E",
    success: "#12855A",
    successTint: "#DDF5EA",
    danger: "#C23B3B",
    dangerTint: "#FBE5E5",
    collection2: "#E3EEF6",
    onCollection2: "#3E6F94",
    collection3: "#E6E9EE",
    onCollection3: "#4E5B69",
    appleButton: "#000000",
    onAppleButton: "#FFFFFF",
    // Sobreposição atrás de folhas (acréscimo ao kit; o kit será atualizado para igualar).
    scrim: "rgba(11, 15, 20, 0.55)",
  },
  escuro: {
    background: "#171D25",
    surface: "#1F2731",
    surfaceMuted: "#171D25",
    border: "#2C3641",
    text: "#F0F3F6",
    textMuted: "#9AA8B6",
    link: "#A8C8DF",
    primary: "#A8C8DF",
    onPrimary: "#171D25",
    button: "#5D91B8",
    onButton: "#171D25",
    accent: "#A8C8DF",
    tint: "#24313E",
    onTint: "#A8C8DF",
    hero: "#293746",
    onHero: "#FFFFFF",
    onHeroMuted: "#C9D7E4",
    heroTrack: "#3B4C5E",
    success: "#3CC48A",
    successTint: "#16332A",
    danger: "#F07A7A",
    dangerTint: "#3A1F22",
    collection2: "#1E3242",
    onCollection2: "#A8C8DF",
    collection3: "#262D36",
    onCollection3: "#C9D3DD",
    appleButton: "#FFFFFF",
    onAppleButton: "#000000",
    scrim: "rgba(0, 0, 0, 0.65)",
  },
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeColors = typeof themes.claro;

export const fonts = {
  // carregue com @expo-google-fonts/manrope e @expo-google-fonts/sora
  text: {
    regular: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semibold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
    extrabold: "Manrope_800ExtraBold",
  },
  numbers: { medium: "Sora_500Medium", semibold: "Sora_600SemiBold", bold: "Sora_700Bold" },
} as const;

export const type = {
  display: {
    size: 40,
    lineHeight: 1.05,
    weight: 800,
    letterSpacing: -0.03,
  },
  pergunta: {
    size: 27,
    lineHeight: 1.22,
    weight: 700,
    letterSpacing: -0.02,
  },
  titulo: {
    size: 23,
    lineHeight: 1.2,
    weight: 800,
    letterSpacing: -0.02,
  },
  subtitulo: {
    size: 16,
    lineHeight: 1.3,
    weight: 700,
  },
  corpo: {
    size: 15,
    lineHeight: 1.5,
    weight: 400,
  },
  label: {
    size: 13,
    lineHeight: 1.3,
    weight: 600,
  },
  legenda: {
    size: 12,
    lineHeight: 1.35,
    weight: 500,
  },
  numeroGrande: {
    size: 32,
    lineHeight: 1,
    weight: 700,
    letterSpacing: -0.03,
    font: "Sora",
  },
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  sheet: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const minTouch = 44;
