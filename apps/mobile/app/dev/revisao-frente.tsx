import { View } from "react-native";

import { ReviewView } from "@/features/review-session";
import { useTheme } from "@/shared/ui/useTheme";

const noop = () => undefined;

export default function ReviewPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background, width: 390, height: 844, overflow: "hidden" }}>
      <ReviewView
        card={{
          collectionName: "Anatomia I",
          position: { current: 18, total: 42 },
          front: "Em qual plano ocorre a flexão do cotovelo, e em torno de qual eixo?",
          back: "Plano sagital, em torno do eixo coronal (látero-lateral).",
          isRetry: false,
        }}
        phase="front"
        elapsedRatio={0.42}
        remainingLabel="4:12"
        onClose={noop}
        onReveal={noop}
        onGrade={noop}
      />
    </View>
  );
}
