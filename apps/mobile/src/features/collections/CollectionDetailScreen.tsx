import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import type { CardListPage } from "@/data/repositories/cards";
import { diffDays, studyDayOf } from "@/domain/study-day/study-day";
import type { Collection } from "@/domain/types";
import { ConfirmSheet } from "@/shared/ui";

import { CollectionDetailView } from "./CollectionDetailView";

const PAGE = 30;

type Props = {
  collectionId: string;
  onBack: () => void;
  onEdit: () => void;
  onNewCard: () => void;
  onOpenCard: (id: string) => void;
  onDeleted: () => void;
};

export function CollectionDetailScreen({
  collectionId,
  onBack,
  onEdit,
  onNewCard,
  onOpenCard,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [page, setPage] = useState<CardListPage>({ items: [], hasMore: false });
  const [limit, setLimit] = useState(PAGE);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const offs: (() => void)[] = [];
    void getContainer().then((c) => {
      if (cancelled) return;
      setToday(studyDayOf(c.now(), Intl.DateTimeFormat().resolvedOptions().timeZone));
      offs.push(
        c.collections
          .watchAll()
          .subscribe((list) => setCollection(list.find((x) => x.id === collectionId) ?? null)),
        c.cards.watchCards({ collectionId, limit }).subscribe(setPage),
      );
    });
    return () => {
      cancelled = true;
      for (const off of offs) off();
    };
  }, [collectionId, limit]);

  const remove = async () => {
    setBusy(true);
    try {
      const c = await getContainer();
      await c.cards.softDeleteByCollection(collectionId);
      await c.collections.softDelete(collectionId);
      setConfirming(false);
      onDeleted();
    } finally {
      setBusy(false);
    }
  };

  if (!collection) return null;
  const days = collection.examDay === null || today === null ? null : diffDays(today, collection.examDay);
  return (
    <>
      <CollectionDetailView
        collection={collection}
        examDaysLeft={days !== null && days >= 0 ? days : null}
        cards={page.items}
        hasMore={page.hasMore}
        onLoadMore={() => setLimit((n) => n + PAGE)}
        onOpenCard={onOpenCard}
        onNewCard={onNewCard}
        onEdit={onEdit}
        onDelete={() => setConfirming(true)}
        onBack={onBack}
      />
      <ConfirmSheet
        visible={confirming}
        title={t("collection.delete.title")}
        message={t("collection.delete.message", { name: collection.name })}
        confirmLabel={t("collection.delete.confirm")}
        cancelLabel={t("common.cancel")}
        dismissLabel={t("common.close")}
        destructive
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
