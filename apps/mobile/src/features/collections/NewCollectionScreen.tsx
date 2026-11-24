import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { formatExamDate, maskExamDate, parseExamDate, validateName } from "@/domain/collection/collection";
import { diffDays, studyDayOf } from "@/domain/study-day/study-day";
import type { Collection, CollectionIconName, CollectionTone } from "@/domain/types";

import { NewCollectionView } from "./NewCollectionView";

type Props = { onDone: () => void; onBack: () => void; collectionId?: string };

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function NewCollectionScreen({ onDone, onBack, collectionId }: Props) {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<CollectionIconName>("bone");
  const [tone, setTone] = useState<CollectionTone>("tint");
  const [exam, setExam] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [examError, setExamError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [today] = useState(() => studyDayOf(new Date(), timeZone()));
  const editing = collectionId !== undefined;

  useEffect(() => {
    if (!collectionId) return;
    let cancelled = false;
    void getContainer().then(async (c) => {
      const found = await c.collections.get(collectionId);
      if (cancelled || !found) return;
      setOriginal(found);
      setName(found.name);
      setIcon(found.icon);
      setTone(found.tone);
      setExam(found.examDay ? formatExamDate(found.examDay) : "");
    });
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const unchangedExam =
    original !== null && original.examDay !== null && exam === formatExamDate(original.examDay);
  const parsed = unchangedExam
    ? { ok: true as const, day: original?.examDay ?? null }
    : parseExamDate(exam, today);
  const daysLeft = parsed.ok && parsed.day !== null ? diffDays(today, parsed.day) : null;

  const submit = async () => {
    const n = validateName(name);
    const e = unchangedExam
      ? { ok: true as const, day: original?.examDay ?? null }
      : parseExamDate(exam, today);
    setNameError(n.ok ? undefined : t(`collection.errors.${n.error}`));
    setExamError(e.ok ? undefined : t(`collection.errors.${e.error}`));
    if (!n.ok || !e.ok) return;
    setBusy(true);
    try {
      const c = await getContainer();
      const now = c.now();
      await c.collections.save({
        id: original?.id ?? c.newId(),
        name: n.name,
        icon,
        tone,
        examDay: e.day,
        createdAt: original?.createdAt ?? now,
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
      examDaysLeft={daysLeft !== null && daysLeft >= 0 ? daysLeft : null}
      nameError={nameError}
      examError={examError}
      busy={busy}
      title={editing ? t("collection.editTitle") : undefined}
      submitLabel={editing ? t("collection.saveChanges") : undefined}
      onSubmit={() => void submit()}
      onBack={onBack}
    />
  );
}
