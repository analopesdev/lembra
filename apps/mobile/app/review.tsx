import { useLocalSearchParams, useRouter } from "expo-router";

import { ReviewScreen } from "@/features/review";

const DEFAULT_MINUTES = 10;

export default function Review() {
  const router = useRouter();
  const { minutes } = useLocalSearchParams<{ minutes?: string }>();
  const parsed = Number(minutes);
  return (
    <ReviewScreen
      minutes={Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MINUTES}
      onClose={() => router.replace("/")}
    />
  );
}
