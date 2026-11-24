import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { ReviewScreen } from "@/features/review-session";

export default function ReviewRoute() {
  const router = useRouter();
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => setReload((n) => n + 1), []));
  return (
    <ReviewScreen
      reloadSignal={reload}
      onEditCard={(id) => router.push(`/card/${id}`)}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/"))}
    />
  );
}
