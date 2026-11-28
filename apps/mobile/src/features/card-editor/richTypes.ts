import type { ReactNode } from "react";
import type { ContentDoc } from "@/domain/card/content";

export interface RichValue {
  readonly text: string;
  readonly doc: ContentDoc;
}

export type RichEditorProps = {
  label: string;
  initialDoc: ContentDoc | null;
  initialText: string;
  onChange: (value: RichValue) => void;
  error?: string;
  minHeight?: number;
  attachments?: ReactNode;
  onImage?: () => void;
  onAudio?: () => void;
};
