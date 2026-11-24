import { useEffect, useState } from "react";

import { getContainer } from "@/data/container";
import { defaultSettings, type DailyMinutes } from "@/domain/settings/settings";

import { SettingsView } from "./SettingsView";

type Props = { onDone: () => void; onBack?: () => void };

export function SettingsScreen({ onDone, onBack }: Props) {
  const [minutes, setMinutes] = useState<DailyMinutes>(10);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getContainer().then(async (c) => {
      const current = await c.settings.get();
      if (!cancelled && current) setMinutes(current.dailyMinutes);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (value: DailyMinutes | null) => {
    setBusy(true);
    try {
      const c = await getContainer();
      const base = (await c.settings.get()) ?? defaultSettings(c.now());
      await c.settings.save({ ...base, dailyMinutes: value ?? base.dailyMinutes, updatedAt: c.now() });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsView
      minutes={minutes}
      onMinutes={setMinutes}
      busy={busy}
      onStart={() => void persist(minutes)}
      onSkip={() => void persist(null)}
      onBack={onBack}
    />
  );
}
