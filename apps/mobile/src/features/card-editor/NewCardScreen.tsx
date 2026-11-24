import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { validateCardDraft } from "@/domain/card/card";
import { clozeSyntaxFromDoc, parseContent } from "@/domain/card/content";
import { reversedCompanion, syncCompanion } from "@/domain/card/kind";
import type { Card, CardKind, Collection, Importance } from "@/domain/types";
import { ConfirmSheet } from "@/shared/ui";

import { NewCardView } from "./NewCardView";

type Props = { onDone: () => void; onClose: () => void; initialCollectionId?: string; cardId?: string };

export function NewCardScreen({ onDone, onClose, initialCollectionId, cardId }: Props) {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<Card | null>(null);
  const [kind, setKind] = useState<CardKind>("basic");
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
        let found = await c.cards.get(cardId);
        if (found && found.direction === "reverse" && found.pairId) {
          found = (await c.cards.get(found.pairId)) ?? found;
        }
        if (cancelled) return;
        if (found) {
          setOriginal(found);
          setKind(found.kind);
          const doc = found.kind === "cloze" ? parseContent(found.frontDoc) : null;
          setFront(doc?.ok ? clozeSyntaxFromDoc(doc.doc) : found.front);
          setBack(found.kind === "cloze" ? "" : found.back);
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
    const result = validateCardDraft({ front, back, collectionId, importance, kind });
    if (!result.ok) {
      setErrors({
        front: result.errors.includes("front_empty")
          ? t("card.errors.front_empty")
          : result.errors.includes("cloze_missing")
            ? t("card.errors.cloze_missing")
            : undefined,
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
      const main: Card = {
        id: original?.id ?? c.newId(),
        collectionId: result.collectionId,
        front: result.front,
        back: result.back,
        frontDoc: result.frontDoc,
        backDoc: null,
        kind: result.kind,
        direction: "forward",
        pairId: null,
        tags: original?.tags ?? [],
        importance: result.importance,
        status: original?.status ?? "active",
        createdAt: original?.createdAt ?? now,
        updatedAt: now,
        deletedAt: null,
      };
      const existing = original ? await c.cards.getByPair(original.id) : null;
      if (result.kind === "reversed") {
        const companion = existing ? syncCompanion(main, existing) : reversedCompanion(main, c.newId());
        await c.cards.saveMany([main, companion]);
      } else if (existing) {
        await c.cards.saveMany([main, { ...existing, deletedAt: now, updatedAt: now }]);
      } else {
        await c.cards.save(main);
      }
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
      const existing = await c.cards.getByPair(original.id);
      await c.cards.saveMany(existing ? [next, syncCompanion(next, existing)] : [next]);
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
      const existing = await c.cards.getByPair(original.id);
      if (existing) await c.cards.softDelete(existing.id);
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
        kind={kind}
        onKind={setKind}
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
