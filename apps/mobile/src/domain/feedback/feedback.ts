export const MAX_MESSAGE_LENGTH = 2000;

export type FeedbackType = "suggestion" | "problem" | "complaint";
export type FeedbackError = "empty" | "too_long";

export interface FeedbackInput {
  readonly type: FeedbackType;
  readonly message: string;
  readonly includeDeviceInfo: boolean;
}

export type FeedbackResult = { ok: true; input: FeedbackInput } | { ok: false; error: FeedbackError };

export function validateFeedback(input: FeedbackInput): FeedbackResult {
  const message = input.message.trim();
  if (message === "") return { ok: false, error: "empty" };
  if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, error: "too_long" };
  return { ok: true, input: { ...input, message } };
}
