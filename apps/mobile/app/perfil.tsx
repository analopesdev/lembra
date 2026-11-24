import { useRouter } from "expo-router";

import { ProfileScreen } from "@/features/settings";

export default function ProfileRoute() {
  const router = useRouter();
  return <ProfileScreen onBack={() => router.back()} />;
}
