import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  MAX_MESSAGE_LENGTH,
  validateFeedback,
  type FeedbackInput,
  type FeedbackType,
} from "@/domain/feedback/feedback";

import { FeedbackView } from "./FeedbackView";

type Props = {
  send: (input: FeedbackInput) => Promise<void>;
  onBack: () => void;
  replyTo: string | null;
};

export function FeedbackScreen({ send, onBack, replyTo }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [includeDevice, setIncludeDevice] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const result = validateFeedback({ type, message, includeDeviceInfo: includeDevice });
    if (!result.ok) {
      setSent(false);
      setError(t(`feedback.errors.${result.error}`, { max: MAX_MESSAGE_LENGTH }));
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await send(result.input);
      setMessage("");
      setSent(true);
    } catch {
      setSent(false);
      setError(t("feedback.errors.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FeedbackView
      type={type}
      onType={setType}
      message={message}
      onMessage={(v) => {
        setMessage(v);
        setSent(false);
      }}
      includeDevice={includeDevice}
      onIncludeDevice={setIncludeDevice}
      replyTo={replyTo}
      error={error}
      sent={sent}
      busy={busy}
      onSubmit={() => void submit()}
      onBack={onBack}
    />
  );
}
