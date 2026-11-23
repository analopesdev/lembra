import type { TodayModel } from "./model";

export const SAMPLE_TODAY: TodayModel = {
  userName: "Ana",
  memoryRetained: 342,
  memoryRatio: 0.88,
  streakDays: 14,
  retentionPct: 88,
  retentionTargetPct: 90,
  week: [
    { key: "mon", status: "done" },
    { key: "tue", status: "done" },
    { key: "wed", status: "done" },
    { key: "thu", status: "frozen" },
    { key: "fri", status: "done" },
    { key: "sat", status: "done" },
    { key: "sun", status: "today" },
  ],
  dueCount: 42,
  sessionMinutes: 10,
  caughtUpInDays: null,
  collections: [
    { id: "c1", name: "Anatomia I", dueToday: 18, progress: 0.62, tone: "tint", icon: "bone" },
    { id: "c2", name: "Fisiologia", dueToday: 15, progress: 0.4, tone: "collection2", icon: "heart" },
    { id: "c3", name: "Bioquímica", dueToday: 9, progress: 0.8, tone: "collection3", icon: "flask" },
  ],
  exam: { name: "Anatomia I", daysLeft: 12, readinessPct: 78 },
};
