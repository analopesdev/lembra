import { useSyncExternalStore } from "react";

let current = false;
const listeners = new Set<() => void>();

export function setGlassNav(next: boolean): void {
  if (next === current) return;
  current = next;
  for (const l of [...listeners]) l();
}

export function useGlassNav(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => false,
  );
}
