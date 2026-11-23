import { ChartColumn, CircleHelp, Copy, House } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AddSheet, type AddChoice } from "@/features/add-menu";
import { BottomNav, type NavItem } from "@/shared/ui";

const ROUTE_TO_KEY: Record<string, string> = {
  index: "hoje",
  colecoes: "colecoes",
  quizzes: "quizzes",
  progresso: "progresso",
};
const KEY_TO_ROUTE: Record<string, string> = {
  hoje: "index",
  colecoes: "colecoes",
  quizzes: "quizzes",
  progresso: "progresso",
};

type Props = {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onChoose?: (choice: AddChoice) => void;
};

export function AppTabBar({ activeRoute, onNavigate, onChoose }: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const items: NavItem[] = [
    { key: "hoje", label: t("tabs.today"), icon: House },
    { key: "colecoes", label: t("tabs.collections"), icon: Copy },
    { key: "quizzes", label: t("tabs.quizzes"), icon: CircleHelp },
    { key: "progresso", label: t("tabs.progress"), icon: ChartColumn },
  ];
  return (
    <>
      <BottomNav
        items={items}
        active={ROUTE_TO_KEY[activeRoute] ?? "hoje"}
        onSelect={(key) => onNavigate(KEY_TO_ROUTE[key] ?? "index")}
        onAdd={() => setAdding(true)}
        addLabel={t("tabs.add")}
      />
      <AddSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onChoose={(choice) => {
          setAdding(false);
          onChoose?.(choice);
        }}
      />
    </>
  );
}
