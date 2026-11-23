import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { EmptyState } from "@/shared/ui";

import { ReviewView } from "./ReviewView";
import { SummaryView } from "./SummaryView";
import { useReviewSession } from "./useReviewSession";

function mmss(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Props = { onExit: () => void };

export function ReviewScreen({ onExit }: Props) {
  const { t } = useTranslation();
  const session = useReviewSession();
  if (session.status === "loading") return <EmptyState title={t("review.loading")} description="" />;
  if (session.status === "empty")
    return <EmptyState title={t("review.empty.title")} description={t("review.empty.text")} />;
  if (session.status === "finished" && session.summary)
    return <SummaryView summary={session.summary} onBack={onExit} />;
  if (!session.card) return <View />;
  return (
    <ReviewView
      card={{
        collectionName: session.card.collectionId,
        position: session.position,
        front: session.card.front,
        back: session.card.back,
        isRetry: session.isRetry,
      }}
      phase={session.phase}
      elapsedRatio={session.elapsedRatio}
      remainingLabel={mmss(session.remainingMs)}
      onClose={session.close}
      onReveal={session.reveal}
      onGrade={session.grade}
    />
  );
}
