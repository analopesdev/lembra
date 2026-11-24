import { View } from "react-native";

import { FeedbackView } from "@/features/feedback";
import { useTheme } from "@/shared/ui/useTheme";

const noop = () => undefined;

export default function FeedbackPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background, width: 390, height: 844, overflow: "hidden" }}>
      <FeedbackView
        type="suggestion"
        onType={noop}
        message="Queria poder escolher o horário da virada do dia. Eu estudo de madrugada e às vezes a revisão conta para o dia errado."
        onMessage={noop}
        includeDevice
        onIncludeDevice={noop}
        replyTo="ana.lopes@email.com"
        sent={false}
        onSubmit={noop}
        onBack={noop}
      />
    </View>
  );
}
