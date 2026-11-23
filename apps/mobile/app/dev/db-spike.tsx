import { useLocalSearchParams } from "expo-router";

import { DbSpikeScreen } from "@/features/db-spike";

export default function DbSpikeRoute() {
  const { phase = "contract", n = "10000" } = useLocalSearchParams<{ phase?: string; n?: string }>();
  const p = phase === "seed" || phase === "today" || phase === "probe" ? phase : "contract";
  return <DbSpikeScreen phase={p} n={Number(n)} />;
}
