import { useColorScheme } from "react-native";
import { useSyncExternalStore } from "react";

import { themes, type ThemeColors, type ThemeName } from "./theme";

export type Colors = Record<keyof ThemeColors, string>;

const subscribe = () => () => undefined;

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useThemeName(): ThemeName {
  const scheme = useColorScheme();
  const hydrated = useHydrated();
  return hydrated && scheme === "dark" ? "escuro" : "claro";
}

export function useTheme(): Colors {
  return themes[useThemeName()];
}
