import { useRouter } from "expo-router";

import { IntroScreen } from "@/features/onboarding";

export default function IntroRoute() {
  const router = useRouter();
  return <IntroScreen onDone={() => router.replace("/ajustes-iniciais")} />;
}
