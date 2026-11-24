import { useSyncExternalStore } from "react";

export type ThemePreference = "auto" | "light" | "dark";

let current: ThemePreference = "auto";
const listeners = new Set<() => void>();

export function setThemePreference(next: ThemePreference): void {
  if (next === current) return;
  current = next;
  for (const l of [...listeners]) l();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => "auto",
  );
}
