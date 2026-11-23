import { TodayView } from "./TodayView";
import { useTodayModel } from "./useTodayModel";

export function TodayScreen() {
  return <TodayView model={useTodayModel()} />;
}
