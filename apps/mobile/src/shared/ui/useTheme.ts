import { useColorScheme } from "react-native";
import { useSyncExternalStore } from "react";

import { useThemePreference } from "../lib/themePreference";
import { themes, type ThemeColors, type ThemeName } from "./theme";

export type Colors = Record<keyof ThemeColors, string>;

const subscribe = () => () => undefined;

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useThemeName(): ThemeName {
  const system = useColorScheme();
  const preference = useThemePreference();
  const hydrated = useHydrated();
  if (!hydrated) return "claro";
  const dark = preference === "auto" ? system === "dark" : preference === "dark";
  return dark ? "escuro" : "claro";
}

export function useTheme(): Colors {
  return themes[useThemeName()];
}
