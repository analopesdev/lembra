import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { validateCardDraft } from "@/domain/card/card";
import {
  clozeSyntaxFromDoc,
  hasFormatting,
  parseContent,
  serializeContent,
  type ContentDoc,
} from "@/domain/card/content";
import { reversedCompanion, syncCompanion } from "@/domain/card/kind";
import type { Card, CardKind, Collection, Importance } from "@/domain/types";
import { ConfirmSheet } from "@/shared/ui";

import { NewCardView } from "./NewCardView";
import type { RichValue } from "./richTypes";

type Props = { onDone: () => void; onClose: () => void; initialCollectionId?: string; cardId?: string };

export function NewCardScreen({ onDone, onClose, initialCollectionId, cardId }: Props) {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<Card | null>(null);
  const [kind, setKind] = useState<CardKind>("basic");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontRich, setFrontRich] = useState<ContentDoc | null>(null);
  const [backRich, setBackRich] = useState<ContentDoc | null>(null);
  const [init, setInit] = useState<{
    front: { doc: ContentDoc | null; text: string };
    back: { doc: ContentDoc | null; text: string };
  }>({
    front: { doc: null, text: "" },
    back: { doc: null, text: "" },
  });
  const [editorsReady, setEditorsReady] = useState(cardId === undefined);
  const [editorKey, setEditorKey] = useState(0);
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
          const fd = found.kind === "cloze" ? null : parseContent(found.frontDoc);
          const bd = found.kind === "cloze" ? null : parseContent(found.backDoc);
          setInit({
            front: { doc: fd?.ok ? fd.doc : null, text: found.front },
            back: { doc: bd?.ok ? bd.doc : null, text: found.back },
          });
          setFrontRich(fd?.ok ? fd.doc : null);
          setBackRich(bd?.ok ? bd.doc : null);
          setEditorsReady(true);
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
        frontDoc:
          result.frontDoc ??
          (result.kind !== "cloze" && frontRich && hasFormatting(frontRich)
            ? serializeContent(frontRich)
            : null),
        backDoc:
          result.kind !== "cloze" && backRich && hasFormatting(backRich) ? serializeContent(backRich) : null,
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

  const onFrontRich = useCallback((v: RichValue) => {
    setFront(v.text);
    setFrontRich(v.doc);
  }, []);
  const onBackRich = useCallback((v: RichValue) => {
    setBack(v.text);
    setBackRich(v.doc);
  }, []);

  return (
    <>
      <NewCardView
        editorsReady={editorsReady}
        editorKey={editorKey}
        frontInit={init.front}
        backInit={init.back}
        onFrontRich={onFrontRich}
        onBackRich={onBackRich}
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
            setFrontRich(null);
            setBackRich(null);
            setInit({ front: { doc: null, text: "" }, back: { doc: null, text: "" } });
            setEditorKey((k) => k + 1);
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
