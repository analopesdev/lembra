import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getContainer, type Container } from "@/data/container";
import type { CardWithState } from "@/domain/types";
import { Text } from "@/shared/ui";
import { useTheme } from "@/shared/ui/useTheme";

import { buildQueue } from "./queue";
import { ReviewRunner } from "./ReviewRunner";

type Props = { minutes: number; onClose: () => void };

type Loaded = { container: Container; queue: readonly CardWithState[] };

export function ReviewScreen({ minutes, onClose }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getContainer().then((container) => {
      const now = container.now();
      const off = container.cards.watchDue(now).subscribe((due) => {
        off();
        if (cancelled) return;
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLoaded({ container, queue: buildQueue(due, now, minutes, zone) });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [minutes]);

  if (!loaded) {
    return (
      <View
        style={{ flex: 1, backgroundColor: t.background, alignItems: "center", justifyContent: "center" }}
      >
        <Text variant="corpo" tone="textMuted">
          {tr("review.loading")}
        </Text>
      </View>
    );
  }
  return <ReviewRunner queue={loaded.queue} minutes={minutes} deps={loaded.container} onClose={onClose} />;
}
