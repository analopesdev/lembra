import { useRouter } from "expo-router";

import { ReviewScreen } from "@/features/review-session";

export default function ReviewRoute() {
  const router = useRouter();
  return <ReviewScreen onExit={() => router.replace("/")} />;
}
