import { TodayView } from "./TodayView";
import { useTodayModel } from "./useTodayModel";

type Props = { onStartSession?: () => void };

export function TodayScreen({ onStartSession }: Props) {
  return <TodayView model={useTodayModel()} onStartSession={onStartSession} />;
}
