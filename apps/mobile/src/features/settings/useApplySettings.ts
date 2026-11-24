import { useEffect } from "react";

import { getContainer } from "@/data/container";
import { setThemePreference } from "@/shared/lib/themePreference";

export function useApplySettings(): void {
  useEffect(() => {
    let cancelled = false;
    let off: (() => void) | null = null;
    void getContainer().then((c) => {
      if (cancelled) return;
      off = c.settings.watch().subscribe((s) => setThemePreference(s?.theme ?? "auto"));
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);
}
