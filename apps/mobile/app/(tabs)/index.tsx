import { useRouter } from "expo-router";

import { TodayScreen } from "@/features/today";

export default function Index() {
  const router = useRouter();
  return <TodayScreen onStartSession={() => router.push("/revisao/sessao")} />;
}
