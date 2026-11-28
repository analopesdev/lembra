import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { validateCardDraft } from "@/domain/card/card";
import { pickAudio, pickImage } from "@/data/media/capture";
import { storeLocal } from "@/data/media/files";
import { uploadIfPossible } from "@/data/media/upload";
import {
  appendMedia,
  clozeSyntaxFromDoc,
  fromPlainText,
  hasFormatting,
  mediaIds,
  parseContent,
  removeMedia,
  retainMedia,
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
  const [mediaUris, setMediaUris] = useState<Record<string, string>>({});
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
    const result = validateCardDraft({
      front,
      back,
      collectionId,
      importance,
      kind,
      frontHasMedia: !!frontRich && mediaIds(frontRich).length > 0,
      backHasMedia: !!backRich && mediaIds(backRich).length > 0,
    });
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
      const ids = [...(frontRich ? mediaIds(frontRich) : []), ...(backRich ? mediaIds(backRich) : [])];
      for (const id of ids) {
        const item = await c.media.get(id);
        if (item) void uploadIfPossible(c.media, item);
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
    setFrontRich((prev) => retainMedia(prev, v.doc));
  }, []);
  const onBackRich = useCallback((v: RichValue) => {
    setBack(v.text);
    setBackRich((prev) => retainMedia(prev, v.doc));
  }, []);

  const attach = async (side: "front" | "back", kind: "image" | "audio") => {
    const captured = kind === "image" ? await pickImage() : await pickAudio();
    if (!captured) return;
    const c = await getContainer();
    const id = c.newId();
    const stored = await storeLocal(id, captured.uri, captured.ext);
    await c.media.save({
      id,
      kind: captured.kind,
      mime: captured.mime,
      localPath: stored.path,
      byteSize: stored.bytes,
      uploadedAt: null,
      createdAt: c.now(),
    });
    setMediaUris((prev) => ({ ...prev, [id]: stored.path }));
    const apply = side === "front" ? setFrontRich : setBackRich;
    const text = side === "front" ? front : back;
    apply((prev) => appendMedia(prev ?? fromPlainText(text), captured.kind, id));
  };

  return (
    <>
      <NewCardView
        editorsReady={editorsReady}
        editorKey={editorKey}
        frontInit={init.front}
        backInit={init.back}
        onFrontRich={onFrontRich}
        onBackRich={onBackRich}
        frontDoc={frontRich}
        backDoc={backRich}
        mediaUris={mediaUris}
        onFrontImage={() => void attach("front", "image")}
        onFrontAudio={() => void attach("front", "audio")}
        onBackImage={() => void attach("back", "image")}
        onBackAudio={() => void attach("back", "audio")}
        onRemoveMedia={(side, id) =>
          (side === "front" ? setFrontRich : setBackRich)((prev) => (prev ? removeMedia(prev, id) : prev))
        }
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
