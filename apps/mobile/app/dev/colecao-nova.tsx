import { View } from "react-native";

import { NewCollectionView } from "@/features/collections";
import { useTheme } from "@/shared/ui/useTheme";

const noop = () => undefined;

export default function NewCollectionPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background, width: 390, height: 844, overflow: "hidden" }}>
      <NewCollectionView
        name="Anatomia I"
        onName={noop}
        icon="bone"
        onIcon={noop}
        tone="tint"
        onTone={noop}
        exam="04/12/2026"
        onExam={noop}
        examDaysLeft={12}
        onSubmit={noop}
        onBack={noop}
      />
    </View>
  );
}
