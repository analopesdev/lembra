import { useLocalSearchParams, useRouter } from "expo-router";

import { NewCardScreen } from "@/features/card-editor";

export default function EditCardRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewCardScreen cardId={id} onDone={() => router.back()} onClose={() => router.back()} />;
}
