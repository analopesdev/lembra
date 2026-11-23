import { useColorScheme } from "react-native";

import { themes, type ThemeColors, type ThemeName } from "./theme";

/** Mesmas chaves do kit, valores como string (claro e escuro têm hexes diferentes). */
export type Colors = Record<keyof ThemeColors, string>;

/**
 * Tema ativo: segue o sistema (`useColorScheme`). A opção manual Claro/Escuro/Automático das
 * Configurações entra com a tela de Configurações (DESIGN.md).
 */
export function useThemeName(): ThemeName {
  return useColorScheme() === "dark" ? "escuro" : "claro";
}

export function useTheme(): Colors {
  return themes[useThemeName()];
}
