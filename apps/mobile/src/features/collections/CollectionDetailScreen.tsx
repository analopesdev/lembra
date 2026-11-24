import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getContainer } from "@/data/container";
import type { CardListPage } from "@/data/repositories/cards";
import { diffDays, studyDayOf } from "@/domain/study-day/study-day";
import type { Collection } from "@/domain/types";
import { ConfirmSheet } from "@/shared/ui";

import { useTodayModel } from "@/features/today";

import { cardRowKind, dueLabel } from "./cardRow";
import { CollectionDetailView, type CardListRow } from "./CollectionDetailView";

const PAGE = 30;

type Props = {
  collectionId: string;
  onBack: () => void;
  onEdit: () => void;
  onNewCard: () => void;
  onStudy: () => void;
  onOpenCard: (id: string) => void;
  onDeleted: () => void;
};

export function CollectionDetailScreen({
  collectionId,
  onBack,
  onEdit,
  onNewCard,
  onStudy,
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
  const [dues, setDues] = useState<ReadonlyMap<string, Date>>(new Map());
  const model = useTodayModel();

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

  useEffect(() => {
    let cancelled = false;
    void getContainer().then(async (c) => {
      const states = await Promise.all(page.items.map((card) => c.cards.getState(card.id)));
      if (cancelled) return;
      setDues(
        new Map(page.items.flatMap((card, i) => (states[i] ? [[card.id, states[i].due] as const] : []))),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

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
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stats = model.collections.find((x) => x.id === collectionId);
  const visible = page.items.filter((c) => c.status !== "draft");
  const rows: CardListRow[] = visible.map((c) => {
    const due = dues.get(c.id);
    const untilDue = due && today ? diffDays(today, studyDayOf(due, tz)) : 0;
    return {
      id: c.id,
      front: c.front,
      kind: cardRowKind(untilDue),
      due: dueLabel(untilDue, t("collection.detail.dueToday")),
      suspended: c.status === "suspended",
    };
  });
  return (
    <>
      <CollectionDetailView
        name={collection.name}
        readinessPct={Math.round((stats?.progress ?? 0) * 100)}
        targetPct={model.retentionTargetPct}
        examDaysLeft={days !== null && days >= 0 ? days : null}
        dueCount={stats?.dueToday ?? 0}
        cardCount={stats?.cardCount ?? page.items.length}
        draftCount={page.items.length - visible.length}
        rows={rows}
        hasMore={page.hasMore}
        onLoadMore={() => setLimit((n) => n + PAGE)}
        onStudy={onStudy}
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
