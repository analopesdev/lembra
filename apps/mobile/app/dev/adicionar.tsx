import { View } from "react-native";

import { AddSheet } from "@/features/add-menu";
import { SAMPLE_TODAY, TodayView } from "@/features/today";
import { useTheme } from "@/shared/ui/useTheme";

export default function AddPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <TodayView model={SAMPLE_TODAY} />
      <AddSheet visible onClose={() => undefined} onChoose={() => undefined} />
    </View>
  );
}
