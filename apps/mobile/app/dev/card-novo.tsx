import { View } from "react-native";

import { NewCardView } from "@/features/card-editor";
import { useTheme } from "@/shared/ui/useTheme";

const noop = () => undefined;
const at = new Date("2026-03-10T10:00:00Z");
const collection = (id: string, name: string) => ({
  id,
  name,
  icon: "bone" as const,
  tone: "tint" as const,
  examDay: null,
  createdAt: at,
  updatedAt: at,
  deletedAt: null,
});

export default function NewCardPreview() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.background, width: 390, height: 844, overflow: "hidden" }}>
      <NewCardView
        front="Qual músculo é o principal flexor do cotovelo?"
        onFront={noop}
        back="Braquial"
        onBack={noop}
        collections={[collection("a", "Anatomia I"), collection("b", "Fisiologia")]}
        collectionId="a"
        onCollection={noop}
        importance={3}
        onImportance={noop}
        errors={{}}
        savedNotice={false}
        onSave={noop}
        onSaveAndNew={noop}
        onClose={noop}
      />
    </View>
  );
}
