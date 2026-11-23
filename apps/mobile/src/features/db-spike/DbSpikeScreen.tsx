// SPIKE (ADR-0010): tela técnica que roda o contrato e as medições e publica o resultado em JSON.
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { runContract, runProbe, runSeed, runToday } from "./run";

type Phase = "contract" | "seed" | "today" | "probe";

export function DbSpikeScreen({ phase, n }: { phase: Phase; n: number }) {
  const [result, setResult] = useState<string>("executando…");

  useEffect(() => {
    const job =
      phase === "contract"
        ? runContract()
        : phase === "seed"
          ? runSeed(n)
          : phase === "probe"
            ? runProbe()
            : runToday();
    job
      .then((r) => {
        const out = { phase, ...r, pageToReadyMs: Math.round(performance.now()) };
        setResult(JSON.stringify(out));
      })
      .catch((e: unknown) =>
        setResult(
          JSON.stringify({ phase, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }),
        ),
      );
  }, [phase, n]);

  return (
    <View>
      <Text testID="spike-result">{result}</Text>
    </View>
  );
}
