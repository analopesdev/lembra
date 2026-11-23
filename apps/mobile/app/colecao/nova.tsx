import { useRouter } from "expo-router";

import { NewCollectionScreen } from "@/features/collections";

export default function NewCollectionRoute() {
  const router = useRouter();
  return <NewCollectionScreen onDone={() => router.back()} onBack={() => router.back()} />;
}
