import { useLocalSearchParams, useRouter } from "expo-router";

import { NewCollectionScreen } from "@/features/collections";

export default function EditCollectionRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewCollectionScreen collectionId={id} onDone={() => router.back()} onBack={() => router.back()} />;
}
