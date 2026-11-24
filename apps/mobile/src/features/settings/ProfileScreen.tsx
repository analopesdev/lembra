import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";

import { getContainer } from "@/data/container";
import {
  defaultSettings,
  normalizeNewCards,
  normalizeWeekdays,
  type DailyMinutes,
  type Settings,
  type ThemePreference,
} from "@/domain/settings/settings";
import { useTodayModel } from "@/features/today";

import { ProfileView } from "./ProfileView";

type Props = { onBack: () => void };

export function ProfileScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const memory = useTodayModel().memoryRetained;

  useEffect(() => {
    let cancelled = false;
    void getContainer().then(async (c) => {
      const saved = (await c.settings.get()) ?? defaultSettings(c.now());
      if (!cancelled) setSettings(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const c = await getContainer();
    const base = (await c.settings.get()) ?? defaultSettings(c.now());
    const next: Settings = { ...base, ...patch, updatedAt: c.now() };
    setSettings(next);
    await c.settings.save(next);
  }, []);

  if (!settings) return null;
  return (
    <ProfileView
      minutes={settings.dailyMinutes}
      onMinutes={(v: DailyMinutes) => void update({ dailyMinutes: v })}
      newCards={settings.newCardsPerDay}
      onNewCards={(v) => void update({ newCardsPerDay: normalizeNewCards(v) })}
      offWeekdays={settings.offWeekdays}
      onToggleWeekday={(d) =>
        void update({
          offWeekdays: normalizeWeekdays(
            settings.offWeekdays.includes(d)
              ? settings.offWeekdays.filter((x) => x !== d)
              : [...settings.offWeekdays, d],
          ),
        })
      }
      theme={settings.theme}
      onTheme={(v: ThemePreference) => void update({ theme: v })}
      glassNav={settings.glassNav}
      onGlassNav={(v) => void update({ glassNav: v })}
      avatarSeed={settings.avatarSeed}
      retainedCount={memory}
      version={Constants.expoConfig?.version ?? "1.0.0"}
      onBack={onBack}
    />
  );
}
