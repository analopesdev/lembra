import { useEffect } from "react";

import { getContainer } from "@/data/container";

export function useFirstRun(onFirstRun: () => void): void {
  useEffect(() => {
    let cancelled = false;
    void getContainer().then(async (c) => {
      if (!cancelled && (await c.settings.get()) === null) onFirstRun();
    });
    return () => {
      cancelled = true;
    };
  }, [onFirstRun]);
}
