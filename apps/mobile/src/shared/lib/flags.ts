import { useSyncExternalStore } from "react";

export type FlagName = "ai_generation";

const DEFAULTS: Record<FlagName, boolean> = { ai_generation: false };

let current: Record<FlagName, boolean> = { ...DEFAULTS };
const listeners = new Set<() => void>();

export function setFlags(next: Partial<Record<FlagName, boolean>>): void {
  current = { ...current, ...next };
  for (const l of [...listeners]) l();
}

export function resetFlags(): void {
  current = { ...DEFAULTS };
  for (const l of [...listeners]) l();
}

export function useFlag(name: FlagName): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current[name],
    () => DEFAULTS[name],
  );
}
