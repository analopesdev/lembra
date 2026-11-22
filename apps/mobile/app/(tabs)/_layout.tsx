import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.today"), tabBarAccessibilityLabel: t("tabs.today") }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{ title: t("tabs.quizzes"), tabBarAccessibilityLabel: t("tabs.quizzes") }}
      />
      <Tabs.Screen
        name="colecoes"
        options={{ title: t("tabs.collections"), tabBarAccessibilityLabel: t("tabs.collections") }}
      />
      <Tabs.Screen
        name="progresso"
        options={{ title: t("tabs.progress"), tabBarAccessibilityLabel: t("tabs.progress") }}
      />
    </Tabs>
  );
}
