import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import { validateCardDraft } from "@/domain/card/card";
import type { Collection, Importance } from "@/domain/types";

import { NewCardView } from "./NewCardView";

type Props = { onDone: () => void; onClose: () => void; initialCollectionId?: string };

export function NewCardScreen({ onDone, onClose, initialCollectionId }: Props) {
  const { t } = useTranslation();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [collections, setCollections] = useState<readonly Collection[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(initialCollectionId ?? null);
  const [importance, setImportance] = useState<Importance>(2);
  const [errors, setErrors] = useState<{ front?: string; back?: string; collection?: string }>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off: (() => void) | null = null;
    let cancelled = false;
    void getContainer().then((c) => {
      if (cancelled) return;
      off = c.collections.watchAll().subscribe((list) => {
        setCollections(list);
        setCollectionId((current) => current ?? list[0]?.id ?? null);
      });
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);

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
        id: c.newId(),
        collectionId: result.collectionId,
        front: result.front,
        back: result.back,
        tags: [],
        importance: result.importance,
        status: "active",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      return true;
    } finally {
      setBusy(false);
    }
  };

  return (
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
  );
}
