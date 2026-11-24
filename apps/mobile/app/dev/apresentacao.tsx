import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { IntroView, type IntroStep } from "@/features/onboarding";

const noop = () => undefined;

export default function IntroPreview() {
  const { step = "1" } = useLocalSearchParams<{ step?: string }>();
  const n = (Number(step) >= 1 && Number(step) <= 3 ? Number(step) : 1) as IntroStep;
  return (
    <View style={{ flex: 1, width: 390, height: 844, overflow: "hidden" }}>
      <IntroView step={n} onNext={noop} onSkip={noop} />
    </View>
  );
}
