import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { defaultSettings, normalizeWeekdays, type DailyMinutes } from "@/domain/settings/settings";

import { SettingsView, type SettingsStep } from "./SettingsView";

type Props = { onDone: () => void; onBack?: () => void };

export function SettingsScreen({ onDone, onBack }: Props) {
  const { t: tr } = useTranslation();
  const [step, setStep] = useState<SettingsStep>(0);
  const [minutes, setMinutes] = useState<DailyMinutes>(10);
  const [offWeekdays, setOffWeekdays] = useState<readonly number[]>([]);
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getContainer().then(async (c) => {
      const current = await c.settings.get();
      if (cancelled || !current) return;
      setMinutes(current.dailyMinutes);
      setOffWeekdays(current.offWeekdays);
      setGoal(current.goalText);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (apply: boolean) => {
    setBusy(true);
    try {
      const c = await getContainer();
      const base = (await c.settings.get()) ?? defaultSettings(c.now());
      await c.settings.save(
        apply
          ? {
              ...base,
              dailyMinutes: minutes,
              offWeekdays: normalizeWeekdays(offWeekdays),
              goalText: goal.trim(),
              updatedAt: c.now(),
            }
          : { ...base, updatedAt: c.now() },
      );
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const sorted = normalizeWeekdays(offWeekdays);
  const rest =
    sorted.length === 0
      ? tr("onboarding.restNone")
      : tr("onboarding.restOn", {
          days: sorted.map((d) => tr(`onboarding.restDays.${d}`)).join(tr("onboarding.restJoin")),
        });

  return (
    <SettingsView
      step={step}
      minutes={minutes}
      onMinutes={setMinutes}
      offWeekdays={offWeekdays}
      onToggleWeekday={(d) =>
        setOffWeekdays((cur) => normalizeWeekdays(cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
      }
      goal={goal}
      onGoal={setGoal}
      pledge={tr("onboarding.pledge", { minutes, rest })}
      busy={busy}
      onNext={() => (step === 2 ? void persist(true) : setStep((step + 1) as SettingsStep))}
      onSkip={() => void persist(false)}
      onBack={step === 0 ? onBack : () => setStep((step - 1) as SettingsStep)}
    />
  );
}
