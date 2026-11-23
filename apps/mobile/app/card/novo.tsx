import { useLocalSearchParams, useRouter } from "expo-router";

import { NewCardScreen } from "@/features/card-editor";

export default function NewCardRoute() {
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
  return (
    <NewCardScreen
      initialCollectionId={collectionId}
      onDone={() => router.back()}
      onClose={() => router.back()}
    />
  );
}
