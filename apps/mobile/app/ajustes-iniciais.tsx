import { useRouter } from "expo-router";

import { SettingsScreen } from "@/features/onboarding";

export default function FirstSettingsRoute() {
  const router = useRouter();
  return <SettingsScreen onDone={() => router.replace("/")} />;
}
