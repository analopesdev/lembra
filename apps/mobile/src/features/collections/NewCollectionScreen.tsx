import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { maskExamDate, parseExamDate, validateName } from "@/domain/collection/collection";
import { diffDays, studyDayOf } from "@/domain/study-day/study-day";
import type { CollectionIconName, CollectionTone } from "@/domain/types";

import { NewCollectionView } from "./NewCollectionView";

type Props = { onDone: () => void; onBack: () => void };

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function NewCollectionScreen({ onDone, onBack }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<CollectionIconName>("bone");
  const [tone, setTone] = useState<CollectionTone>("tint");
  const [exam, setExam] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [examError, setExamError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [today] = useState(() => studyDayOf(new Date(), timeZone()));

  const parsed = parseExamDate(exam, today);
  const daysLeft = parsed.ok && parsed.day !== null ? diffDays(today, parsed.day) : null;

  const submit = async () => {
    const n = validateName(name);
    const e = parseExamDate(exam, today);
    setNameError(n.ok ? undefined : t(`collection.errors.${n.error}`));
    setExamError(e.ok ? undefined : t(`collection.errors.${e.error}`));
    if (!n.ok || !e.ok) return;
    setBusy(true);
    try {
      const c = await getContainer();
      const now = c.now();
      await c.collections.save({
        id: c.newId(),
        name: n.name,
        icon,
        tone,
        examDay: e.day,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <NewCollectionView
      name={name}
      onName={setName}
      icon={icon}
      onIcon={setIcon}
      tone={tone}
      onTone={setTone}
      exam={exam}
      onExam={(v) => setExam(maskExamDate(v))}
      examDaysLeft={daysLeft}
      nameError={nameError}
      examError={examError}
      busy={busy}
      onSubmit={() => void submit()}
      onBack={onBack}
    />
  );
}
