import { useRouter } from "expo-router";

import { TodayView } from "./TodayView";
import { useTodayModel } from "./useTodayModel";

export function TodayScreen() {
  const router = useRouter();
  const model = useTodayModel();
  return (
    <TodayView
      model={model}
      onStartSession={() =>
        router.push({ pathname: "/review", params: { minutes: String(model.sessionMinutes) } })
      }
    />
  );
}
