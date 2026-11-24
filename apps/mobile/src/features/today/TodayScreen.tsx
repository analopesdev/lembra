import { TodayView } from "./TodayView";
import { useTodayModel } from "./useTodayModel";

type Props = { onStartSession?: () => void; onOpenProfile?: () => void };

export function TodayScreen({ onStartSession, onOpenProfile }: Props) {
  return <TodayView model={useTodayModel()} onStartSession={onStartSession} onOpenProfile={onOpenProfile} />;
}
