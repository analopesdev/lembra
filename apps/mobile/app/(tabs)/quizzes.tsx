import { useTranslation } from "react-i18next";

import { EmptyState } from "@/shared/ui";

export default function Screen() {
  const { t } = useTranslation();
  return <EmptyState title={t("tabs.quizzes")} description={t("empty.description")} />;
}
