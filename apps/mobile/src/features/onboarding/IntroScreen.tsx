import { useState } from "react";

import { IntroView, type IntroStep } from "./IntroView";

type Props = { onDone: () => void };

export function IntroScreen({ onDone }: Props) {
  const [step, setStep] = useState<IntroStep>(1);
  return (
    <IntroView
      step={step}
      onNext={() => (step === 3 ? onDone() : setStep((step + 1) as IntroStep))}
      onSkip={onDone}
    />
  );
}
