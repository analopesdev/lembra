import { useRouter } from "expo-router";

import { CollectionsListView } from "@/features/collections";
import { useTodayModel } from "@/features/today";

export default function CollectionsTab() {
  const router = useRouter();
  const model = useTodayModel();
  return (
    <CollectionsListView
      collections={model.collections}
      onOpen={(id) => router.push(`/colecao/${id}`)}
      onCreate={() => router.push("/colecao/nova")}
    />
  );
}
