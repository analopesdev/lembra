import { View } from "react-native";

import { SAMPLE_TODAY, TodayView } from "@/features/today";
import { BottomNav } from "@/shared/ui";
import { useTheme } from "@/shared/ui/useTheme";

import { Copy, CircleHelp, ChartColumn, House } from "lucide-react-native";

export default function TodayPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background, width: 390, height: 844, overflow: "hidden" }}>
      <TodayView model={SAMPLE_TODAY} />
      <BottomNav
        active="hoje"
        onSelect={() => undefined}
        onAdd={() => undefined}
        addLabel="Adicionar material"
        items={[
          { key: "hoje", label: "Hoje", icon: House },
          { key: "colecoes", label: "Coleções", icon: Copy },
          { key: "quizzes", label: "Quizzes", icon: CircleHelp },
          { key: "progresso", label: "Progresso", icon: ChartColumn },
        ]}
      />
    </View>
  );
}
