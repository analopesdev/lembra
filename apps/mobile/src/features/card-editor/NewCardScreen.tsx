import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { validateCardDraft } from "@/domain/card/card";
import type { Card, Collection, Importance } from "@/domain/types";
import { ConfirmSheet } from "@/shared/ui";

import { NewCardView } from "./NewCardView";

type Props = { onDone: () => void; onClose: () => void; initialCollectionId?: string; cardId?: string };

export function NewCardScreen({ onDone, onClose, initialCollectionId, cardId }: Props) {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<Card | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [collections, setCollections] = useState<readonly Collection[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(initialCollectionId ?? null);
  const [importance, setImportance] = useState<Importance>(2);
  const [errors, setErrors] = useState<{ front?: string; back?: string; collection?: string }>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editing = cardId !== undefined;

  useEffect(() => {
    let off: (() => void) | null = null;
    let cancelled = false;
    void getContainer().then(async (c) => {
      if (cancelled) return;
      if (cardId) {
        const found = await c.cards.get(cardId);
        if (cancelled) return;
        if (found) {
          setOriginal(found);
          setFront(found.front);
          setBack(found.back);
          setCollectionId(found.collectionId);
          setImportance(found.importance);
        }
      }
      off = c.collections.watchAll().subscribe((list) => {
        setCollections(list);
        setCollectionId((current) => current ?? list[0]?.id ?? null);
      });
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, [cardId]);

  const persist = async (): Promise<boolean> => {
    const result = validateCardDraft({ front, back, collectionId, importance });
    if (!result.ok) {
      setErrors({
        front: result.errors.includes("front_empty") ? t("card.errors.front_empty") : undefined,
        back: result.errors.includes("back_empty") ? t("card.errors.back_empty") : undefined,
        collection: result.errors.includes("collection_missing")
          ? t("card.errors.collection_missing")
          : undefined,
      });
      setSaved(false);
      return false;
    }
    setErrors({});
    setBusy(true);
    try {
      const c = await getContainer();
      const now = c.now();
      await c.cards.save({
        id: original?.id ?? c.newId(),
        collectionId: result.collectionId,
        front: result.front,
        back: result.back,
        frontDoc: original?.frontDoc ?? null,
        backDoc: original?.backDoc ?? null,
        kind: original?.kind ?? "basic",
        direction: original?.direction ?? "forward",
        pairId: original?.pairId ?? null,
        tags: original?.tags ?? [],
        importance: result.importance,
        status: original?.status ?? "active",
        createdAt: original?.createdAt ?? now,
        updatedAt: now,
        deletedAt: null,
      });
      return true;
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async () => {
    if (!original) return;
    setBusy(true);
    try {
      const c = await getContainer();
      const next: Card = {
        ...original,
        status: original.status === "suspended" ? "active" : "suspended",
        updatedAt: c.now(),
      };
      await c.cards.save(next);
      setOriginal(next);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!original) return;
    setBusy(true);
    try {
      const c = await getContainer();
      await c.cards.softDelete(original.id);
      setConfirmingDelete(false);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <NewCardView
        front={front}
        onFront={setFront}
        back={back}
        onBack={setBack}
        collections={collections}
        collectionId={collectionId}
        onCollection={setCollectionId}
        importance={importance}
        onImportance={setImportance}
        errors={errors}
        savedNotice={saved}
        busy={busy}
        title={editing ? t("card.editTitle") : undefined}
        edit={
          editing && original
            ? {
                suspended: original.status === "suspended",
                onToggleSuspend: () => void toggleSuspend(),
                onDelete: () => setConfirmingDelete(true),
              }
            : undefined
        }
        onSave={() => void persist().then((ok) => ok && onDone())}
        onSaveAndNew={() =>
          void persist().then((ok) => {
            if (!ok) return;
            setFront("");
            setBack("");
            setSaved(true);
          })
        }
        onClose={onClose}
      />
      <ConfirmSheet
        visible={confirmingDelete}
        title={t("card.delete.title")}
        message={t("card.delete.message")}
        confirmLabel={t("card.delete.confirm")}
        cancelLabel={t("common.cancel")}
        dismissLabel={t("common.close")}
        destructive
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
